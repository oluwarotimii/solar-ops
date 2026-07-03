import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getDbSql } from "@/lib/db"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"

interface ArchiveJobRow {
  id: string;
  title: string;
  description: string | null;
  job_type_id: string;
  created_by: string;
  priority: string;
  location_address: string;
  location_lat: string | null;
  location_lng: string | null;
  scheduled_date: Date | null;
  scheduled_time: string | null;
  job_value: string | null;
  instructions: string | null;
  status: string;
  is_archived: boolean;
  completed_at: Date | null;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
  job_type_name: string | null;
  job_type_color: string | null;
  created_first_name: string | null;
  created_last_name: string | null;
}

const archiveJobSchema = z.object({
  jobId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request)
    if (response) {
      return response
    }

    if (!user || !hasPermission(user, "jobs:archive")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = archiveJobSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
    }
    const { jobId } = parsed.data

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

    return NextResponse.json(archivedJobs.map((job: ArchiveJobRow) => ({
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}