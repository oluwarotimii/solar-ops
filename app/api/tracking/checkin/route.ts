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
