import { NextResponse, type NextRequest } from 'next/server';
import { getDbSql } from '@/lib/db';
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
    const db = getDbSql();

    const result = await db`
      SELECT id, clock_in, notes FROM time_entries WHERE user_id = ${user.id} AND clock_out IS NULL
    `;

    if (result.length === 0) {
      return NextResponse.json({ isClockedIn: false });
    }

    return NextResponse.json({ isClockedIn: true, ...result[0] });
  } catch (error) {
    console.error('Error fetching current time entry:', error);
    return NextResponse.json({ error: 'Failed to fetch current time entry' }, { status: 500 });
  }
}
