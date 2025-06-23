import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { subscription } = await request.json()

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }

    // In production, store subscription in database
    // await sql`
    //   INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, created_at)
    //   VALUES (${decoded.userId}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth}, NOW())
    //   ON CONFLICT (user_id, endpoint)
    //   DO UPDATE SET
    //     p256dh_key = ${subscription.keys.p256dh},
    //     auth_key = ${subscription.keys.auth},
    //     updated_at = NOW()
    // `

    return NextResponse.json({
      success: true,
      message: "Push subscription saved successfully",
    })
  } catch (error) {
    console.error("Subscribe notification error:", error)
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
  }
}
