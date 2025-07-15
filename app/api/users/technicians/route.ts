import { type NextRequest, NextResponse } from "next/server"
import { toCamelCase, getDbSql } from "@/lib/db"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request)
  if (response) {
    return response
  }

  if (!user || !hasPermission(user, 'users:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const sql = getDbSql()
    const result = await sql`
      SELECT
        u.id, u.first_name, u.last_name, u.email, u.phone, u.status,
        COUNT(j.id) AS total_jobs,
        COUNT(CASE WHEN j.status = 'completed' THEN j.id END) AS completed_jobs,
        AVG(jt.rating) AS avg_rating,
        SUM(av.earned_amount) AS total_earned
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN job_technicians jt ON u.id = jt.technician_id
      LEFT JOIN jobs j ON jt.job_id = j.id
      LEFT JOIN accrued_values av ON u.id = av.user_id
      WHERE r.name = 'Technician' AND u.status = 'active'
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.status
      ORDER BY u.first_name, u.last_name
    `

    const technicians = result.map((row: any) => {
      const camelCaseRow = toCamelCase(row);
      return {
        ...camelCaseRow,
        stats: {
          totalJobs: parseInt(camelCaseRow.totalJobs || 0),
          completedJobs: parseInt(camelCaseRow.completedJobs || 0),
          avgRating: parseFloat(camelCaseRow.avgRating || 0),
          totalEarned: parseFloat(camelCaseRow.totalEarned || 0),
        }
      };
    })

    return NextResponse.json(technicians)
  } catch (error) {
    console.error("Technicians fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
