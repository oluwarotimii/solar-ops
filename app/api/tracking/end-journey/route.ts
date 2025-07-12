import { type NextRequest, NextResponse } from "next/server"
import { authenticateApiRequest } from "@/lib/api-auth"
import { getDbSql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { jobId, latitude, longitude } = await request.json()

    const sql = getDbSql();
    await sql`
      INSERT INTO gps_logs (user_id, job_id, latitude, longitude, journey_type, status)
      VALUES (${user.id}, ${jobId}, ${latitude}, ${longitude}, 'return', 'completed')
    `;

    return NextResponse.json({
      success: true,
      message: "Journey tracking ended - back to base",
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to end journey tracking" }, { status: 500 })
  }
}
