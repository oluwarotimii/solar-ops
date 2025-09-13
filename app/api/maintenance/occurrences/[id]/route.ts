import { type NextRequest, NextResponse } from "next/server";
import { toCamelCase, getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

// GET a single maintenance occurrence
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
    console.error("Maintenance occurrence fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// UPDATE a maintenance occurrence (e.g., change status)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  const isAdmin = hasPermission(user, 'maintenance:update');

  try {
    const sql = getDbSql();
    const occurrenceData = await request.json();

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

    // Case 1: Job marked as completed
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

        const monthlyValue = template.job_value / 12;

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
    }
    // Case 2: Job no longer completed
    else if (newStatus !== 'completed' && previousStatus === 'completed') {
      await sql`
        DELETE FROM accrued_values WHERE maintenance_occurrence_id = ${params.id}
      `;
    }

    return NextResponse.json(toCamelCase(updatedOccurrence));
  } catch (error) {
    console.error("Maintenance occurrence update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}