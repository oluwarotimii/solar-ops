import { type NextRequest, NextResponse } from "next/server";
import { getDbSql, toCamelCase } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'dashboard:read')) { // Assuming a general dashboard read permission
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDbSql();

    // Calculate the start and end dates for the previous month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let previousMonth = currentMonth - 1;
    let previousMonthYear = currentYear;

    if (previousMonth < 0) {
      previousMonth = 11; // December
      previousMonthYear--;
    }

    const startDateOfPreviousMonth = new Date(previousMonthYear, previousMonth, 1);
    const endDateOfPreviousMonth = new Date(previousMonthYear, previousMonth + 1, 0); // Last day of previous month

    const spilloverJobs = await sql`
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
        j.scheduled_date >= ${startDateOfPreviousMonth.toISOString().split('T')[0]} AND
        j.scheduled_date <= ${endDateOfPreviousMonth.toISOString().split('T')[0]} AND
        j.status NOT IN ('completed', 'cancelled')
      ORDER BY j.scheduled_date ASC;
    `;

    return NextResponse.json(spilloverJobs.map(toCamelCase));
  } catch (error) {
    console.error("Spillover jobs fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
