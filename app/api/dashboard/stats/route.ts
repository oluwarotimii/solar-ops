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
    const currentMonth = currentUtcDate.getUTCMonth() + 1; // getUTCMonth() is 0-indexed
    const currentYear = currentUtcDate.getUTCFullYear();

    const completedJobsValueResult = await sql`
      SELECT SUM(job_value) as total_value 
      FROM jobs 
      WHERE status = 'completed' 
      AND EXTRACT(MONTH FROM completed_at) = ${currentMonth} 
      AND EXTRACT(YEAR FROM completed_at) = ${currentYear}`;

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
    const pendingMaintenanceResult = await sql`SELECT COUNT(*) as count FROM maintenance_tasks WHERE status != 'completed' AND status != 'cancelled'`;

    const stats = {
      totalJobsValue: totalJobsValueResult[0].total_value || 0,
      totalRevenue: completedJobsValueResult[0].total_value || 0,
      spilloverRevenue: spilloverRevenueResult[0].spillover_value || 0,
      totalJobs: totalJobsResult[0].count || 0,
      activeJobs: activeJobsResult[0].count || 0,
      completedJobs: completedJobsResult[0].count || 0,
      totalUsers: totalUsersResult[0].count || 0,
      pendingMaintenance: pendingMaintenanceResult[0].count || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}