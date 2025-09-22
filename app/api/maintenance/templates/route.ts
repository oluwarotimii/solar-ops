import { type NextRequest, NextResponse } from "next/server"
import { toCamelCase, getDbSql } from "@/lib/db"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"

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

    const templates = result.map((row: any) => {
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
    console.error("Maintenance templates fetch error:", error)
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
    const sql = getDbSql();
    const templateData = await request.json()

    if (!templateData.title || !templateData.recurrenceType) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

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

    // Generate initial occurrences. This can be moved to a background job for better performance.
    if (template) {
      await generateOccurrences(template);
    }

    return NextResponse.json({
      id: template.id,
      message: "Maintenance template created successfully",
    }, { status: 201 })
  } catch (error) {
    console.error("Maintenance template creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
