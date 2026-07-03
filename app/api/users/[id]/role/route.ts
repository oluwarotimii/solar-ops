import { NextResponse, type NextRequest } from 'next/server';
import { getDbSql } from '@/lib/db';
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";
import { z } from "zod";

const updateRoleSchema = z.object({
  roleId: z.string().uuid("Invalid role ID"),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'users:update')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = updateRoleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { roleId } = validation.data;
    const db = getDbSql();
    await db`
      UPDATE users
      SET role_id = ${roleId}
      WHERE id = ${params.id}
    `;
    return NextResponse.json({ message: 'User role updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
