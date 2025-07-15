
import { NextResponse, type NextRequest } from 'next/server';
import { getDbSql } from '@/lib/db';
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'notifications:mark_read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDbSql();
    await sql`
      UPDATE notifications
      SET is_read = TRUE, updated_at = NOW()
      WHERE id = ${params.id} AND recipient_id = ${user.id}
    `;

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('[NOTIFICATION_PATCH_READ]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
