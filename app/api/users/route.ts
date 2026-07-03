import { NextResponse, type NextRequest } from 'next/server';
import { getDbSql, toCamelCase } from '@/lib/db';
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission, hashPassword } from "@/lib/auth";
import { z } from "zod";

export const revalidate = 0;

const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(2, "First name is required").max(100),
  lastName: z.string().min(2, "Last name is required").max(100),
  phone: z.string().optional().nullable(),
  roleId: z.string().uuid("Invalid role ID"),
  status: z.string().optional(),
});

interface UserResponse {
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
  stats: {
    totalJobs: number;
    completedJobs: number;
    avgRating: number;
  };
  role?: {
    id: string | null;
    name: string;
    description: string | null;
    isAdmin: boolean | null;
    permissions: unknown;
    createdAt: Date | null;
  };
}

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
        (SELECT COUNT(*) FROM job_technicians WHERE technician_id = u.id) AS total_jobs,
        (SELECT COUNT(*) FROM job_technicians jt JOIN jobs j ON jt.job_id = j.id WHERE jt.technician_id = u.id AND j.status = 'completed') AS completed_jobs,
        (SELECT AVG(rating) FROM job_technicians WHERE technician_id = u.id) AS avg_rating
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      GROUP BY u.id, r.id
    `;
    const users: UserResponse[] = rows.map((row: Record<string, unknown>) => {
      const camelCaseRow = toCamelCase(row) as Record<string, unknown>;
      const user: UserResponse = {
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
        stats: {
          totalJobs: parseInt((camelCaseRow.totalJobs as string) || "0"),
          completedJobs: parseInt((camelCaseRow.completedJobs as string) || "0"),
          avgRating: parseFloat((camelCaseRow.avgRating as string) || "0"),
        }
      };

      if (camelCaseRow.roleName) {
        user.role = {
          id: camelCaseRow.roleId as string | null,
          name: camelCaseRow.roleName as string,
          description: camelCaseRow.roleDescription as string | null,
          isAdmin: camelCaseRow.roleIsAdmin as boolean | null,
          permissions: camelCaseRow.rolePermissions,
          createdAt: camelCaseRow.createdAt as Date | null,
        };
      }
      return user;
    });
    return NextResponse.json(users);
  } catch (error) {
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
    const body = await request.json();
    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { email, password, firstName, lastName, phone, roleId, status } = validation.data;

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
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}