import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import webpush from "web-push"

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_EMAIL) {
  webpush.setVapidDetails(process.env.VAPID_EMAIL, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
}

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

    const { title, message, recipients, data, type = "general" } = await request.json()

    if (!title || !message || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // In production, you would:
    // 1. Get push subscriptions for the specified recipients from database
    // 2. Send push notifications to each subscription
    // 3. Store notification in database
    // 4. Send SMS/Email if enabled

    const payload = JSON.stringify({
      title,
      body: message,
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      data: {
        ...data,
        type,
        timestamp: new Date().toISOString(),
      },
    })

    // Simulate sending notifications
    const results = []
    for (const recipientId of recipients) {
      // In production, get actual subscription from database
      // const subscription = await getSubscriptionForUser(recipientId)
      // if (subscription) {
      //   await webpush.sendNotification(subscription, payload)
      // }

      results.push({
        recipientId,
        success: true,
        message: "Notification sent successfully",
      })
    }

    // Store notification in database (simulated)
    const notification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      recipients,
      data,
      sentAt: new Date().toISOString(),
      senderId: decoded.userId,
    }

    return NextResponse.json({
      success: true,
      notification,
      results,
      message: `Notification sent to ${recipients.length} technician(s)`,
    })
  } catch (error) {
    console.error("Send notification error:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
