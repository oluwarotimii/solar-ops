import { type NextRequest, NextResponse } from "next/server"
import { sql, toCamelCase } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const result = await sql`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.status
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'Technician' AND u.status = 'active'
      ORDER BY u.first_name, u.last_name
    `

    const technicians = result.map(toCamelCase)

    return NextResponse.json(technicians)
  } catch (error) {
    console.error("Technicians fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
