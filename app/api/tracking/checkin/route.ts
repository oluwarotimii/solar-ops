import { type NextRequest, NextResponse } from "next/server"
import { authenticateApiRequest } from "@/lib/api-auth"
import { getDbSql } from "@/lib/db"
import { hasPermission } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'tracking:checkin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { jobId, type, latitude, longitude, notes } = await request.json()

    const sql = getDbSql();
    await sql`
      INSERT INTO checkin_logs (user_id, job_id, type, latitude, longitude, notes)
      VALUES (${user.id}, ${jobId}, ${type}, ${latitude}, ${longitude}, ${notes})
    `;

    return NextResponse.json({
      success: true,
      message: `Successfully ${type === "checkin" ? "checked in" : "checked out"}`,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process check-in/out" }, { status: 500 })
  }
}
