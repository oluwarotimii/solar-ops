import { type NextRequest, NextResponse } from "next/server"
import { toCamelCase, getDbSql } from "@/lib/db"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"
import { z } from "zod"

const createJobTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional().nullable(),
  color: z.string().min(1, "Color is required").max(7),
})

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request)
    if (response) {
      return response
    }

    if (!user || (!hasPermission(user, 'job_types:read') && !hasPermission(user, 'jobs:create') && !hasPermission(user, 'jobs:read'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sql = getDbSql();

    const result = await sql`SELECT * FROM job_types ORDER BY name`
    const jobTypes = result.map(toCamelCase)

    return NextResponse.json(jobTypes)
  } catch (error) {
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

    const body = await request.json()
    const validation = createJobTypeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 })
    }

    const { name, description, color } = validation.data

    const sql = getDbSql();

    const result = await sql`
      INSERT INTO job_types (name, description, color)
      VALUES (${name}, ${description}, ${color})
      RETURNING *
    `

    const newJobType = toCamelCase(result[0])

    return NextResponse.json(newJobType, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

