import { type NextRequest, NextResponse } from "next/server"
import { toCamelCase, getDbSql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const sql = getDbSql();
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

export async function POST(request: NextRequest) {
  try {
    const sql = getDbSql();
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { name, description, color } = await request.json()

    if (!name || !color) {
      return NextResponse.json({ error: "Name and color are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO job_types (name, description, color)
      VALUES (${name}, ${description}, ${color})
      RETURNING *
    `

    const newJobType = toCamelCase(result[0])

    return NextResponse.json(newJobType, { status: 201 })
  } catch (error) {
    console.error("Job type creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
