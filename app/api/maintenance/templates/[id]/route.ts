import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toCamelCase, getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

const updateTemplateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  siteLocation: z.string().optional().nullable(),
  jobValue: z.number().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  recurrenceType: z.string(),
  recurrenceInterval: z.number().int().optional().nullable(),
  dayOfWeek: z.number().int().optional().nullable(),
  dayOfMonth: z.number().int().optional().nullable(),
  monthOfYear: z.number().int().optional().nullable(),
  isActive: z.boolean().optional().nullable(),
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

    const processedTemplate = toCamelCase(template);

    if (processedTemplate.assignedFirstName) {
      processedTemplate.assignedUser = {
        id: processedTemplate.assignedTo,
        firstName: processedTemplate.assignedFirstName,
        lastName: processedTemplate.assignedLastName,
      }
    }

    if (processedTemplate.createdFirstName) {
      processedTemplate.createdUser = {
        id: processedTemplate.createdBy,
        firstName: processedTemplate.createdFirstName,
        lastName: processedTemplate.createdLastName,
      }
    }

    delete processedTemplate.assignedFirstName;
    delete processedTemplate.assignedLastName;
    delete processedTemplate.createdFirstName;
    delete processedTemplate.createdLastName;

    return NextResponse.json(processedTemplate);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { generateOccurrences } from "@/lib/maintenance";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'maintenance:update')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
    }

    const templateData = parsed.data;
    const sql = getDbSql();

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

    await generateOccurrences(updatedTemplate);

    return NextResponse.json(toCamelCase(updatedTemplate));
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
      DELETE FROM accrued_values 
      WHERE maintenance_occurrence_id IN (
        SELECT id FROM maintenance_occurrences WHERE template_id = ${params.id}
      )
    `;
    
    const result = await sql`
      DELETE FROM maintenance_templates WHERE id = ${params.id}
    `;

    if (result.count === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Maintenance template and its occurrences deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
