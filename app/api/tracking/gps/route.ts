import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authenticateApiRequest } from "@/lib/api-auth"
import { getDbSql } from "@/lib/db"
import { hasPermission } from "@/lib/auth"
import { logAuditEvent } from "@/lib/audit"

const gpsLogSchema = z.object({
  jobId: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  journeyType: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'tracking:log_gps')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json()
    const parsed = gpsLogSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
    }
    const { jobId, latitude, longitude, accuracy, journeyType } = parsed.data

    const sql = getDbSql();
    await sql`
      INSERT INTO gps_logs (user_id, job_id, latitude, longitude, accuracy, journey_type)
      VALUES (${user.id}, ${jobId}, ${latitude}, ${longitude}, ${accuracy}, ${journeyType})
    `;

    // Log the GPS tracking event
    await logAuditEvent({
      userId: user.id,
      action: "gps_location_logged",
      targetType: "gps_log",
      details: {
        jobId,
        latitude,
        longitude,
        accuracy,
        journeyType
      },
      request,
    });

    return NextResponse.json({
      success: true,
      message: "GPS location logged successfully",
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to log GPS location" }, { status: 500 })
  }
}
