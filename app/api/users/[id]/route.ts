import { NextResponse, type NextRequest } from "next/server";
import { getDbSql, toCamelCase } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission, hashPassword } from "@/lib/auth";
import { z } from "zod";

interface FetchedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roleId: string | null;
  status: string | null;
  approved: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  referralPoints: number | null;
  role?: {
    id: string | null;
    name: string;
    description: string | null;
    isAdmin: boolean | null;
    permissions: unknown;
    createdAt: Date | null;
  };
}

const updateUserSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  firstName: z.string().min(2).max(100).optional(),
  lastName: z.string().min(2).max(100).optional(),
  phone: z.string().optional().nullable(),
  roleId: z.string().optional(),
  status: z.enum(["active", "inactive", "pending", "deactivated"]).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'users:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDbSql();
    const rows = await db`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone, u.role_id, u.status, u.created_at, u.updated_at, u.referral_points,
        r.name as role_name, r.description as role_description, r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${params.id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const camelCaseRow = toCamelCase(rows[0]) as Record<string, unknown>;
    const fetchedUser: FetchedUser = {
      id: camelCaseRow.id as string,
      email: camelCaseRow.email as string,
      firstName: camelCaseRow.firstName as string,
      lastName: camelCaseRow.lastName as string,
      phone: (camelCaseRow.phone as string) || null,
      roleId: (camelCaseRow.roleId as string) || null,
      status: (camelCaseRow.status as string) || null,
      approved: camelCaseRow.status === 'active',
      createdAt: camelCaseRow.createdAt as Date | null,
      updatedAt: camelCaseRow.updatedAt as Date | null,
      referralPoints: (camelCaseRow.referralPoints as number) || null,
    };

    if (camelCaseRow.roleName) {
      fetchedUser.role = {
        id: camelCaseRow.roleId as string | null,
        name: camelCaseRow.roleName as string,
        description: camelCaseRow.roleDescription as string | null,
        isAdmin: camelCaseRow.roleIsAdmin as boolean | null,
        permissions: camelCaseRow.rolePermissions,
        createdAt: camelCaseRow.createdAt as Date | null,
      };
    }

    return NextResponse.json(fetchedUser);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'users:update')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { email, firstName, lastName, phone, roleId, status, password } = validation.data;
    const db = getDbSql();

    const updates: Record<string, unknown> = {};
    if (email !== undefined) updates.email = email;
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (phone !== undefined) updates.phone = phone;
    if (roleId !== undefined) updates.role_id = roleId;
    if (status !== undefined) {
      updates.status = status;
    }
    if (password) {
      updates.password_hash = await hashPassword(password);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No changes to update' }, { status: 200 });
    }

    updates.updated_at = new Date();

    const keys = Object.keys(updates);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
    const values = keys.map((k) => updates[k]);
    values.push(params.id);
    const query = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${keys.length + 1} RETURNING id;`;
    const result = await db.query(query, values);

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found or no changes made" }, { status: 404 });
    }

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'users:delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDbSql();
    const result = await db`
      DELETE FROM users
      WHERE id = ${params.id}
      RETURNING id;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ id: result[0].id, message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}