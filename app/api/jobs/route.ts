import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { toCamelCase, getDbSql } from "@/lib/db"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"
import { sendPushNotification } from "@/lib/push"
import { logAuditEvent } from "@/lib/audit"

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

const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  jobTypeId: z.string().min(1),
  priority: z.string().optional(),
  locationAddress: z.string().min(1),
  locationLat: z.string().optional(),
  locationLng: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  jobValue: z.number().optional(),
  instructions: z.string().optional(),
  assignedUsers: z.array(z.object({
    userId: z.string(),
    role: z.string(),
  })).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request)
    if (response) {
      return response
    }

    if (!user || !hasPermission(user, "jobs:read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sql = getDbSql()
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "10", 10)
    const offset = (page - 1) * limit

    let result, count;

    if (hasPermission(user, "jobs:read:all")) {
      result = await sql`
        SELECT 
          j.*,
          jt.name as job_type_name, jt.color as job_type_color,
          cu.first_name as created_first_name, cu.last_name as created_last_name
        FROM jobs j
        LEFT JOIN job_types jt ON j.job_type_id = jt.id
        LEFT JOIN users cu ON j.created_by = cu.id
        WHERE j.is_archived = FALSE
        ORDER BY j.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
      ;[{ count }] = await sql`
        SELECT COUNT(*) as count
        FROM jobs j
        WHERE j.is_archived = FALSE
      `
    } else if (hasPermission(user, "jobs:read:team")) {
      result = await sql`
        SELECT 
          j.*,
          jt.name as job_type_name, jt.color as job_type_color,
          cu.first_name as created_first_name, cu.last_name as created_last_name
        FROM jobs j
        LEFT JOIN job_types jt ON j.job_type_id = jt.id
        LEFT JOIN users cu ON j.created_by = cu.id
        JOIN job_technicians jtech ON j.id = jtech.job_id
        WHERE jtech.technician_id IN (
          SELECT technician_id FROM supervisor_technicians WHERE supervisor_id = ${user.id}
        )
        AND j.is_archived = FALSE
        ORDER BY j.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
      ;[{ count }] = await sql`
        SELECT COUNT(DISTINCT j.id)
        FROM jobs j
        JOIN job_technicians jtech ON j.id = jtech.job_id
        WHERE jtech.technician_id IN (
          SELECT technician_id FROM supervisor_technicians WHERE supervisor_id = ${user.id}
        )
        AND j.is_archived = FALSE
      `
    } else {
      result = await sql`
        SELECT 
          j.*,
          jt.name as job_type_name, jt.color as job_type_color,
          cu.first_name as created_first_name, cu.last_name as created_last_name
        FROM jobs j
        LEFT JOIN job_types jt ON j.job_type_id = jt.id
        LEFT JOIN users cu ON j.created_by = cu.id
        JOIN job_technicians jtech ON j.id = jtech.job_id
        WHERE jtech.technician_id = ${user.id}
        AND j.is_archived = FALSE
        ORDER BY j.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
      ;[{ count }] = await sql`
        SELECT COUNT(*) as count
        FROM jobs j
        JOIN job_technicians jtech ON j.id = jtech.job_id
        WHERE jtech.technician_id = ${user.id}
        AND j.is_archived = FALSE
      `
    }

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

    if (!user || !hasPermission(user, "jobs:create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createJobSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
    }
    const jobData = parsed.data

    const db = getDbSql()

    // 1. Create the job
    const jobResult = await db`
      INSERT INTO jobs (
        title, description, job_type_id, created_by,
        priority, location_address, location_lat, location_lng,
        scheduled_date, scheduled_time, job_value,
        instructions, status
      ) VALUES (
        ${jobData.title},
        ${jobData.description || null},
        ${jobData.jobTypeId},
        ${user.id},
        ${jobData.priority || "medium"},
        ${jobData.locationAddress},
        ${jobData.locationLat || null},
        ${jobData.locationLng || null},
        ${jobData.scheduledDate || null},
        ${jobData.scheduledTime || null},
        ${jobData.jobValue || 0},
        ${jobData.instructions || null},
        'assigned'
      ) RETURNING id
    `
    const jobId = jobResult[0].id

    // 3. Assign technicians and create notifications
    if (jobData.assignedUsers && jobData.assignedUsers.length > 0) {
      for (const assignedTech of jobData.assignedUsers) {
        await db`
          INSERT INTO job_technicians (job_id, technician_id, role)
          VALUES (${jobId}, ${assignedTech.userId}, ${assignedTech.role})
        `

        await db`
          INSERT INTO notifications (recipient_id, sender_id, title, message, type, related_job_id)
          VALUES (
            ${assignedTech.userId},
            ${user.id},
            'New Job Assignment',
            ${`You have been assigned a new job: ${jobData.title}`},
            'job_assignment',
            ${jobId}
          )
        `
      }
    }

    // 4. Send push notifications (can be outside the main DB transaction)
    if (jobData.assignedUsers && jobData.assignedUsers.length > 0) {
      for (const assignedTech of jobData.assignedUsers) {
        const subscriptionsResult = await db`
          SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = ${assignedTech.userId}
        `
        const payload = {
          title: "New Job Assignment",
          body: `You have been assigned a new job: ${jobData.title}`,
        }
        for (const row of subscriptionsResult) {
          const subscription = {
            endpoint: row.endpoint,
            keys: {
              p256dh: row.p256dh_key,
              auth: row.auth_key,
            },
          }
          await sendPushNotification(subscription, payload)
        }
      }
    }

    // 5. Log the audit event
    await logAuditEvent({
      userId: user.id,
      action: "job_create",
      targetType: "job",
      targetId: jobId,
      details: {
        title: jobData.title,
        assignedTechnicians: jobData.assignedUsers?.map((t: { userId: string }) => t.userId),
      },
      request,
    })

    return NextResponse.json({
      id: jobId,
      message: "Job created successfully",
    })
  } catch (error) {
    console.error("POST /api/jobs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
