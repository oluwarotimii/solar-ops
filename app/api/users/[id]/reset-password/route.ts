import { NextResponse } from 'next/server';
import { getDbSql } from '@/lib/db';
import { hash } from 'bcrypt';
import { generate } from 'generate-password';
import { authenticateApiRequest } from '@/lib/api-auth';
import { hasPermission } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    // Check if user has permission to reset passwords (admin only)
    if (!user || !hasPermission(user, 'users:reset_password')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    // Update the user's password in the database using the correct method
    const sql = getDbSql();
    const result = await sql`UPDATE users SET password_hash = ${hashedPassword} WHERE id = ${userId}`;

    if (result.count === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log the password reset event
    await logAuditEvent({
      userId: user.id,
      action: 'user_password_reset',
      targetType: 'user',
      targetId: userId,
      details: { 
        resetBy: user.email,
        resetUserId: userId
      },
      request,
    });

    return NextResponse.json({ newPassword });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
