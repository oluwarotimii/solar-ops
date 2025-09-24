import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";
import { getDbSql } from "@/lib/db";
import { sendPushNotification } from '@/lib/push';

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(req);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'notifications:send')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, message, type, recipientId } = await req.json();

    const sql = getDbSql();
    await sql`
      INSERT INTO notifications (recipient_id, sender_id, title, message, type)
      VALUES (${recipientId}, ${user.id}, ${title}, ${message}, ${type})
    `;

    // Send push notification
    const subscriptionsResult = await sql`
      SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = ${recipientId}
    `;

    const payload = { title, body: message };

    for (const row of subscriptionsResult) {
      const subscription = {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.p256dh_key,
          auth: row.auth_key,
        },
      };
      await sendPushNotification(subscription, payload);
    }

    return NextResponse.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATIONS_SEND_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}