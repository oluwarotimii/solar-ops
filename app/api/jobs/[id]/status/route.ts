import { NextResponse, type NextRequest } from "next/server";
import { getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { logAuditEvent } from "@/lib/audit";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: jobId } = params;
  const sql = getDbSql();

  try {
    if (user.role?.isAdmin) {
      const { status } = await request.json();
      if (!status) {
        return NextResponse.json({ error: "Status is required for admin action" }, { status: 400 });
      }

      const validStatuses = ["assigned", "in_progress", "completed", "on_hold", "cancelled"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }

      if (status === 'completed') {
        const [job] = await sql`UPDATE jobs SET status = 'completed', completed_at = NOW(), is_archived = TRUE, archived_at = NOW() WHERE id = ${jobId} RETURNING id, job_value;`;
        
        if (job) {
          const techniciansResult = await sql`SELECT technician_id FROM job_technicians WHERE job_id = ${jobId}`;
          const technicianIds = techniciansResult.map((row) => row.technician_id);
          const numberOfTechnicians = technicianIds.length;

          if (numberOfTechnicians > 0) {
            const earnedAmount = job.job_value / numberOfTechnicians;
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();

            for (const techId of technicianIds) {
              await sql`
                INSERT INTO accrued_values (user_id, job_id, job_value, earned_amount, month, year, created_at)
                VALUES (${techId}, ${jobId}, ${job.job_value}, ${earnedAmount}, ${month}, ${year}, NOW())
                ;
              `;
            }
          }
        }
      } else {
        // If a job is moved from 'Completed' to another status, delete associated accrued values.
        await sql`DELETE FROM accrued_values WHERE job_id = ${jobId}`;

        let query;
        if (status === 'assigned') {
          query = sql`UPDATE jobs SET status = ${status}, completed_at = NULL, is_archived = FALSE, archived_at = NULL WHERE id = ${jobId} RETURNING id;`;
          await sql`UPDATE job_technicians SET completed_at = NULL WHERE job_id = ${jobId}`;
        } else {
          query = sql`UPDATE jobs SET status = ${status}, completed_at = NULL, is_archived = FALSE, archived_at = NULL WHERE id = ${jobId} RETURNING id;`;
        }
        await query;
      }

      await logAuditEvent({
        userId: user.id,
        action: "job_status_update_admin",
        targetType: "job",
        targetId: jobId,
        details: { status },
        request,
      });

      return NextResponse.json({ message: "Job status updated successfully by admin" });
    }

    const [assignedTechnician] = await sql`
      SELECT id FROM job_technicians WHERE job_id = ${jobId} AND technician_id = ${user.id}
    `;

    if (!assignedTechnician) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this job" }, { status: 403 });
    }

    await sql`
      UPDATE job_technicians SET completed_at = NOW() WHERE job_id = ${jobId} AND technician_id = ${user.id};
    `;

    await logAuditEvent({
      userId: user.id,
      action: "job_technician_complete",
      targetType: "job",
      targetId: jobId,
      request,
    });

    const [{ total_technicians }] = await sql`
      SELECT COUNT(*) as total_technicians FROM job_technicians WHERE job_id = ${jobId};
    `;

    const [{ completed_technicians }] = await sql`
      SELECT COUNT(*) as completed_technicians FROM job_technicians WHERE job_id = ${jobId} AND completed_at IS NOT NULL;
    `;

    if (total_technicians > 0 && total_technicians === completed_technicians) {
        const [job] = await sql`
          UPDATE jobs SET status = 'completed', completed_at = NOW(), is_archived = TRUE, archived_at = NOW() WHERE id = ${jobId} RETURNING id, job_value;
        `;

        if (job) {
          const techniciansResult = await sql`SELECT technician_id FROM job_technicians WHERE job_id = ${jobId}`;
          const technicianIds = techniciansResult.map((row) => row.technician_id);
          const numberOfTechnicians = technicianIds.length;

          if (numberOfTechnicians > 0) {
            const earnedAmount = job.job_value / numberOfTechnicians;
            const now = new Date();
            const month = now.getMonth() + 1;
            const year = now.getFullYear();

            for (const techId of technicianIds) {
              await sql`
                INSERT INTO accrued_values (user_id, job_id, job_value, earned_amount, month, year, created_at)
                VALUES (${techId}, ${jobId}, ${job.job_value}, ${earnedAmount}, ${month}, ${year}, NOW())
                ;
              `;
            }
          }
        }

        await logAuditEvent({
          userId: null, // System action
          action: "job_status_update_system",
          targetType: "job",
          targetId: jobId,
          details: { status: "completed", reason: "All technicians marked as complete" },
        });
      }

    return NextResponse.json({ message: "Your status has been marked as complete." });

  } catch (error) {
    console.error("Error updating job status:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    if (errorMessage.includes("Unexpected end of JSON input")) {
        return NextResponse.json({ error: "Invalid request body. Please provide a valid JSON." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update job status" }, { status: 500 });
  }
}
