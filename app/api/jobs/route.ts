import { type NextRequest, NextResponse } from "next/server"
import { sql, toCamelCase } from "@/lib/db"
import { verifyToken, getUserById } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = await getUserById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const result = await sql`
      SELECT 
        j.*,
        jt.name as job_type_name, jt.color as job_type_color,
        au.first_name as assigned_first_name, au.last_name as assigned_last_name,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM jobs j
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN users au ON j.assigned_to = au.id
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
          id: job.assignedTo,
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
  } catch (error) {
    console.error("Jobs fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = await getUserById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const jobData = await request.json()

    if (!jobData.title || !jobData.jobTypeId || !jobData.locationAddress) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO jobs (
        title, description, job_type_id, assigned_to, created_by,
        priority, location_address, location_lat, location_lng,
        scheduled_date, estimated_duration, job_value, technician_share,
        instructions, status
      ) VALUES (
        ${jobData.title},
        ${jobData.description || null},
        ${jobData.jobTypeId},
        ${jobData.assignedTo || null},
        ${user.id},
        ${jobData.priority || "medium"},
        ${jobData.locationAddress},
        ${jobData.locationLat || null},
        ${jobData.locationLng || null},
        ${jobData.scheduledDate || null},
        ${jobData.estimatedDuration || null},
        ${jobData.jobValue || 0},
        ${jobData.technicianShare || 0},
        ${jobData.instructions || null},
        'assigned'
      ) RETURNING id
    `

    // Send notification to assigned technician if one is assigned
    if (jobData.assignedTo) {
      await sql`
        INSERT INTO notifications (recipient_id, sender_id, title, message, type, related_job_id)
        VALUES (
          ${jobData.assignedTo},
          ${user.id},
          'New Job Assignment',
          ${`You have been assigned a new job: ${jobData.title}`},
          'job_assignment',
          ${result[0].id}
        )
      `
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
