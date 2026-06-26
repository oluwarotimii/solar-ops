import { NextResponse, type NextRequest } from 'next/server';
import { getDbSql, toCamelCase } from '@/lib/db';
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  // Technicians can see other technicians? Usually yes, but let's check permissions
  if (!user || (!hasPermission(user, 'users:read') && !hasPermission(user, 'tracking:read'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDbSql();
    const rows = await db`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone, u.status,
        (SELECT COUNT(*) FROM job_technicians WHERE technician_id = u.id) AS total_jobs,
        (SELECT COUNT(*) FROM job_technicians jt JOIN jobs j ON jt.job_id = j.id WHERE jt.technician_id = u.id AND j.status = 'completed') AS completed_jobs,
        (SELECT AVG(rating) FROM job_technicians WHERE technician_id = u.id) AS avg_rating,
        (SELECT SUM(earned_amount) FROM accrued_values WHERE user_id = u.id) AS total_earned
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'Technician'
      GROUP BY u.id
    `;

    const technicians = rows.map(row => {
      const camelCaseRow = toCamelCase(row);
      return {
        id: camelCaseRow.id,
        firstName: camelCaseRow.firstName,
        lastName: camelCaseRow.lastName,
        email: camelCaseRow.email,
        phone: camelCaseRow.phone,
        status: camelCaseRow.status,
        stats: {
          totalJobs: parseInt(camelCaseRow.totalJobs || 0),
          completedJobs: parseInt(camelCaseRow.completedJobs || 0),
          avgRating: parseFloat(camelCaseRow.avgRating || 0),
          totalEarned: parseFloat(camelCaseRow.totalEarned || 0)
        }
      };
    });

    return NextResponse.json(technicians);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    return NextResponse.json({ error: 'Failed to fetch technicians' }, { status: 500 });
  }
}
