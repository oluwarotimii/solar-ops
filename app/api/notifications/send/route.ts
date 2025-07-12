import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiRequest } from "@/lib/api-auth";
import { getDbSql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(req);
    if (response) {
      return response;
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { title, message, type, recipientId } = await req.json();

    // In a real app, this would save to database
    const sql = getDbSql();
    await sql`
      INSERT INTO notifications (recipient_id, sender_id, title, message, type)
      VALUES (${recipientId}, ${user.id}, ${title}, ${message}, ${type})
    `;

    return NextResponse.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('[NOTIFICATIONS_SEND_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}