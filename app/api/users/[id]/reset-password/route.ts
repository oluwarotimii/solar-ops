import { NextResponse } from 'next/server';
import { getDbSql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generate } from 'generate-password';
import { authenticateApiRequest } from '@/lib/api-auth';
import { hasPermission } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    console.log('[Password Reset] Starting password reset process');
    
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      console.log('[Password Reset] Authentication failed or response provided');
      return response;
    }

    // Check if user has permission to reset passwords (admin only)
    if (!user || !hasPermission(user, 'users:reset_password')) {
      console.log('[Password Reset] User lacks permission to reset passwords');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = params.id;
    console.log(`[Password Reset] Admin ${user.email} requesting password reset for user ${userId}`);

    // Generate a new random password
    const newPassword = generate({
      length: 12,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
    });

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('[Password Reset] New password generated and hashed');

    // Update the user's password in the database using the correct method
    const sql = getDbSql();
    console.log('[Password Reset] Database connection established');
    
    const result = await sql`UPDATE users SET password_hash = ${hashedPassword} WHERE id = ${userId}`;
    console.log(`[Password Reset] Database update completed, ${result.count} rows affected`);

    // Check if any rows were affected
    if (result.count === 0) {
      console.log('[Password Reset] No rows affected - user not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the user's name for audit logging
    const [resetUser] = await sql`SELECT first_name, last_name, email FROM users WHERE id = ${userId}`;
    const userName = resetUser ? 
      (resetUser.first_name && resetUser.last_name ? 
        `${resetUser.first_name} ${resetUser.last_name}` : 
        resetUser.email) : 
      'Unknown User';

    // Log the password reset event
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

    console.log(`[Password Reset] Successfully reset password for user ${userId} by admin ${user.email}`);

    return NextResponse.json({ newPassword });
  } catch (error) {
    console.error('[Password Reset] Error resetting password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
