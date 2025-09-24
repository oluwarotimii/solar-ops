import { NextResponse } from "next/server";
import { getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const { user: currentUser, response } = await authenticateApiRequest(req);
    if (response) {
      return response;
    }
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;

    // Security check: Allow users with permission or the user themselves to access this endpoint
    if (currentUser.id !== userId && !hasPermission(currentUser, 'users:read:stats:all')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sql = getDbSql();

    // Fetch total assigned jobs
    const assignedResult = await sql`
      SELECT COUNT(*) FROM job_technicians WHERE technician_id = ${userId}
    `;
    const totalAssignedJobs = parseInt(assignedResult[0].count, 10);

    // Fetch completed jobs
    const completedResult = await sql`
      SELECT COUNT(*) 
      FROM job_technicians jt
      JOIN jobs j ON jt.job_id = j.id
      WHERE jt.technician_id = ${userId} AND j.status = 'completed'
    `;
    const completedJobs = parseInt(completedResult[0].count, 10);

    // Fetch total earned amount
    const earnedResult = await sql`
      SELECT SUM(earned_amount) as total_earned FROM accrued_values WHERE user_id = ${userId}
    `;
    const totalEarned = parseFloat(earnedResult[0].total_earned || 0);

    const stats = {
      totalAssignedJobs,
      completedJobs,
      totalEarned: totalEarned.toFixed(2),
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("[API_USERS_STATS]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}