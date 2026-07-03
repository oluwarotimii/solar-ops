import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toCamelCase, getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

const updateOccurrenceSchema = z.object({
  status: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  priority: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'maintenance:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDbSql();
    const [occurrence] = await sql`
      SELECT * FROM maintenance_occurrences WHERE id = ${params.id}
    `;

    if (!occurrence) {
      return NextResponse.json({ error: "Occurrence not found" }, { status: 404 });
    }

    return NextResponse.json(toCamelCase(occurrence));
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  const isAdmin = hasPermission(user, 'maintenance:update');

  try {
    const body = await request.json();
    const parsed = updateOccurrenceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
    }

    const occurrenceData = parsed.data;
    const sql = getDbSql();

    const [currentOccurrence] = await sql`
      SELECT assigned_to, status, scheduled_date FROM maintenance_occurrences WHERE id = ${params.id}
    `;

    if (!currentOccurrence) {
      return NextResponse.json({ error: "Occurrence not found" }, { status: 404 });
    }

    if (!isAdmin) {
      if (currentOccurrence.assigned_to !== user.id) {
        return NextResponse.json({ error: 'Forbidden: You are not assigned to this task' }, { status: 403 });
      }

      const today = new Date();
      const scheduledDate = new Date(currentOccurrence.scheduled_date);
      if (scheduledDate.getMonth() !== today.getMonth() || scheduledDate.getFullYear() !== today.getFullYear()) {
        return NextResponse.json({ error: 'Forbidden: You can only complete tasks scheduled for the current month' }, { status: 403 });
      }

      if (Object.keys(occurrenceData).length > 1 || !occurrenceData.status || occurrenceData.status !== 'completed') {
        return NextResponse.json({ error: 'Forbidden: You can only mark tasks as completed' }, { status: 403 });
      }
    }

    const [updatedOccurrence] = await sql`
      UPDATE maintenance_occurrences
      SET
        status = ${occurrenceData.status || currentOccurrence.status},
        assigned_to = ${isAdmin ? occurrenceData.assignedTo || currentOccurrence.assigned_to : currentOccurrence.assigned_to},
        priority = ${isAdmin ? occurrenceData.priority || 'medium' : 'medium'},
        completed_at = ${occurrenceData.status === 'completed' ? new Date() : null}
      WHERE id = ${params.id}
      RETURNING *
    `;

    const previousStatus = currentOccurrence.status;
    const newStatus = updatedOccurrence.status;

    if (newStatus === 'completed' && previousStatus !== 'completed') {
      const [template] = await sql`
        SELECT mt.job_value 
        FROM maintenance_templates mt
        JOIN maintenance_occurrences mo ON mo.template_id = mt.id
        WHERE mo.id = ${params.id}
      `;

      if (template && template.job_value > 0) {
        const completionDate = new Date();
        const [existingAccrued] = await sql`SELECT id FROM accrued_values WHERE maintenance_occurrence_id = ${updatedOccurrence.id}`;

        const monthlyValue = template.job_value;

        if (existingAccrued) {
          await sql`
            UPDATE accrued_values
            SET 
              job_value = ${template.job_value},
              earned_amount = ${monthlyValue},
              user_id = ${updatedOccurrence.assigned_to},
              month = ${completionDate.getMonth() + 1},
              year = ${completionDate.getFullYear()}
            WHERE id = ${existingAccrued.id};
          `;
        } else {
          await sql`
            INSERT INTO accrued_values (user_id, maintenance_occurrence_id, job_value, earned_amount, month, year, created_at)
            VALUES (
              ${updatedOccurrence.assigned_to},
              ${updatedOccurrence.id},
              ${template.job_value},
              ${monthlyValue},
              ${completionDate.getMonth() + 1},
              ${completionDate.getFullYear()},
              ${completionDate}
            );
          `;
        }
      }
      
      await logAuditEvent({
        userId: user.id,
        action: "maintenance_occurrence_completed",
        targetType: "maintenance_occurrence",
        targetId: params.id,
        details: {
          status: newStatus,
          previousStatus: previousStatus,
          assignedTo: updatedOccurrence.assigned_to
        },
        request,
      });
    }
    else if (newStatus !== 'completed' && previousStatus === 'completed') {
      await sql`
        DELETE FROM accrued_values WHERE maintenance_occurrence_id = ${params.id}
      `;
      
      await logAuditEvent({
        userId: user.id,
        action: "maintenance_occurrence_status_changed",
        targetType: "maintenance_occurrence",
        targetId: params.id,
        details: {
          status: newStatus,
          previousStatus: previousStatus,
          assignedTo: updatedOccurrence.assigned_to
        },
        request,
      });
    }
    else if (newStatus !== previousStatus) {
      await logAuditEvent({
        userId: user.id,
        action: "maintenance_occurrence_status_changed",
        targetType: "maintenance_occurrence",
        targetId: params.id,
        details: {
          status: newStatus,
          previousStatus: previousStatus,
          assignedTo: updatedOccurrence.assigned_to
        },
        request,
      });
    }

    return NextResponse.json(toCamelCase(updatedOccurrence));
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'maintenance:delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDbSql();
    
    await sql`
      DELETE FROM accrued_values WHERE maintenance_occurrence_id = ${params.id}
    `;
    
    const result = await sql`
      DELETE FROM maintenance_occurrences WHERE id = ${params.id}
    `;

    if (result.count === 0) {
      return NextResponse.json({ error: "Occurrence not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Maintenance occurrence deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
