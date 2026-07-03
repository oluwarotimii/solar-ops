import { NextResponse, type NextRequest } from 'next/server';
import { z } from "zod";
import { prisma } from '@/lib/db';
import { authenticateApiRequest } from '@/lib/api-auth';
import { logAuditEvent } from '@/lib/audit';

const clockInSchema = z.object({
  jobId: z.string().uuid().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = clockInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", errors: parsed.error.errors }, { status: 400 });
    }
    const { notes, jobId, latitude, longitude } = parsed.data;

    // Check if there is an open time entry
    const existingEntry = await prisma.timeEntry.findFirst({
      where: { userId: user.id, clockOut: null },
      select: { id: true },
    });

    if (existingEntry) {
      return NextResponse.json({ error: 'User is already clocked in' }, { status: 409 });
    }

    // Validate jobId if provided
    if (jobId) {
      const assigned = await prisma.jobTechnician.findFirst({
        where: { jobId, technicianId: user.id },
        select: { id: true },
      });
      if (!assigned) {
        return NextResponse.json({ error: 'You are not assigned to this job' }, { status: 403 });
      }
    }

    const result = await prisma.timeEntry.create({
      data: {
        userId: user.id,
        jobId: jobId || null,
        latitude: latitude || null,
        longitude: longitude || null,
        notes: notes || null,
      },
      select: { id: true, jobId: true, clockIn: true, latitude: true, longitude: true, notes: true },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'user_clock_in',
      targetType: 'time_entry',
      targetId: result.id,
      details: { notes: notes || '', jobId: jobId || null, hasGps: !!(latitude && longitude) },
      request,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clock in' }, { status: 500 });
  }
}
