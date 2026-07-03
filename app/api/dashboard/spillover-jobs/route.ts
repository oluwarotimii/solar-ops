import { type NextRequest, NextResponse } from "next/server";
import { getDbSql, toCamelCase } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

interface SpilloverJobRow {
  id: string;
  title: string;
  status: string;
  scheduled_date: Date;
  location_address: string;
  job_type_name: string | null;
  job_type_color: string | null;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDbSql();

    const now = new Date();
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let spilloverJobs;

    if (hasPermission(user, 'jobs:read:all')) {
      spilloverJobs = await sql`
        SELECT
          j.id,
          j.title,
          j.status,
          j.scheduled_date,
          j.location_address,
          jt.name as job_type_name,
          jt.color as job_type_color
        FROM jobs j
        LEFT JOIN job_types jt ON j.job_type_id = jt.id
        WHERE
          j.created_at < ${firstDayOfCurrentMonth.toISOString().split('T')[0]} AND
          j.status NOT IN ('completed', 'cancelled')
        ORDER BY j.scheduled_date ASC;
      `;
    } else {
      spilloverJobs = await sql`
        SELECT
          j.id,
          j.title,
          j.status,
          j.scheduled_date,
          j.location_address,
          jt.name as job_type_name,
          jt.color as job_type_color
        FROM jobs j
        INNER JOIN job_technicians jtech ON j.id = jtech.job_id
        LEFT JOIN job_types jt ON j.job_type_id = jt.id
        WHERE
          jtech.technician_id = ${user.id} AND
          j.created_at < ${firstDayOfCurrentMonth.toISOString().split('T')[0]} AND
          j.status NOT IN ('completed', 'cancelled')
        ORDER BY j.scheduled_date ASC;
      `;
    }

    const jobsWithCorrectDates = spilloverJobs.map((job: SpilloverJobRow) => ({
      ...job,
      scheduledDate: job.scheduled_date instanceof Date ? new Date(job.scheduled_date.getTime() - (job.scheduled_date.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : null,
    }));

    return NextResponse.json(jobsWithCorrectDates.map(toCamelCase));

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
