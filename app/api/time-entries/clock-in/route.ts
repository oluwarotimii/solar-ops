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
    const { notes } = await request.json();
    const db = getDbSql();

    // Check if there is an open time entry
    const existingEntry = await db`
      SELECT id FROM time_entries WHERE user_id = ${user.id} AND clock_out IS NULL
    `;

    if (existingEntry.length > 0) {
      return NextResponse.json({ error: 'User is already clocked in' }, { status: 409 });
    }

    const result = await db`
      INSERT INTO time_entries (user_id, notes)
      VALUES (${user.id}, ${notes || null})
      RETURNING id, clock_in, notes;
    `;

    await logAuditEvent({
      userId: user.id,
      action: 'user_clock_in',
      targetType: 'time_entry',
      targetId: String(result[0].id), // Convert integer ID to string
      details: { notes: notes || '' },
      request,
    });

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error clocking in:', error);
    return NextResponse.json({ error: 'Failed to clock in' }, { status: 500 });
  }
}
