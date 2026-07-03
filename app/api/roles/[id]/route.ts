import { NextResponse, type NextRequest } from 'next/server';
import { getDbSql } from '@/lib/db';
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";
import { z } from "zod";

const updateRoleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional().nullable(),
  permissions: z.any().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'roles:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDbSql();
    const role = await db`SELECT id, name, description, permissions FROM roles WHERE id = ${params.id}`;

    if (role.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json(role[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch role' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'roles:update')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = updateRoleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { name, description, permissions } = validation.data;
    const db = getDbSql();
    await db`
      UPDATE roles
      SET name = ${name}, description = ${description}, permissions = ${permissions}
      WHERE id = ${params.id}
    `;
    return NextResponse.json({ message: 'Role updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'roles:delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDbSql();
    await db`
      DELETE FROM roles
      WHERE id = ${params.id}
    `;
    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}