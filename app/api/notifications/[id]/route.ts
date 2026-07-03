import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDbSql, toCamelCase } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

const updateNotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.string().optional().default('general'),
  readAt: z.string().nullable().optional(),
});

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
    const body = await request.json();
    const parsed = updateNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
    }

    const { title, message, type, readAt } = parsed.data;
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
    return new NextResponse('Internal Error', { status: 500 });
  }
}
