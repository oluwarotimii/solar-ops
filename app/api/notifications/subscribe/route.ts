import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"
import { getDbSql } from "@/lib/db"

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

export async function POST(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'notifications:subscribe')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json()
    const parsed = subscribeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 })
    }

    const { subscription } = parsed.data
    const sql = getDbSql()

    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key)
      VALUES (${user.id}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth})
      ON CONFLICT (user_id, endpoint)
      DO UPDATE SET
        p256dh_key = ${subscription.keys.p256dh},
        auth_key = ${subscription.keys.auth},
        updated_at = NOW()
    `

    return NextResponse.json({
      success: true,
      message: "Push subscription saved successfully",
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
  }
}
