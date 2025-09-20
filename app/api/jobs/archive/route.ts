import { type NextRequest, NextResponse } from "next/server"
import { getDbSql } from "@/lib/db"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request)
    if (response) {
      return response
    }

    if (!user || !hasPermission(user, "jobs:archive")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const sql = getDbSql()

    // Check if job exists and is completed
    const [job] = await sql`
      SELECT id, status, completed_at FROM jobs WHERE id = ${jobId}
    `

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (job.status !== 'completed') {
      return NextResponse.json({ error: "Only completed jobs can be archived" }, { status: 400 })
    }

    // Archive the job
    const [updatedJob] = await sql`
      UPDATE jobs 
      SET is_archived = TRUE, archived_at = NOW()
      WHERE id = ${jobId}
      RETURNING id, is_archived, archived_at
    `

    return NextResponse.json({ 
      message: "Job archived successfully",
      job: updatedJob
    })

  } catch (error) {
    console.error("Job archive error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request)
    if (response) {
      return response
    }

    if (!user || !hasPermission(user, "jobs:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const sql = getDbSql()
    const { searchParams } = request.nextUrl
    const showArchived = searchParams.get('showArchived') === 'true'
    
    let archivedCondition = sql`is_archived = FALSE`
    if (showArchived) {
      archivedCondition = sql`is_archived = TRUE`
    }

    const archivedJobs = await sql`
      SELECT 
        j.*,
        jt.name as job_type_name, jt.color as job_type_color,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM jobs j
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN users cu ON j.created_by = cu.id
      WHERE ${archivedCondition} AND j.status = 'completed'
      ORDER BY j.completed_at DESC
      LIMIT 50
    `

    return NextResponse.json(archivedJobs.map((job: any) => ({
      ...job,
      jobType: job.job_type_name ? {
        name: job.job_type_name,
        color: job.job_type_color
      } : null,
      createdUser: job.created_first_name ? {
        firstName: job.created_first_name,
        lastName: job.created_last_name
      } : null
    })))

  } catch (error) {
    console.error("Fetch archived jobs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}