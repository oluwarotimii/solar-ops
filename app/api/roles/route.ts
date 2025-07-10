import { NextResponse } from 'next/server';
import { getDbSql } from '@/lib/db';

export const revalidate = 0; // Ensure no caching for this API route

export async function GET(request: Request) {
  const isAdmin = request.headers.get('x-user-is-admin') === 'true';

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDbSql();
    const rows = await db`SELECT id, name FROM roles`;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}
