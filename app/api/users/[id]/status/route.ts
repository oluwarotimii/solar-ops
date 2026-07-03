import { NextResponse, type NextRequest } from 'next/server';
import { getDbSql } from '@/lib/db';
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["active", "inactive", "pending", "deactivated"], { required_error: "Status is required" }),
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
    const { id } = params;
    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { status } = validation.data;

    const db = getDbSql();
    const result = await db`
      UPDATE users
      SET status = ${status},
      updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, status;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
  }
}
