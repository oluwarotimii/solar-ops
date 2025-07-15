import { type NextRequest, NextResponse } from "next/server"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'notifications:subscribe')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { subscription } = await request.json()

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }

    // In production, store subscription in database
    // await sql`
    //   INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, created_at)
    //   VALUES (${user.id}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth}, NOW())
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
