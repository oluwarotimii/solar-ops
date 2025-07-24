import { NextResponse, type NextRequest } from "next/server";
import { getDbSql, toCamelCase, sql } from "@/lib/db";
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
        u.id, u.email, u.first_name, u.last_name, u.phone, u.role_id, u.status, u.created_at, u.updated_at,
        r.name as role_name, r.description as role_description, r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${params.id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const camelCaseRow = toCamelCase(rows[0]);
    const fetchedUser: User = {
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
    };

    if (camelCaseRow.roleName) {
      fetchedUser.role = {
        id: camelCaseRow.roleId,
        name: camelCaseRow.roleName,
        description: camelCaseRow.roleDescription,
        isAdmin: camelCaseRow.roleIsAdmin,
        permissions: camelCaseRow.rolePermissions,
        createdAt: camelCaseRow.createdAt, // Assuming role createdAt is also needed, or adjust as per Role interface
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

    // Fetch current user data to retain existing values if not provided in the request
    const currentUser = await db`
      SELECT email, first_name, last_name, status FROM users WHERE id = ${params.id}
    `;

    if (currentUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentEmail = currentUser[0].email;
    const newEmail = email || currentEmail; // Use new email if provided, otherwise retain current

    const currentFirstName = currentUser[0].first_name;
    const newFirstName = firstName || currentFirstName; // Use new first name if provided, otherwise retain current

    const currentLastName = currentUser[0].last_name;
    const newLastName = lastName || currentLastName; // Use new last name if provided, otherwise retain current

    const currentStatus = currentUser[0].status;
    const newStatus = status || currentStatus; // Use new status if provided, otherwise retain current

    // Validate status
    const allowedStatuses = ['active', 'inactive', 'pending'];
    if (newStatus && !allowedStatuses.includes(newStatus)) {
      return NextResponse.json({ error: "Invalid user status provided" }, { status: 400 });
    }

    let passwordHash = undefined;
    if (password) {
      passwordHash = await hashPassword(password);
    }

    const result = await db`
      UPDATE users
      SET
        email = ${newEmail},
        first_name = ${newFirstName},
        last_name = ${newLastName},
        phone = ${phone || null},
        role_id = ${roleId},
        status = ${newStatus},
        ${passwordHash ? sql`password_hash = ${passwordHash},` : sql``}
        updated_at = NOW()
      WHERE id = ${params.id}
      RETURNING id;
    `;

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
    await db`
      DELETE FROM users
      WHERE id = ${params.id}
    `;
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
