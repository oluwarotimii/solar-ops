import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hash } from 'bcrypt';
import { generate } from 'generate-password';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = params.id;

    // Generate a new random password
    const newPassword = generate({
      length: 12,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
    });

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10);

    // Update the user's password in the database
    await sql.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);

    return NextResponse.json({ newPassword });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
