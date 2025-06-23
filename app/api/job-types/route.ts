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

    const result = await sql`SELECT * FROM job_types ORDER BY name`
    const jobTypes = result.map(toCamelCase)

    return NextResponse.json(jobTypes)
  } catch (error) {
    console.error("Job types fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
