
import { NextResponse, type NextRequest } from 'next/server';
import { getDbSql, toCamelCase } from '@/lib/db';
import { authenticateApiRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sql = getDbSql();
    const notifications = await sql`
      SELECT * FROM notifications WHERE recipient_id = ${user.id} ORDER BY created_at DESC
    `;
    return NextResponse.json(notifications.map(toCamelCase));
  } catch (error) {
    console.error('[NOTIFICATIONS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
