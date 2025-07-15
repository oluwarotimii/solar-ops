
import { NextResponse, type NextRequest } from 'next/server';
import { getDbSql } from '@/lib/db';
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

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
      WHERE id = ${params.id} AND recipient_id = ${user.id}
    `;

    return NextResponse.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('[NOTIFICATION_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
