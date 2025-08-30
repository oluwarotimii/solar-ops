import { type NextRequest, NextResponse } from "next/server";
import { getDbSql, toCamelCase } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'dashboard:activity:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDbSql();

    // Fetch recent job updates with user info
    const recentJobs = await sql`
      SELECT
        j.id, j.title, j.status, j.created_at as timestamp, 'job_update' as type,
        u.first_name, u.last_name
      FROM jobs j
      JOIN users u ON j.created_by = u.id
      ORDER BY j.updated_at DESC
      LIMIT 5
    `;

    // Fetch recent check-ins/check-outs with user info
    const recentCheckins = await sql`
      SELECT
        cl.id, cl.user_id, cl.job_id, cl.type, cl.timestamp, 'checkin_activity' as activity_type,
        u.first_name, u.last_name
      FROM checkin_logs cl
      JOIN users u ON cl.user_id = u.id
      ORDER BY cl.timestamp DESC
      LIMIT 5
    `;

    // Combine and sort activities
    const combinedActivities = [...recentJobs, ...recentCheckins].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Limit to top 10 activities
    const activities = combinedActivities.slice(0, 10).map(toCamelCase);

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Dashboard activity error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
