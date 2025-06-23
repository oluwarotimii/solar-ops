import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, jobId, latitude, longitude, accuracy, journeyType } = await request.json()

    // In a real app, this would save to database
    const gpsLog = {
      id: Date.now().toString(),
      userId,
      jobId,
      latitude,
      longitude,
      accuracy,
      timestamp: new Date().toISOString(),
      journeyType, // "start", "active", "site_arrival", "site_departure", "return"
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200))

    return NextResponse.json({
      success: true,
      gpsLog,
      message: "GPS location logged successfully",
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to log GPS location" }, { status: 500 })
  }
}
