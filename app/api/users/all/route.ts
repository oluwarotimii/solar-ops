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
        id, first_name, last_name
      FROM users
      WHERE status = 'active'
      ORDER BY first_name, last_name
    `

    const users = result.map((row: any) => toCamelCase(row));

    return NextResponse.json(users)
  } catch (error) {
    console.error("Technicians fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
