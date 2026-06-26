import { type NextRequest, NextResponse } from "next/server"
import { toCamelCase, getDbSql } from "@/lib/db"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"
import { sendPushNotification } from "@/lib/push"
import { logAuditEvent } from "@/lib/audit"

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
      result.map(async (row: any) => {
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
        job.technicians = techniciansResult.map((tech: any) => ({
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

    const jobsWithDate = jobs.map((job: any) => ({
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
    console.error("Jobs fetch error:", error)
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

    const jobData = await request.json()
    const { referrerId } = jobData

    if (!jobData.title || !jobData.jobTypeId || !jobData.locationAddress) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      )
    }

    const db = getDbSql()

    // 1. Create the job
    const jobResult = await db`
      INSERT INTO jobs (
        title, description, job_type_id, created_by,
        priority, location_address, location_lat, location_lng,
        scheduled_date, scheduled_time, job_value,
        instructions, status, referrer_id
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
        'assigned',
        ${referrerId || null}
      ) RETURNING id
    `
    const jobId = jobResult[0].id

    // 2. Update referrer points if a referrer was specified
    if (referrerId) {
      await db`
        UPDATE users
        SET referral_points = referral_points + 10
        WHERE id = ${referrerId}
      `
    }

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
        assignedTechnicians: jobData.assignedUsers?.map((t: any) => t.userId),
        referrerId: referrerId || null,
      },
      request,
    })

    return NextResponse.json({
      id: jobId,
      message: "Job created successfully",
    })
  } catch (error) {
    console.error("Job creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
