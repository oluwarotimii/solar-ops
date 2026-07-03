import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { toCamelCase, getDbSql } from "@/lib/db"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"

interface OccurrenceRow {
  id: string;
  template_id: string;
  scheduled_date: Date;
  assigned_to: string | null;
  status: string;
  priority: string | null;
  completed_at: Date | null;
  created_at: Date;
  template_title: string;
  template_site_location: string | null;
  template_description: string | null;
  assigned_first_name: string | null;
  assigned_last_name: string | null;
  [key: string]: unknown;
}

const createOccurrenceSchema = z.object({
  templateId: z.string().min(1),
  scheduledDate: z.string().min(1),
  status: z.string().optional().default('pending'),
  assignedTo: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request)
  if (response) {
    return response
  }

  if (!user || !hasPermission(user, 'maintenance:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDbSql();
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "12", 10)
    const offset = (page - 1) * limit
    
    let assignedToFilter = sql``;
    if (user.role.permissions.all === true) {
      assignedToFilter = sql``;
    } else if (!hasPermission(user, 'maintenance:read:all')) {
      assignedToFilter = sql`AND mo.assigned_to = ${user.id}`;
    }

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
      WHERE mt.is_active = true
      ${assignedToFilter}
      ORDER BY mo.scheduled_date ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const [{ count }] = await sql`
      SELECT COUNT(*) as count
      FROM maintenance_occurrences mo
      JOIN maintenance_templates mt ON mo.template_id = mt.id
      WHERE mt.is_active = true
      ${assignedToFilter}
    `;

    const occurrences = result.map((row: OccurrenceRow) => {
      const occurrence = toCamelCase(row)

      if (occurrence.templateTitle) {
        occurrence.template = {
          id: occurrence.templateId,
          title: occurrence.templateTitle,
          siteLocation: occurrence.templateSiteLocation,
          description: occurrence.templateDescription,
        }
      }

      if (occurrence.assignedFirstName) {
        occurrence.assignedUser = {
          id: occurrence.assignedTo,
          firstName: occurrence.assignedFirstName,
          lastName: occurrence.assignedLastName,
        }
      }

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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
    const parsed = createOccurrenceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 })
    }

    const occurrenceData = parsed.data
    const sql = getDbSql();

    const [occurrence] = await sql`
      INSERT INTO maintenance_occurrences (
        template_id, scheduled_date, status, assigned_to
      ) VALUES (
        ${occurrenceData.templateId},
        ${occurrenceData.scheduledDate},
        ${occurrenceData.status || 'pending'},
        ${occurrenceData.assignedTo || null}
      ) RETURNING *
    `

    return NextResponse.json({
      id: occurrence.id,
      message: "Maintenance occurrence created successfully",
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
