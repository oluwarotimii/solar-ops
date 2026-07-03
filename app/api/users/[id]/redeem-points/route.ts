import { NextResponse, type NextRequest } from "next/server";
import { getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user: adminUser, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  // Only users with 'users:update' permission (typically admins) can redeem points
  if (!adminUser || !hasPermission(adminUser, 'users:update')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const targetUserId = params.id;

  if (!targetUserId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const db = getDbSql();

    // Fetch the user's current points before redeeming, for auditing purposes
    const [userToUpdate] = await db`
      SELECT first_name, last_name, referral_points FROM users WHERE id = ${targetUserId}
    `;

    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const pointsToRedeem = userToUpdate.referral_points;

    // Set referral_points to 0
    const result = await db`
      UPDATE users
      SET referral_points = 0, updated_at = NOW()
      WHERE id = ${targetUserId}
      RETURNING id;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found or no changes needed" }, { status: 404 });
    }

    // Log the audit event
    await logAuditEvent({
      userId: adminUser.id,
      action: "referral_points_redeemed",
      targetType: "user",
      targetId: targetUserId,
      details: {
        redeemedFor: `${userToUpdate.first_name} ${userToUpdate.last_name}`,
        pointsRedeemed: pointsToRedeem,
      },
      request,
    });

    return NextResponse.json({ message: 'Referral points redeemed successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to redeem referral points' }, { status: 500 });
  }
}
