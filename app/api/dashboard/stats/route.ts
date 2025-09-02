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

    const completedJobsValueResult = await sql`
      SELECT SUM(job_value) as total_value FROM jobs WHERE status = 'completed'`;

    const stats = {
      totalJobsValue: totalJobsValueResult[0].total_value || 0,
      completedJobsValue: completedJobsValueResult[0].total_value || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}