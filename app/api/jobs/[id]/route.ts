import { type NextRequest, NextResponse } from "next/server";
import { getDbSql, toCamelCase } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'jobs:read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const jobId = params.id;
    const sql = getDbSql();

    const result = await sql`
      SELECT 
        j.*,
        jt.name as job_type_name, jt.color as job_type_color,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM jobs j
      LEFT JOIN job_types jt ON j.job_type_id = jt.id
      LEFT JOIN users cu ON j.created_by = cu.id
      WHERE j.id = ${jobId}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = toCamelCase(result[0]);

    const techniciansResult = await sql`
      SELECT
        jt.technician_id,
        jt.role,
        u.first_name,
        u.last_name
      FROM job_technicians jt
      JOIN users u ON jt.technician_id = u.id
      WHERE jt.job_id = ${jobId}
    `;

    job.technicians = techniciansResult.map((tech: any) => toCamelCase(tech));

    job.scheduledDate = job.scheduledDate instanceof Date ? new Date(job.scheduledDate.getTime() - (job.scheduledDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : null;
    return NextResponse.json(job);
  } catch (error) {
    console.error(`[Jobs API] GET /api/jobs/${params.id} error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'jobs:delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const jobId = params.id;
    const sql = getDbSql();

    // For audit purposes, fetch the job before deleting
    const jobResult = await sql`SELECT title FROM jobs WHERE id = ${jobId}`;
    if (jobResult.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const jobTitle = jobResult[0].title;

    await sql`
      DELETE FROM jobs WHERE id = ${jobId}
    `;

    await logAuditEvent({
      userId: user.id,
      action: "job_delete",
      targetType: "job",
      targetId: jobId,
      details: { title: jobTitle },
      request,
    });

    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error(`[Jobs API] DELETE /api/jobs/${params.id} error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, response } = await authenticateApiRequest(request)
    if (response) {
      return response
    }

    if (!user || !hasPermission(user, 'jobs:update')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const jobId = params.id;
    const jobData = await request.json();
    const sql = getDbSql();

    // Fetch original job for audit purposes
    const originalJobResult = await sql`SELECT * FROM jobs WHERE id = ${jobId}`;
    if (originalJobResult.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const originalJob = originalJobResult[0];

    const originalTechniciansResult = await sql`SELECT technician_id FROM job_technicians WHERE job_id = ${jobId}`;
    const originalTechnicianIds = originalTechniciansResult.map((t: any) => t.technician_id);


    // 1. Update the main job details
    await sql`
      UPDATE jobs
      SET
        title = ${jobData.title},
        description = ${jobData.description || null},
        job_type_id = ${jobData.jobTypeId},
        priority = ${jobData.priority || 'medium'},
        location_address = ${jobData.locationAddress},
        location_lat = ${jobData.locationLat || null},
        location_lng = ${jobData.locationLng || null},
        scheduled_date = ${jobData.scheduledDate || null},
        scheduled_time = ${jobData.scheduledTime || null},
        estimated_duration = ${jobData.estimatedDuration || null},
        job_value = ${jobData.jobValue || 0},
        instructions = ${jobData.instructions || null},
        status = ${jobData.status || originalJob.status}
      WHERE id = ${jobId}
    `;

    // 2. Handle technician assignments
    // First, remove all existing technicians for this job
    await sql`
      DELETE FROM job_technicians WHERE job_id = ${jobId}
    `;

    // Then, add the new technicians
    if (jobData.assignedUsers && jobData.assignedUsers.length > 0) {
      for (const assignedUser of jobData.assignedUsers) {
        // Add the technician back
        await sql`
          INSERT INTO job_technicians (job_id, technician_id, role)
          VALUES (${jobId}, ${assignedUser.userId}, ${assignedUser.role})
        `;

        // Notify all assigned technicians of the update
        await sql`
          INSERT INTO notifications (recipient_id, sender_id, title, message, type, related_job_id)
          VALUES (
            ${assignedUser.userId},
            ${user.id},
            'Job Details Updated',
            ${`The details for job "${jobData.title}" have been updated.`},
            'job_update',
            ${jobId}
          )
        `;
      }
    }

    await logAuditEvent({
      userId: user.id,
      action: "job_update",
      targetType: "job",
      targetId: jobId,
      details: {
        changes: jobData, // This could be more granular
        originalTechnicians: originalTechnicianIds,
        newTechnicians: jobData.assignedUsers?.map((t: any) => t.userId),
      },
      request,
    });

    // Fetch the updated job to return
    const updatedJobResult = await sql`SELECT * FROM jobs WHERE id = ${jobId}`;
    const updatedJob = toCamelCase(updatedJobResult[0]);

    updatedJob.scheduledDate = updatedJob.scheduledDate instanceof Date ? new Date(updatedJob.scheduledDate.getTime() - (updatedJob.scheduledDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : null;
    return NextResponse.json(updatedJob);

  } catch (error) {
    console.error(`[Jobs API] PUT /api/jobs/${params.id} error:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}