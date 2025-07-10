import { type NextRequest, NextResponse } from "next/server"
import { toCamelCase, getDbSql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const sql = getDbSql();
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get technicians with their latest GPS logs and current jobs
    const result = await sql`
      SELECT 
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        j.id as job_id,
        j.title as job_title,
        j.location_address as job_location,
        j.status as job_status,
        gl.latitude,
        gl.longitude,
        gl.timestamp as last_gps_timestamp,
        gl.journey_type,
        (
          SELECT timestamp 
          FROM gps_logs 
          WHERE user_id = u.id AND journey_type = 'start' 
          ORDER BY timestamp DESC 
          LIMIT 1
        ) as journey_start_time
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN job_technicians jt ON jt.technician_id = u.id
      LEFT JOIN jobs j ON jt.job_id = j.id AND j.status IN ('assigned', 'in_progress')
      LEFT JOIN LATERAL (
        SELECT latitude, longitude, timestamp, journey_type
        FROM gps_logs
        WHERE user_id = u.id
        ORDER BY timestamp DESC
        LIMIT 1
      ) gl ON true
      WHERE r.name = 'Technician' AND u.status = 'active'
      ORDER BY u.first_name, u.last_name
    `

    const technicianLocations = result.map((row: any) => {
      const data = toCamelCase(row)

      // Determine status based on GPS activity and job status
      let status = "offline"
      if (data.lastGpsTimestamp) {
        const lastUpdate = new Date(data.lastGpsTimestamp)
        const now = new Date()
        const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)

        if (minutesSinceUpdate < 5 && data.jobStatus === "in_progress") {
          status = "active"
        } else if (minutesSinceUpdate < 30) {
          status = "idle"
        }
      }

      return {
        user: {
          id: data.userId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        },
        currentJob: data.jobId
          ? {
              id: data.jobId,
              title: data.jobTitle,
              locationAddress: data.jobLocation,
              status: data.jobStatus,
            }
          : undefined,
        lastGPSLog: data.latitude
          ? {
              latitude: data.latitude,
              longitude: data.longitude,
              timestamp: data.lastGpsTimestamp,
              journeyType: data.journeyType,
            }
          : undefined,
        status,
        journeyStartTime: data.journeyStartTime,
      }
    })

    return NextResponse.json(technicianLocations)
  } catch (error) {
    console.error("Tracking fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
