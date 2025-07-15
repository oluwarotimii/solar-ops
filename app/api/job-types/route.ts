import { type NextRequest, NextResponse } from "next/server"
import { toCamelCase, getDbSql } from "@/lib/db"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request)
    if (response) {
      return response
    }

    if (!user || !hasPermission(user, 'job_types:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sql = getDbSql();

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
    const { user, response } = await authenticateApiRequest(request)
    if (response) {
      return response
    }

    if (!user || !hasPermission(user, 'job_types:create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sql = getDbSql();

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

