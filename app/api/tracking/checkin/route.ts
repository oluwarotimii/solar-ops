import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authenticateApiRequest } from "@/lib/api-auth"
import { getDbSql } from "@/lib/db"
import { hasPermission } from "@/lib/auth"
import { logAuditEvent } from "@/lib/audit"

const checkinSchema = z.object({
  jobId: z.string().min(1),
  type: z.enum(["checkin", "checkout"]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'tracking:checkin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json()
    const parsed = checkinSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
    }
    const { jobId, type, latitude, longitude, notes } = parsed.data

    const sql = getDbSql();
    await sql`
      INSERT INTO checkin_logs (user_id, job_id, type, latitude, longitude, notes)
      VALUES (${user.id}, ${jobId}, ${type}, ${latitude}, ${longitude}, ${notes})
    `;

    // Log the check-in/out event
    await logAuditEvent({
      userId: user.id,
      action: type === "checkin" ? "job_checkin" : "job_checkout",
      targetType: "checkin_log",
      details: {
        jobId,
        type,
        latitude,
        longitude,
        notes
      },
      request,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${type === "checkin" ? "checked in" : "checked out"}`,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process check-in/out" }, { status: 500 })
  }
}
