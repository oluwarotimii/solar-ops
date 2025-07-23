import { type NextRequest, NextResponse } from "next/server";
import { getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'jobs:read:all')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const sql = getDbSql();

    const result = await sql`
      SELECT
        j.*,
        jt.name as job_type_name, jt.color as job_type_color,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM jobs j
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN users cu ON j.created_by = cu.id
      WHERE j.id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = result[0];

    // Fetch assigned technicians
    const techniciansResult = await sql`
      SELECT
        jt.technician_id,
        jt.role,
        u.first_name,
        u.last_name
      FROM job_technicians jt
      JOIN users u ON jt.technician_id = u.id
      WHERE jt.job_id = ${id}
    `;

    job.technicians = techniciansResult.map((tech: any) => ({
      technicianId: tech.technician_id,
      role: tech.role,
      firstName: tech.first_name,
      lastName: tech.last_name,
    }));

    return NextResponse.json(job);
  } catch (error) {
    console.error("Job GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'jobs:update')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const jobData = await request.json();
    const sql = getDbSql();

    const {
      title, description, jobTypeId, priority, locationAddress,
      locationLat, locationLng, scheduledDate, estimatedDuration,
      jobValue, instructions, status, assignedTechnicians
    } = jobData;

    const result = await sql`
      UPDATE jobs
      SET
        title = ${title},
        description = ${description || null},
        job_type_id = ${jobTypeId},
        priority = ${priority || "medium"},
        location_address = ${locationAddress},
        location_lat = ${locationLat || null},
        location_lng = ${locationLng || null},
        scheduled_date = ${scheduledDate || null},
        estimated_duration = ${estimatedDuration || null},
        job_value = ${jobValue || 0},
        instructions = ${instructions || null},
        status = ${status || "assigned"},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Job not found or no changes made" }, { status: 404 });
    }

    // Update assigned technicians
    if (assignedTechnicians) {
      // Delete existing technicians for this job
      await sql`DELETE FROM job_technicians WHERE job_id = ${id};`;

      // Insert new technicians
      for (const assignedTech of assignedTechnicians) {
        await sql`
          INSERT INTO job_technicians (job_id, technician_id, role)
          VALUES (${id}, ${assignedTech.technicianId}, ${assignedTech.role});
        `;
      }
    }

    return NextResponse.json({ message: "Job updated successfully" });
  } catch (error) {
    console.error("Job PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'jobs:delete')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const sql = getDbSql();

    // Delete associated job technicians first due to foreign key constraints
    await sql`DELETE FROM job_technicians WHERE job_id = ${id};`;
    // Delete associated accrued values
    await sql`DELETE FROM accrued_values WHERE job_id = ${id};`;
    // Delete associated notifications
    await sql`DELETE FROM notifications WHERE related_job_id = ${id};`;
    // Delete associated GPS logs
    await sql`DELETE FROM gps_logs WHERE job_id = ${id};`;
    // Delete associated checkin logs
    await sql`DELETE FROM checkin_logs WHERE job_id = ${id};`;
    // Delete associated job media
    await sql`DELETE FROM job_media WHERE job_id = ${id};`;


    const result = await sql`
      DELETE FROM jobs
      WHERE id = ${id}
      RETURNING id;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Job DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
