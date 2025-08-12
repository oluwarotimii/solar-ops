
import { NextResponse, type NextRequest } from 'next/server';
import { getDbSql, toCamelCase } from '@/lib/db';
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'notifications:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDbSql();
    const notifications = await sql`
      SELECT 
        n.*,
        r.first_name as recipient_first_name,
        r.last_name as recipient_last_name,
        r.email as recipient_email,
        s.first_name as sender_first_name,
        s.last_name as sender_last_name
      FROM notifications n
      JOIN users r ON n.recipient_id = r.id
      LEFT JOIN users s ON n.sender_id = s.id
      WHERE n.recipient_id = ${user.id} OR n.sender_id = ${user.id}
      ORDER BY n.created_at DESC
    `;

    const formattedNotifications = notifications.map((row: any) => {
      const notification = toCamelCase(row);
      notification.recipient = {
        id: notification.recipientId,
        name: `${notification.recipientFirstName} ${notification.recipientLastName}`,
        email: notification.recipientEmail,
      };
      delete notification.recipientFirstName;
      delete notification.recipientLastName;
      delete notification.recipientEmail;

      if (notification.senderId) {
        notification.sender = {
          id: notification.senderId,
          name: `${notification.senderFirstName} ${notification.senderLastName}`,
        };
        delete notification.senderFirstName;
        delete notification.senderLastName;
      }

      return notification;
    });

    return NextResponse.json(formattedNotifications);
  } catch (error) {
    console.error('[NOTIFICATIONS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'notifications:send')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { title, message, type, recipientId } = await request.json();
    const sql = getDbSql();

    if (!title || !message || !recipientId) {
      return NextResponse.json({ error: 'Title, message, and recipientId are required' }, { status: 400 });
    }

    await sql`
      INSERT INTO notifications (recipient_id, sender_id, title, message, type)
      VALUES (${recipientId}, ${user.id}, ${title}, ${message}, ${type || 'general'})
    `;

    return NextResponse.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATIONS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
