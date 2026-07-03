import { NextResponse } from 'next/server';
import { getDbSql } from '@/lib/db';
import bcrypt from 'bcryptjs';
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

    const userId = params.id;

    if (!user || (!hasPermission(user, 'users:reset_password') && user.id !== userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const newPassword = generate({
      length: 12,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
    });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const sql = getDbSql();

    const result = await sql`UPDATE users SET password_hash = ${hashedPassword} WHERE id = ${userId}`;

    if (result.count === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [resetUser] = await sql`SELECT first_name, last_name, email FROM users WHERE id = ${userId}`;
    const userName = resetUser ? 
      (resetUser.first_name && resetUser.last_name ? 
        `${resetUser.first_name} ${resetUser.last_name}` : 
        resetUser.email) : 
      'Unknown User';

    await logAuditEvent({
      userId: user.id,
      action: 'user_password_reset',
      targetType: 'user',
      targetId: userId,
      details: { 
        resetBy: user.email,
        resetUserId: userId,
        userName: userName
      },
      request,
    });

    return NextResponse.json({ newPassword });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
