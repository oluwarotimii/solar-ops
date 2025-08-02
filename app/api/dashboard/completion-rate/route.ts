import { type NextRequest, NextResponse } from "next/server";
import { getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'dashboard:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDbSql();

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const totalJobsResult = await sql`
      SELECT COUNT(*) as count
      FROM jobs
      WHERE EXTRACT(MONTH FROM scheduled_date) = ${currentMonth}
      AND EXTRACT(YEAR FROM scheduled_date) = ${currentYear}
    `;
    const totalJobs = Number(totalJobsResult[0].count);

    const completedJobsResult = await sql`
      SELECT COUNT(*) as count
      FROM jobs
      WHERE status = 'completed'
      AND EXTRACT(MONTH FROM scheduled_date) = ${currentMonth}
      AND EXTRACT(YEAR FROM scheduled_date) = ${currentYear}
    `;
    const completedJobs = Number(completedJobsResult[0].count);

    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    return NextResponse.json({
      totalJobsThisMonth: totalJobs,
      completedJobsThisMonth: completedJobs,
      completionRate: completionRate.toFixed(2),
    });
  } catch (error) {
    console.error("Dashboard completion rate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
