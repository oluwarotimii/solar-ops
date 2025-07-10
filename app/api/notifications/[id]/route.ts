
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // For now, we'll just return a success message.
    // In the future, this will delete the notification from the database.
    return NextResponse.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('[NOTIFICATION_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
