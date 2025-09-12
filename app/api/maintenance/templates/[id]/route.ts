import { type NextRequest, NextResponse } from "next/server";
import { toCamelCase, getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

// GET a single maintenance template
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
    const [template] = await sql`
      SELECT * FROM maintenance_templates WHERE id = ${params.id}
    `;

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(toCamelCase(template));
  } catch (error) {
    console.error("Maintenance template fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// UPDATE a maintenance template
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'maintenance:update')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDbSql();
    const templateData = await request.json();

    const [updatedTemplate] = await sql`
      UPDATE maintenance_templates
      SET
        title = ${templateData.title},
        description = ${templateData.description},
        site_location = ${templateData.siteLocation},
        job_value = ${templateData.jobValue},
        assigned_to = ${templateData.assignedTo},
        recurrence_type = ${templateData.recurrenceType},
        recurrence_interval = ${templateData.recurrenceInterval},
        is_active = ${templateData.isActive}
      WHERE id = ${params.id}
      RETURNING *
    `;

    if (!updatedTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Note: You might want to regenerate occurrences if the recurrence pattern changes.
    // This is a complex task and is omitted for now.

    return NextResponse.json(toCamelCase(updatedTemplate));
  } catch (error) {
    console.error("Maintenance template update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE a maintenance template
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
    
    // Deleting a template will also delete all its occurrences due to ON DELETE CASCADE
    const result = await sql`
      DELETE FROM maintenance_templates WHERE id = ${params.id}
    `;

    if (result.count === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Maintenance template and its occurrences deleted successfully" });
  } catch (error) {
    console.error("Maintenance template delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}