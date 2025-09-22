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
      SELECT 
        mt.*,
        au.first_name as assigned_first_name, au.last_name as assigned_last_name,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM maintenance_templates mt
      LEFT JOIN users au ON mt.assigned_to = au.id
      LEFT JOIN users cu ON mt.created_by = cu.id
      WHERE mt.id = ${params.id}
    `;

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Process the template to create nested user objects
    const processedTemplate = toCamelCase(template);

    // Create assignedUser object if assigned user exists
    if (processedTemplate.assignedFirstName) {
      processedTemplate.assignedUser = {
        id: processedTemplate.assignedTo,
        firstName: processedTemplate.assignedFirstName,
        lastName: processedTemplate.assignedLastName,
      }
    }

    // Create createdUser object if created user exists
    if (processedTemplate.createdFirstName) {
      processedTemplate.createdUser = {
        id: processedTemplate.createdBy,
        firstName: processedTemplate.createdFirstName,
        lastName: processedTemplate.createdLastName,
      }
    }

    // Clean up temporary fields but preserve assignedTo
    delete processedTemplate.assignedFirstName;
    delete processedTemplate.assignedLastName;
    delete processedTemplate.createdFirstName;
    delete processedTemplate.createdLastName;

    return NextResponse.json(processedTemplate);
  } catch (error) {
    console.error("Maintenance template fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { generateOccurrences } from "@/lib/maintenance";

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
        assigned_to = ${templateData.assignedTo || null},
        recurrence_type = ${templateData.recurrenceType},
        recurrence_interval = ${templateData.recurrenceInterval},
        day_of_week = ${templateData.dayOfWeek !== undefined && templateData.dayOfWeek !== null ? Number(templateData.dayOfWeek) : null},
        day_of_month = ${templateData.dayOfMonth !== undefined && templateData.dayOfMonth !== null ? Number(templateData.dayOfMonth) : null},
        month_of_year = ${templateData.monthOfYear !== undefined && templateData.monthOfYear !== null ? Number(templateData.monthOfYear) : null},
        is_active = ${templateData.isActive}
      WHERE id = ${params.id}
      RETURNING *
    `;

    if (!updatedTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Regenerate occurrences when the template is updated
    await generateOccurrences(updatedTemplate);

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
