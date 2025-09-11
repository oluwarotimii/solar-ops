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

  // Any authenticated user can update a maintenance task they are assigned to, or managers can update any.
  const canUpdate = hasPermission(user, 'maintenance:update');

  try {
    const sql = getDbSql();
    const occurrenceData = await request.json();

    const [currentOccurrence] = await sql`
      SELECT assigned_to FROM maintenance_occurrences WHERE id = ${params.id}
    `;

    if (!currentOccurrence) {
      return NextResponse.json({ error: "Occurrence not found" }, { status: 404 });
    }

    // A technician can only update a task assigned to them. A manager can update any.
    if (!canUpdate && currentOccurrence.assigned_to !== user.id) {
        return NextResponse.json({ error: 'Forbidden: You are not assigned to this task' }, { status: 403 });
    }

    const [updatedOccurrence] = await sql`
      UPDATE maintenance_occurrences
      SET
        status = ${occurrenceData.status},
        assigned_to = ${occurrenceData.assignedTo},
        priority = ${occurrenceData.priority},
        completed_at = ${occurrenceData.status === 'completed' ? new Date() : null}
      WHERE id = ${params.id}
      RETURNING *
    `;

    return NextResponse.json(toCamelCase(updatedOccurrence));
  } catch (error) {
    console.error("Maintenance occurrence update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}