import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateApiRequest } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await prisma.timeEntry.findFirst({
      where: { userId: user.id, clockOut: null },
      include: {
        job: { select: { title: true, status: true } },
      },
    });

    if (!result) {
      return NextResponse.json({ isClockedIn: false });
    }

    return NextResponse.json({
      isClockedIn: true,
      id: result.id,
      jobId: result.jobId,
      jobTitle: result.job?.title ?? null,
      jobStatus: result.job?.status ?? null,
      clockIn: result.clockIn,
      latitude: result.latitude ? Number(result.latitude) : null,
      longitude: result.longitude ? Number(result.longitude) : null,
      notes: result.notes,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch current time entry' }, { status: 500 });
  }
}
