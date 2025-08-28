import { type NextRequest, NextResponse } from "next/server";
import { getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

// (The GET and DELETE functions remain the same)

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response || !user) {
      return response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(user, 'jobs:update')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: jobId } = params;
    const sql = getDbSql();

    const [originalJob] = await sql`SELECT * FROM jobs WHERE id = ${jobId}`;
    if (!originalJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (originalJob.status === 'completed') {
      return NextResponse.json({ error: "Completed jobs cannot be modified" }, { status: 403 });
    }

    const jobData = await request.json();
    const { assignedTechnicians, ...mainJobData } = jobData;

    // Status can no longer be updated via this endpoint. Use the status endpoint instead.
    delete mainJobData.status;

    // Update main job details
    await sql`
      UPDATE jobs
      SET
        title = ${mainJobData.title},
        description = ${mainJobData.description || null},
        job_type_id = ${mainJobData.jobTypeId},
        priority = ${mainJobData.priority || "medium"},
        location_address = ${mainJobData.locationAddress},
        location_lat = ${mainJobData.locationLat || null},
        location_lng = ${mainJobData.locationLng || null},
        scheduled_date = ${mainJobData.scheduledDate || null},
        scheduled_time = ${mainJobData.scheduledTime || null},
        // estimated_duration = ${mainJobData.estimatedDuration || null},
        instructions = ${mainJobData.instructions || null},
        updated_at = NOW()
      WHERE id = ${jobId};
    `;

    const changes: Record<string, { old: any; new: any }> = {};
    for (const key in mainJobData) {
      if (mainJobData.hasOwnProperty(key) && originalJob.hasOwnProperty(key) && mainJobData[key] !== originalJob[key]) {
        changes[key] = { old: originalJob[key], new: mainJobData[key] };
      }
    }

    // Update assigned technicians if provided
    if (assignedTechnicians) {
      const originalTechnicians = await sql`SELECT technician_id, role FROM job_technicians WHERE job_id = ${jobId}`;
      const originalTechSet = new Set(originalTechnicians.map(t => t.technician_id));
      const newTechSet = new Set(assignedTechnicians.map((t: any) => t.technicianId));

      if (JSON.stringify(originalTechSet) !== JSON.stringify(newTechSet)) {
        changes['assignedTechnicians'] = { old: originalTechnicians, new: assignedTechnicians };
      }

      await sql`DELETE FROM job_technicians WHERE job_id = ${jobId};`;
      for (const tech of assignedTechnicians) {
        await sql`INSERT INTO job_technicians (job_id, technician_id, role) VALUES (${jobId}, ${tech.technicianId}, ${tech.role});`;
      }
    }

    if (Object.keys(changes).length > 0) {
      await logAuditEvent({
        userId: user.id,
        action: "job_update",
        targetType: "job",
        targetId: jobId,
        details: { changes },
        request,
      });
    }

    return NextResponse.json({ message: "Job updated successfully" });
  } catch (error) {
    console.error("Job PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}