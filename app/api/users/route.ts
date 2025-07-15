import { NextResponse, type NextRequest } from 'next/server';
import { getDbSql, toCamelCase } from '@/lib/db';
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export const revalidate = 0; // Ensure no caching for this API route

export async function GET(request: NextRequest) {
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
    `;
    console.log('[API] Raw user rows from DB:', rows);
    const users = rows.map(row => {
      const camelCaseRow = toCamelCase(row);
      const user: User = {
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
        user.role = {
          id: camelCaseRow.roleId,
          name: camelCaseRow.roleName,
          description: camelCaseRow.roleDescription,
          isAdmin: camelCaseRow.roleIsAdmin,
          permissions: camelCaseRow.rolePermissions,
          createdAt: camelCaseRow.createdAt, // Assuming role createdAt is also needed, or adjust as per Role interface
        };
      }
      return user;
    });
    console.log('[API] Transformed users for frontend:', users);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
