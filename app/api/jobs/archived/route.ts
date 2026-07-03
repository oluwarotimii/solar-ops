import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { toCamelCase, getDbSql } from "@/lib/db"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"

interface JobRow {
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

interface TechnicianRow {
  technician_id: string;
  role: string;
  completed_at: Date | null;
  first_name: string;
  last_name: string;
}

const reopenJobSchema = z.object({
  jobId: z.string().min(1),
})

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
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "12", 10)
    const offset = (page - 1) * limit

    const result = await sql`
      SELECT 
        j.*,
        jt.name as job_type_name, jt.color as job_type_color,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM jobs j
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN users cu ON j.created_by = cu.id
      WHERE j.is_archived = TRUE AND j.status = 'completed'
      ORDER BY j.archived_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    const [{ count }] = await sql`
      SELECT COUNT(*) as count
      FROM jobs j
      WHERE j.is_archived = TRUE AND j.status = 'completed'
    `

    const jobs = await Promise.all(
      result.map(async (row: JobRow) => {
        const job = toCamelCase(row)

        // Fetch assigned technicians
        const techniciansResult = await sql`
          SELECT
            jt.technician_id,
            jt.role,
            jt.completed_at,
            u.first_name,
            u.last_name
          FROM job_technicians jt
          JOIN users u ON jt.technician_id = u.id
          WHERE jt.job_id = ${job.id}
        `
        job.technicians = techniciansResult.map((tech: TechnicianRow) => ({
          technicianId: tech.technician_id,
          role: tech.role,
          completedAt: tech.completed_at,
          firstName: tech.first_name,
          lastName: tech.last_name,
        }))

        if (job.jobTypeName) {
          job.jobType = {
            id: job.jobTypeId,
            name: job.jobTypeName,
            color: job.jobTypeColor,
          }
        }

        if (job.createdFirstName) {
          job.createdUser = {
            id: job.createdBy,
            firstName: job.createdFirstName,
            lastName: job.createdLastName,
          }
        }

        delete job.jobTypeName
        delete job.jobTypeColor
        delete job.assignedFirstName
        delete job.assignedLastName
        delete job.createdFirstName
        delete job.createdLastName

        return job
      })
    )

    const jobsWithDate = jobs.map((job: Record<string, unknown>) => ({
      ...job,
      scheduledDate:
        job.scheduledDate instanceof Date
          ? new Date(
              job.scheduledDate.getTime() -
                job.scheduledDate.getTimezoneOffset() * 60000
            )
              .toISOString()
              .split("T")[0]
          : null,
      scheduledTime: job.scheduledTime || null,
    }))

    return NextResponse.json({
      jobs: jobsWithDate,
      total: parseInt(count, 10),
      page,
      limit,
    })

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

    if (!user || !hasPermission(user, "jobs:update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = reopenJobSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
    }
    const { jobId } = parsed.data

    const sql = getDbSql()

    // Check if job exists and is archived
    const [job] = await sql`
      SELECT id, is_archived FROM jobs WHERE id = ${jobId}
    `

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (!job.is_archived) {
      return NextResponse.json({ error: "Job is not archived" }, { status: 400 })
    }

    // Reopen and unarchive the job
    const [updatedJob] = await sql`
      UPDATE jobs 
      SET status = 'assigned', 
          completed_at = NULL,
          is_archived = FALSE,
          archived_at = NULL
      WHERE id = ${jobId}
      RETURNING id, status, is_archived
    `

    // Also reset technician completion status
    await sql`
      UPDATE job_technicians 
      SET completed_at = NULL 
      WHERE job_id = ${jobId}
    `

    // Delete associated accrued values
    await sql`
      DELETE FROM accrued_values 
      WHERE job_id = ${jobId}
    `

    return NextResponse.json({ 
      message: "Job reopened and unarchived successfully",
      job: updatedJob
    })

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}