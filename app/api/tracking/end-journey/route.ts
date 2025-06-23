import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, jobId, latitude, longitude } = await request.json()

    // End tracking journey
    const journeyEnd = {
      id: Date.now().toString(),
      userId,
      jobId,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
      journeyType: "return",
      status: "completed",
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      journey: journeyEnd,
      message: "Journey tracking ended - back to base",
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to end journey tracking" }, { status: 500 })
  }
}
