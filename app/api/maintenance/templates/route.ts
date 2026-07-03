import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { toCamelCase, getDbSql } from "@/lib/db"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"

interface TemplateRow {
  id: string;
  title: string;
  description: string | null;
  site_location: string | null;
  job_value: number | null;
  assigned_to: string | null;
  created_by: string | null;
  recurrence_type: string;
  recurrence_interval: number | null;
  day_of_week: number | null;
  day_of_month: number | null;
  month_of_year: number | null;
  is_active: boolean | null;
  created_at: Date;
  assigned_first_name: string | null;
  assigned_last_name: string | null;
  created_first_name: string | null;
  created_last_name: string | null;
  [key: string]: unknown;
}

const createTemplateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  siteLocation: z.string().optional().nullable(),
  jobValue: z.number().optional().default(0),
  assignedTo: z.string().optional().nullable(),
  recurrenceType: z.string().min(1),
  recurrenceInterval: z.number().int().optional().default(1),
  dayOfWeek: z.number().int().optional().nullable(),
  dayOfMonth: z.number().int().optional().nullable(),
  monthOfYear: z.number().int().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request)
  if (response) {
    return response
  }

  if (!user || !hasPermission(user, 'maintenance:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const sql = getDbSql();

    const result = await sql`
      SELECT 
        mt.*,
        au.first_name as assigned_first_name, au.last_name as assigned_last_name,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM maintenance_templates mt
      LEFT JOIN users au ON mt.assigned_to = au.id
      LEFT JOIN users cu ON mt.created_by = cu.id
      ORDER BY mt.created_at DESC
    `

    const templates = result.map((row: TemplateRow) => {
      const template = toCamelCase(row)

      if (template.assignedFirstName) {
        template.assignedUser = {
          id: template.assignedTo,
          firstName: template.assignedFirstName,
          lastName: template.assignedLastName,
        }
      }

      if (template.createdFirstName) {
        template.createdUser = {
          id: template.createdBy,
          firstName: template.createdFirstName,
          lastName: template.createdLastName,
        }
      }

      delete template.assignedFirstName
      delete template.assignedLastName
      delete template.createdFirstName
      delete template.createdLastName

      return template
    })

    return NextResponse.json(templates)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { generateOccurrences } from "@/lib/maintenance";

export async function POST(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request)
  if (response) {
    return response
  }

  if (!user || !hasPermission(user, 'maintenance:create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = createTemplateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 })
    }

    const templateData = parsed.data
    const sql = getDbSql();

    const [template] = await sql`
      INSERT INTO maintenance_templates (
        title, description, site_location, job_value, assigned_to, created_by,
        recurrence_type, recurrence_interval, day_of_week, day_of_month, month_of_year, is_active
      ) VALUES (
        ${templateData.title},
        ${templateData.description || null},
        ${templateData.siteLocation || null},
        ${templateData.jobValue || 0},
        ${templateData.assignedTo || null},
        ${user.id},
        ${templateData.recurrenceType},
        ${templateData.recurrenceInterval || 1},
        ${templateData.dayOfWeek !== undefined && templateData.dayOfWeek !== null ? Number(templateData.dayOfWeek) : null},
        ${templateData.dayOfMonth !== undefined && templateData.dayOfMonth !== null ? Number(templateData.dayOfMonth) : null},
        ${templateData.monthOfYear !== undefined && templateData.monthOfYear !== null ? Number(templateData.monthOfYear) : null},
        ${'isActive' in templateData ? templateData.isActive : true}
      ) RETURNING *
    `

    if (template) {
      await generateOccurrences(template);
    }

    return NextResponse.json({
      id: template.id,
      message: "Maintenance template created successfully",
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
