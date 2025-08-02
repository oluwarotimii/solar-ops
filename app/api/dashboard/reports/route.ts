import { type NextRequest, NextResponse } from "next/server";
import { getDbSql, toCamelCase } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'reports:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDbSql();
    const { searchParams } = request.nextUrl;
    const reportType = searchParams.get('type') || 'overview';
    const dateRange = searchParams.get('range') || '30';

    const getStartDate = (range: string): Date => {
      const now = new Date();
      const days = parseInt(range, 10);
      if (isNaN(days)) return new Date(0); // Default to a very old date if range is invalid
      now.setDate(now.getDate() - days);
      return now;
    };

    const startDate = getStartDate(dateRange);

    let data = {};

    if (reportType === 'overview') {
      const overviewStats = await sql`
        SELECT
          (SELECT COUNT(*) FROM jobs WHERE created_at >= ${startDate}) as total_jobs,
          (SELECT COUNT(*) FROM jobs WHERE status = 'completed' AND completed_at >= ${startDate}) as completed_jobs,
          (SELECT COALESCE(AVG(rating), 0) FROM accrued_values WHERE created_at >= ${startDate}) as customer_satisfaction,
          (SELECT COUNT(DISTINCT id) FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'Technician')) as total_technicians
      `;

      const technicianUtilizationResult = await sql`
          SELECT COUNT(DISTINCT technician_id) as active_technicians
          FROM job_technicians jt
          JOIN jobs j ON jt.job_id = j.id
          WHERE j.created_at >= ${startDate}
      `;

      const { total_jobs, completed_jobs, customer_satisfaction, total_technicians } = overviewStats[0];
      const active_technicians = technicianUtilizationResult[0].active_technicians;
      const technicianUtilization = total_technicians > 0 ? (active_technicians / total_technicians) * 100 : 0;

      data = {
        overviewStats: {
          totalJobs: Number(total_jobs),
          completedJobs: Number(completed_jobs),
          customerSatisfaction: parseFloat(customer_satisfaction).toFixed(1),
          technicianUtilization: parseFloat(technicianUtilization.toString()).toFixed(1),
        }
      };
    } else if (reportType === 'jobs') {
      const jobsByType = await sql`
        SELECT jt.name, COUNT(j.id) as count
        FROM jobs j
        JOIN job_types jt ON j.job_type_id = jt.id
        WHERE j.created_at >= ${startDate}
        GROUP BY jt.name
        ORDER BY count DESC
      `;

      const jobsByStatus = await sql`
        SELECT status, COUNT(id) as count
        FROM jobs
        WHERE created_at >= ${startDate}
        GROUP BY status
        ORDER BY status
      `;

      data = {
        jobsByType: jobsByType.map(toCamelCase),
        jobsByStatus: jobsByStatus.map(toCamelCase),
      };
    } else if (reportType === 'technicians') {
      const technicianPerformance = await sql`
        SELECT
          u.id,
          u.first_name || ' ' || u.last_name as name,
          u.email,
          COUNT(j.id) as completed_jobs,
          COALESCE(SUM(av.earned_amount), 0) as total_earned,
          COALESCE(AVG(av.rating), 0) as average_rating
        FROM users u
        LEFT JOIN jobs j ON j.status = 'completed' AND j.completed_at >= ${startDate} AND EXISTS (
          SELECT 1 FROM job_technicians jt WHERE jt.job_id = j.id AND jt.technician_id = u.id
        )
        LEFT JOIN accrued_values av ON av.user_id = u.id AND av.created_at >= ${startDate}
        WHERE u.role_id = (SELECT id FROM roles WHERE name = 'Technician')
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY total_earned DESC
      `;
      data = {
        technicianPerformance: technicianPerformance.map(toCamelCase),
      };
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Dashboard reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
