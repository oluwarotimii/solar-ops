import { type NextRequest, NextResponse } from "next/server";
import { getDbSql, toCamelCase } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'notifications:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDbSql();
    const notification = await sql`
      SELECT * FROM notifications WHERE id = ${params.id} ${!hasPermission(user, 'notifications:read:all') ? sql`AND recipient_id = ${user.id}` : sql``}
    `;

    if (notification.length === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json(toCamelCase(notification[0]));
  } catch (error) {
    console.error('[NOTIFICATION_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'notifications:update')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { title, message, type, readAt } = await request.json();
    const sql = getDbSql();

    const result = await sql`
      UPDATE notifications
      SET
        title = ${title},
        message = ${message},
        type = ${type || 'general'},
        read_at = ${readAt || null}
      WHERE id = ${params.id} ${!hasPermission(user, 'notifications:update:all') ? sql`AND recipient_id = ${user.id}` : sql``}
      RETURNING *;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Notification not found or no changes made" }, { status: 404 });
    }

    return NextResponse.json(toCamelCase(result[0]));
  } catch (error) {
    console.error('[NOTIFICATION_PUT]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'notifications:delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDbSql();
    await sql`
      DELETE FROM notifications
      WHERE id = ${params.id} ${!hasPermission(user, 'notifications:delete:all') ? sql`AND recipient_id = ${user.id}` : sql``}
    `;

    return NextResponse.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('[NOTIFICATION_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}