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
        au.first_name as assigned_first_name, au.last_name as assigned_last_name,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM jobs j
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN job_technicians jtech ON j.id = jtech.job_id
      LEFT JOIN users au ON jtech.technician_id = au.id
      LEFT JOIN users cu ON j.created_by = cu.id
      ORDER BY j.created_at DESC
    `
    const jobs = result.map((row: any) => {
      const job = toCamelCase(row)

      // Build nested objects
      if (job.jobTypeName) {
        job.jobType = {
          id: job.jobTypeId,
          name: job.jobTypeName,
          color: job.jobTypeColor,
        }
      }

      if (job.assignedFirstName) {
        job.assignedUser = {
          firstName: job.assignedFirstName,
          lastName: job.assignedLastName,
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
    })
    return NextResponse.json(jobs)
    } else if (hasPermission(user, 'jobs:read:team')) {
      // Supervisors can see all jobs assigned to their team
      const result = await sql`
        SELECT 
          j.*,
        jt.name as job_type_name, jt.color as job_type_color,
        au.first_name as assigned_first_name, au.last_name as assigned_last_name,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM jobs j
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN job_technicians jtech ON j.id = jtech.job_id
      LEFT JOIN users au ON jtech.technician_id = au.id
      LEFT JOIN users cu ON j.created_by = cu.id
      WHERE jtech.technician_id IN (SELECT technician_id FROM supervisor_technicians WHERE supervisor_id = ${user.id})
      ORDER BY j.created_at DESC
      `
      const jobs = result.map((row: any) => {
      const job = toCamelCase(row)

      // Build nested objects
      if (job.jobTypeName) {
        job.jobType = {
          id: job.jobTypeId,
          name: job.jobTypeName,
          color: job.jobTypeColor,
        }
      }

      if (job.assignedFirstName) {
        job.assignedUser = {
          firstName: job.assignedFirstName,
          lastName: job.assignedLastName,
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
    })
    return NextResponse.json(jobs)
    } else if (hasPermission(user, 'jobs:read:assigned')) {
      // Technicians only see jobs assigned to them
      const result = await sql`
        SELECT 
          j.*,
        jt.name as job_type_name, jt.color as job_type_color,
        au.first_name as assigned_first_name, au.last_name as assigned_last_name,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM jobs j
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN job_technicians jtech ON j.id = jtech.job_id
      LEFT JOIN users au ON jtech.technician_id = au.id
      LEFT JOIN users cu ON j.created_by = cu.id
        WHERE jtech.technician_id = ${user.id}
        ORDER BY j.created_at DESC
      `
      const jobs = result.map((row: any) => {
      const job = toCamelCase(row)

      // Build nested objects
      if (job.jobTypeName) {
        job.jobType = {
          id: job.jobTypeId,
          name: job.jobTypeName,
          color: job.jobTypeColor,
        }
      }

      if (job.assignedFirstName) {
        job.assignedUser = {
          firstName: job.assignedFirstName,
          lastName: job.assignedLastName,
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
    })
    return NextResponse.json(jobs)
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
    const totalTechnicianShare = jobData.assignedTechnicians.reduce((sum: number, tech: any) => sum + tech.sharePercentage, 0);
    const companySharePercentage = 100 - totalTechnicianShare;

    const result = await sql`
      INSERT INTO jobs (
        title, description, job_type_id, created_by,
        priority, location_address, location_lat, location_lng,
        scheduled_date, estimated_duration, job_value, total_technician_share, company_share_percentage,
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
        ${jobData.estimatedDuration || null},
        ${jobData.jobValue || 0},
        ${totalTechnicianShare},
        ${companySharePercentage},
        ${jobData.instructions || null},
        'assigned'
      ) RETURNING id
    `

    const jobId = result[0].id;

    // Insert into job_technicians table for each assigned technician
    if (jobData.assignedTechnicians && jobData.assignedTechnicians.length > 0) {
      for (const assignedTech of jobData.assignedTechnicians) {
        await sql`
          INSERT INTO job_technicians (job_id, technician_id, share_percentage, role)
          VALUES (${jobId}, ${assignedTech.technicianId}, ${assignedTech.sharePercentage}, ${assignedTech.role})
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
      }
    }

    return NextResponse.json({
      id: result[0].id,
      message: "Job created successfully",
    })
  } catch (error) {
    console.error("Job creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
