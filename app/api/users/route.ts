import { NextResponse, type NextRequest } from 'next/server';
import { getDbSql, toCamelCase } from '@/lib/db';
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission, hashPassword } from "@/lib/auth";

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
        r.name as role_name, r.description as role_description, r.is_admin as role_is_admin, r.permissions as role_permissions,
        COUNT(j.id) AS total_jobs,
        COUNT(CASE WHEN j.status = 'completed' THEN j.id END) AS completed_jobs,
        AVG(jt.rating) AS avg_rating,
        SUM(av.earned_amount) AS total_earned
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN job_technicians jt ON u.id = jt.technician_id
      LEFT JOIN jobs j ON jt.job_id = j.id
      LEFT JOIN accrued_values av ON u.id = av.user_id
      GROUP BY u.id, r.id
    `;
    console.log('[API] Raw user rows from DB:', rows);
    const users = rows.map(row => {
      const camelCaseRow = toCamelCase(row);
      const user: any = {
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
        stats: {
          totalJobs: parseInt(camelCaseRow.totalJobs || 0),
          completedJobs: parseInt(camelCaseRow.completedJobs || 0),
          avgRating: parseFloat(camelCaseRow.avgRating || 0),
          totalEarned: parseFloat(camelCaseRow.totalEarned || 0),
        }
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

export async function POST(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'users:create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { email, password, firstName, lastName, phone, roleId, status } = await request.json();

    if (!email || !password || !firstName || !lastName || !roleId) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const db = getDbSql();

    const existingUser = await db`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const result = await db`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, status)
      VALUES (${email}, ${hashedPassword}, ${firstName}, ${lastName}, ${phone || null}, ${roleId}, ${status || 'pending'})
      RETURNING id;
    `;

    return NextResponse.json({ id: result[0].id, message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}