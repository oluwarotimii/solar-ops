import { NextResponse, type NextRequest } from 'next/server';
import { getDbSql } from '@/lib/db';
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";
import { z } from "zod";

export const revalidate = 0;

const createRoleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional().nullable(),
  permissions: z.any().optional(),
});

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'roles:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDbSql();
    const rows = await db`SELECT id, name, description, permissions FROM roles`;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'roles:create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = createRoleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { name, description, permissions } = validation.data;
    const db = getDbSql();
    const result = await db`
      INSERT INTO roles (name, description, permissions)
      VALUES (${name}, ${description}, ${permissions})
      RETURNING id;
    `;
    return NextResponse.json({ id: result[0].id, message: 'Role created successfully' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
