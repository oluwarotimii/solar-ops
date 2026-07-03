import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authenticateApiRequest } from "@/lib/api-auth"
import { getDbSql } from "@/lib/db"
import { hasPermission } from "@/lib/auth"
import { logAuditEvent } from "@/lib/audit"

const startJourneySchema = z.object({
  jobId: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
})

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'tracking:start_journey')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json()
    const parsed = startJourneySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
    }
    const { jobId, latitude, longitude } = parsed.data

    const sql = getDbSql();
    await sql`
      INSERT INTO gps_logs (user_id, job_id, latitude, longitude, journey_type, status)
      VALUES (${user.id}, ${jobId}, ${latitude}, ${longitude}, 'start', 'active')
    `;

    // Log the start journey event
    await logAuditEvent({
      userId: user.id,
      action: "journey_started",
      targetType: "gps_log",
      details: {
        jobId,
        latitude,
        longitude,
        journeyType: 'start'
      },
      request,
    });

    return NextResponse.json({
      success: true,
      message: "Journey tracking started",
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to start journey tracking" }, { status: 500 })
  }
}
