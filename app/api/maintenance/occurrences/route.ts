import { type NextRequest, NextResponse } from "next/server"
import { toCamelCase, getDbSql } from "@/lib/db"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request)
  if (response) {
    return response
  }

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDbSql();
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "12", 10)
    const offset = (page - 1) * limit
    
    const isManager = hasPermission(user, 'maintenance:read');

    const result = await sql`
      SELECT 
        mo.*,
        mt.title as template_title,
        mt.site_location as template_site_location,
        mt.description as template_description,
        au.first_name as assigned_first_name, au.last_name as assigned_last_name
      FROM maintenance_occurrences mo
      JOIN maintenance_templates mt ON mo.template_id = mt.id
      LEFT JOIN users au ON mo.assigned_to = au.id
      ${isManager ? sql`` : sql`WHERE mo.assigned_to = ${user.id}`}
      ORDER BY mo.scheduled_date ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const [{ count }] = await sql`
      SELECT COUNT(*) as count
      FROM maintenance_occurrences mo
      JOIN maintenance_templates mt ON mo.template_id = mt.id
      ${isManager ? sql`` : sql`WHERE mo.assigned_to = ${user.id}`}
    `;

    const occurrences = result.map((row: any) => {
      const occurrence = toCamelCase(row)

      // Build nested template object
      if (occurrence.templateTitle) {
        occurrence.template = {
          id: occurrence.templateId,
          title: occurrence.templateTitle,
          siteLocation: occurrence.templateSiteLocation,
          description: occurrence.templateDescription,
        }
      }

      // Build nested assigned user object
      if (occurrence.assignedFirstName) {
        occurrence.assignedUser = {
          id: occurrence.assignedTo,
          firstName: occurrence.assignedFirstName,
          lastName: occurrence.assignedLastName,
        }
      }

      // Clean up flat fields
      delete occurrence.templateTitle
      delete occurrence.templateSiteLocation
      delete occurrence.templateDescription
      delete occurrence.assignedFirstName
      delete occurrence.assignedLastName

      return occurrence
    })

    return NextResponse.json({
      occurrences,
      total: parseInt(count, 10),
      page,
      limit,
    })
  } catch (error) {
    console.error("Maintenance occurrences fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}