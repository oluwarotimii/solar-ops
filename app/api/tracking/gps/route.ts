import { type NextRequest, NextResponse } from "next/server"
import { authenticateApiRequest } from "@/lib/api-auth"
import { getDbSql } from "@/lib/db"
import { hasPermission } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'tracking:log_gps')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { jobId, latitude, longitude, accuracy, journeyType } = await request.json()

    const sql = getDbSql();
    await sql`
      INSERT INTO gps_logs (user_id, job_id, latitude, longitude, accuracy, journey_type)
      VALUES (${user.id}, ${jobId}, ${latitude}, ${longitude}, ${accuracy}, ${journeyType})
    `;

    return NextResponse.json({
      success: true,
      message: "GPS location logged successfully",
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to log GPS location" }, { status: 500 })
  }
}
