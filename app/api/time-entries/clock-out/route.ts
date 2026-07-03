import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateApiRequest } from '@/lib/api-auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const existingEntry = await prisma.timeEntry.findFirst({
      where: { userId: user.id, clockOut: null },
      select: { id: true },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'User is not clocked in' }, { status: 409 });
    }

    const result = await prisma.timeEntry.update({
      where: { id: existingEntry.id },
      data: { clockOut: new Date() },
      select: { id: true, clockIn: true, clockOut: true, jobId: true, notes: true },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'user_clock_out',
      targetType: 'time_entry',
      targetId: result.id,
      request,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clock out' }, { status: 500 });
  }
}
