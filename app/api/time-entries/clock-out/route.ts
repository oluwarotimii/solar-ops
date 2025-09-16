import { NextResponse, type NextRequest } from 'next/server';
import { getDbSql } from '@/lib/db';
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
    const db = getDbSql();

    // Find the open time entry
    const existingEntry = await db`
      SELECT id FROM time_entries WHERE user_id = ${user.id} AND clock_out IS NULL
    `;

    if (existingEntry.length === 0) {
      return NextResponse.json({ error: 'User is not clocked in' }, { status: 409 });
    }

    const result = await db`
      UPDATE time_entries
      SET clock_out = NOW()
      WHERE id = ${existingEntry[0].id}
      RETURNING id, clock_in, clock_out, notes;
    `;

    await logAuditEvent({
      userId: user.id,
      action: 'user_clock_out',
      targetType: 'time_entry',
      targetId: String(result[0].id), // Convert integer ID to string
      request,
    });

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error clocking out:', error);
    return NextResponse.json({ error: 'Failed to clock out' }, { status: 500 });
  }
}
