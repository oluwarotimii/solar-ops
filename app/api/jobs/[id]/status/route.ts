import { NextResponse, type NextRequest } from "next/server";
import { getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  // We will create a more specific permission like 'jobs:update:status' later.
  // For now, we use the general 'jobs:update' permission.
  if (!user || !hasPermission(user, "jobs:update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { status } = await request.json();
    const { id: jobId } = params;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const validStatuses = ["assigned", "in_progress", "completed", "on_hold", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const sql = getDbSql();

    // Additional logic for when a job is completed
    let query;
    if (status === 'completed') {
      query = sql`
        UPDATE jobs
        SET status = ${status}, completed_at = NOW()
        WHERE id = ${jobId}
        RETURNING id;
      `;
      // Here you could add logic to trigger notifications, calculate earnings, etc.
    } else {
      query = sql`
        UPDATE jobs
        SET status = ${status}
        WHERE id = ${jobId}
        RETURNING id;
      `;
    }

    const result = await query;

    if (result.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Job status updated successfully" });

  } catch (error) {
    console.error("Error updating job status:", error);
    return NextResponse.json({ error: "Failed to update job status" }, { status: 500 });
  }
}
