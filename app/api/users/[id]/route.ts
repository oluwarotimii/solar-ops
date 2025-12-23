import { NextResponse, type NextRequest } from "next/server";
import { getDbSql, toCamelCase } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission, hashPassword } from "@/lib/auth";

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

    const camelCaseRow = toCamelCase(rows[0]);
    const fetchedUser: any = {
      id: camelCaseRow.id,
      email: camelCaseRow.email,
      firstName: camelCaseRow.firstName,
      lastName: camelCaseRow.lastName,
      phone: camelCaseRow.phone,
      roleId: camelCaseRow.roleId,
      status: camelCaseRow.status,
      approved: camelCaseRow.status === 'active',
      createdAt: camelCaseRow.createdAt,
      updatedAt: camelCaseRow.updatedAt,
      referralPoints: camelCaseRow.referralPoints,
    };

    if (camelCaseRow.roleName) {
      fetchedUser.role = {
        id: camelCaseRow.roleId,
        name: camelCaseRow.roleName,
        description: camelCaseRow.roleDescription,
        isAdmin: camelCaseRow.roleIsAdmin,
        permissions: camelCaseRow.rolePermissions,
        createdAt: camelCaseRow.createdAt,
      };
    }

    return NextResponse.json(fetchedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
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
    const { email, firstName, lastName, phone, roleId, status, password } = await request.json();
    const db = getDbSql();

    const updates: any = {};
    if (email !== undefined) updates.email = email;
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (phone !== undefined) updates.phone = phone;
    if (roleId !== undefined) updates.role_id = parseInt(String(roleId), 10);
    if (status !== undefined) {
      const allowedStatuses = ['active', 'inactive', 'pending', 'deactivated'];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid user status provided" }, { status: 400 });
      }
      updates.status = status;
    }
    if (password) {
      updates.password_hash = await hashPassword(password);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No changes to update' }, { status: 200 });
    }

    updates.updated_at = new Date();

    const result = await db`
      UPDATE users
      SET ${db(updates)}
      WHERE id = ${params.id}
      RETURNING id;`;

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found or no changes made" }, { status: 404 });
    }

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
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
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}