import { type NextRequest, NextResponse } from "next/server"
import { toCamelCase, getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";
import { sendPushNotification } from "@/lib/push";
import { logAuditEvent } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request)
    if (response) {
      return response
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const sql = getDbSql();
    // Check if the user has permission to read all jobs or only their own
    if (hasPermission(user, 'jobs:read:all')) {
      // Admins/Supervisors can see all jobs
      const result = await sql`
        SELECT 
          j.*,
        jt.name as job_type_name, jt.color as job_type_color,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM jobs j
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN users cu ON j.created_by = cu.id
      ORDER BY j.created_at DESC
    `
    const jobs = await Promise.all(result.map(async (row: any) => {
      const job = toCamelCase(row)

      // Fetch assigned technicians for each job
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
      `;
      job.technicians = techniciansResult.map((tech: any) => ({
        technicianId: tech.technician_id,
        role: tech.role,
        completedAt: tech.completed_at,
        firstName: tech.first_name,
        lastName: tech.last_name,
      }));

      // Build nested objects
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

      // Clean up the flat fields
      delete job.jobTypeName
      delete job.jobTypeColor
      delete job.assignedFirstName
      delete job.assignedLastName
      delete job.createdFirstName
      delete job.createdLastName

      return job
    }))
    const jobsWithDate = jobs.map((job: any) => ({
      ...job,
      scheduledDate: job.scheduledDate instanceof Date ? job.scheduledDate.toISOString().split('T')[0] : null,
      scheduledTime: job.scheduledTime || null,
    }));
    return NextResponse.json(jobsWithDate)
    } else if (hasPermission(user, 'jobs:read:team')) {
      // Supervisors can see all jobs assigned to their team
      const result = await sql`
        SELECT 
          j.*,
        jt.name as job_type_name, jt.color as job_type_color,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM jobs j
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN users cu ON j.created_by = cu.id
      JOIN job_technicians jtech ON j.id = jtech.job_id
      WHERE jtech.technician_id IN (SELECT technician_id FROM supervisor_technicians WHERE supervisor_id = ${user.id})
      ORDER BY j.created_at DESC
      `
      const jobs = await Promise.all(result.map(async (row: any) => {
      const job = toCamelCase(row)

      // Fetch assigned technicians for each job
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
      `;
      job.technicians = techniciansResult.map((tech: any) => ({
        technicianId: tech.technician_id,
        role: tech.role,
        completedAt: tech.completed_at,
        firstName: tech.first_name,
        lastName: tech.last_name,
      }));

      // Build nested objects
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

      // Clean up the flat fields
      delete job.jobTypeName
      delete job.jobTypeColor
      delete job.assignedFirstName
      delete job.assignedLastName
      delete job.createdFirstName
      delete job.createdLastName

      return job
    }))
    const jobsWithDate = jobs.map((job: any) => ({
      ...job,
      scheduledDate: job.scheduledDate instanceof Date ? job.scheduledDate.toISOString().split('T')[0] : null,
      scheduledTime: job.scheduledTime || null,
    }));
    return NextResponse.json(jobsWithDate)
    } else if (hasPermission(user, 'jobs:read:assigned')) {
      // Technicians only see jobs assigned to them
      const result = await sql`
        SELECT 
          j.*,
        jt.name as job_type_name, jt.color as job_type_color,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM jobs j
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN users cu ON j.created_by = cu.id
      JOIN job_technicians jtech ON j.id = jtech.job_id
        WHERE jtech.technician_id = ${user.id}
        ORDER BY j.created_at DESC
      `
      console.log(`[Jobs API] Found ${result.length} assigned jobs.`);
      const jobs = await Promise.all(result.map(async (row: any) => {
      const job = toCamelCase(row)

      // Fetch assigned technicians for each job
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
      `;
      job.technicians = techniciansResult.map((tech: any) => ({
        technicianId: tech.technician_id,
        role: tech.role,
        completedAt: tech.completed_at,
        firstName: tech.first_name,
        lastName: tech.last_name,
      }));

      // Build nested objects
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

      // Clean up the flat fields
      delete job.jobTypeName
      delete job.jobTypeColor
      delete job.assignedFirstName
      delete job.assignedLastName
      delete job.createdFirstName
      delete job.createdLastName

      return job
    }))
    const jobsWithDate = jobs.map((job: any) => ({
      ...job,
      scheduledDate: job.scheduledDate instanceof Date ? job.scheduledDate.toISOString().split('T')[0] : null,
      scheduledTime: job.scheduledTime || null,
    }));
    return NextResponse.json(jobsWithDate)
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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

    if (!user || !hasPermission(user, 'jobs:create')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const jobData = await request.json()

    if (!jobData.title || !jobData.jobTypeId || !jobData.locationAddress) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    const sql = getDbSql();

    // Calculate total technician share and company share
    const result = await sql`
      INSERT INTO jobs (
        title, description, job_type_id, created_by,
        priority, location_address, location_lat, location_lng,
                        scheduled_date, scheduled_time, estimated_duration, job_value,
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
        ${jobData.estimatedDuration || null},
        ${jobData.jobValue || 0},
        ${jobData.instructions || null},
        'assigned'
      ) RETURNING id
    `

    const jobId = result[0].id;

    // Insert into job_technicians table for each assigned technician
    if (jobData.assignedTechnicians && jobData.assignedTechnicians.length > 0) {
      for (const assignedTech of jobData.assignedTechnicians) {
        await sql`
          INSERT INTO job_technicians (job_id, technician_id, role)
          VALUES (${jobId}, ${assignedTech.technicianId}, ${assignedTech.role})
        `;

        // Send notification to assigned technician
        await sql`
          INSERT INTO notifications (recipient_id, sender_id, title, message, type, related_job_id)
          VALUES (
            ${assignedTech.technicianId},
            ${user.id},
            'New Job Assignment',
            ${`You have been assigned a new job: ${jobData.title}`},
            'job_assignment',
            ${jobId}
          )
        `;

        // Send push notification
        const subscriptionsResult = await sql`
          SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = ${assignedTech.technicianId}
        `;

        const payload = { title: 'New Job Assignment', body: `You have been assigned a new job: ${jobData.title}` };

        for (const row of subscriptionsResult) {
          const subscription = {
            endpoint: row.endpoint,
            keys: {
              p256dh: row.p256dh_key,
              auth: row.auth_key,
            },
          };
          await sendPushNotification(subscription, payload);
        }
      }
    }

    await logAuditEvent({
      userId: user.id,
      action: "job_create",
      targetType: "job",
      targetId: jobId,
      details: {
        title: jobData.title,
        assignedTechnicians: jobData.assignedTechnicians?.map((t: any) => t.technicianId),
      },
      request,
    });

    return NextResponse.json({
      id: result[0].id,
      message: "Job created successfully",
    })
  } catch (error) {
    console.error("Job creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
