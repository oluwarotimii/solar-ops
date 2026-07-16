import { NextResponse } from 'next/server';
import { getDbSql } from '@/lib/db';
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export async function GET(req: Request) {
  const { user, response } = await authenticateApiRequest(req);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'dashboard:stats:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDbSql();

    const totalJobsValueResult = await sql`
      SELECT SUM(job_value) as total_value FROM jobs`;

    const currentUtcDate = new Date();
    const currentMonth = currentUtcDate.getUTCMonth() + 1;
    const currentYear = currentUtcDate.getUTCFullYear();

    const completedJobsValueResult = await sql`
      SELECT SUM(job_value) as total_value 
      FROM jobs 
      WHERE status = 'completed' 
      AND EXTRACT(MONTH FROM completed_at) = ${currentMonth} 
      AND EXTRACT(YEAR FROM completed_at) = ${currentYear}`;

    const maintenanceRevenueResult = await sql`
      SELECT SUM(earned_amount) as total_value
      FROM accrued_values
      WHERE maintenance_occurrence_id IS NOT NULL
      AND month = ${currentMonth}
      AND year = ${currentYear}`;

    const spilloverRevenueResult = await sql`
      SELECT SUM(job_value) as spillover_value
      FROM jobs
      WHERE status = 'completed'
      AND EXTRACT(MONTH FROM completed_at) = ${currentMonth}
      AND EXTRACT(YEAR FROM completed_at) = ${currentYear}
      AND (EXTRACT(MONTH FROM scheduled_date) < ${currentMonth} OR EXTRACT(YEAR FROM scheduled_date) < ${currentYear});
    `;

    const totalJobsResult = await sql`SELECT COUNT(*) as count FROM jobs`;
    const activeJobsResult = await sql`SELECT COUNT(*) as count FROM jobs WHERE status = 'assigned' OR status = 'in_progress'`;
    const completedJobsResult = await sql`SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'`;
    const totalUsersResult = await sql`SELECT COUNT(*) as count FROM users`;
    const pendingMaintenanceResult = await sql`SELECT COUNT(*) as count FROM maintenance_occurrences WHERE status != 'completed' AND status != 'missed'`;

    const toNum = (v: any): number => v != null ? Number(v) : 0;

    const stats = {
      totalJobsValue: toNum(totalJobsValueResult[0].total_value),
      totalRevenue: toNum(completedJobsValueResult[0].total_value),
      maintenanceRevenueThisMonth: toNum(maintenanceRevenueResult[0].total_value),
      spilloverRevenue: toNum(spilloverRevenueResult[0].spillover_value),
      totalJobs: toNum(totalJobsResult[0].count),
      activeJobs: toNum(activeJobsResult[0].count),
      completedJobs: toNum(completedJobsResult[0].count),
      totalUsers: toNum(totalUsersResult[0].count),
      pendingMaintenance: toNum(pendingMaintenanceResult[0].count),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Dashboard Stats Error]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
