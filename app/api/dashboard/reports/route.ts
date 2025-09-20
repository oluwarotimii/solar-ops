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

      // Additional insights for overview
      const revenueData = await sql`
        SELECT 
          COALESCE(SUM(job_value), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN job_value ELSE 0 END), 0) as completed_revenue
        FROM jobs 
        WHERE created_at >= ${startDate}
      `;

      const avgJobValue = await sql`
        SELECT 
          COALESCE(AVG(job_value), 0) as average_job_value
        FROM jobs 
        WHERE created_at >= ${startDate} AND job_value > 0
      `;

      data = {
        overviewStats: {
          totalJobs: Number(total_jobs),
          completedJobs: Number(completed_jobs),
          customerSatisfaction: parseFloat(customer_satisfaction).toFixed(1),
          technicianUtilization: parseFloat(technicianUtilization.toString()).toFixed(1),
          totalRevenue: Number(revenueData[0].total_revenue),
          completedRevenue: Number(revenueData[0].completed_revenue),
          averageJobValue: Number(avgJobValue[0].average_job_value),
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

      // Additional insights for jobs
      const jobsByPriority = await sql`
        SELECT priority, COUNT(id) as count
        FROM jobs
        WHERE created_at >= ${startDate}
        GROUP BY priority
        ORDER BY priority
      `;

      const revenueByJobType = await sql`
        SELECT 
          jt.name,
          COUNT(j.id) as job_count,
          COALESCE(SUM(j.job_value), 0) as total_value
        FROM jobs j
        JOIN job_types jt ON j.job_type_id = jt.id
        WHERE j.created_at >= ${startDate}
        GROUP BY jt.name
        ORDER BY total_value DESC
      `;

      data = {
        jobsByType: jobsByType.map(toCamelCase),
        jobsByStatus: jobsByStatus.map(toCamelCase),
        jobsByPriority: jobsByPriority.map(toCamelCase),
        revenueByJobType: revenueByJobType.map(toCamelCase),
      };
    } else if (reportType === 'technicians') {
      // Performance summary for technicians
      const technicianPerformance = await sql`
        SELECT
          u.id,
          u.first_name || ' ' || u.last_name as name,
          u.email,
          COUNT(j.id) as completed_jobs,
          COALESCE(SUM(av_user.earned_amount), 0) as total_earned,
          COALESCE(AVG(av_user.rating), 0) as average_rating
        FROM users u
        LEFT JOIN jobs j ON j.status = 'completed' AND j.completed_at >= ${startDate} AND EXISTS (
          SELECT 1 FROM job_technicians jt WHERE jt.job_id = j.id AND jt.technician_id = u.id
        )
        LEFT JOIN (
          SELECT user_id, SUM(earned_amount) as earned_amount, AVG(rating) as rating
          FROM accrued_values
          WHERE created_at >= ${startDate}
          GROUP BY user_id
        ) av_user ON av_user.user_id = u.id
        WHERE u.role_id = (SELECT id FROM roles WHERE name = 'Technician')
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY total_earned DESC
      `;
      
      // Detailed job stats for all users
      const userJobStats = await sql`
        SELECT
          u.id,
          u.first_name || ' ' || u.last_name as name,
          u.email,
          COUNT(j.id) as total_jobs,
          COUNT(CASE WHEN j.status = 'completed' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN j.status = 'in_progress' THEN 1 END) as in_progress_jobs,
          COUNT(CASE WHEN j.status = 'assigned' THEN 1 END) as assigned_jobs,
          COUNT(CASE WHEN j.status = 'cancelled' THEN 1 END) as cancelled_jobs,
          COALESCE(SUM(j.job_value), 0) as total_value,
          COALESCE(SUM(CASE WHEN j.status = 'completed' THEN j.job_value ELSE 0 END), 0) as completed_value,
          COALESCE(SUM(av_user.earned_amount), 0) as total_earned
        FROM users u
        LEFT JOIN job_technicians jt ON jt.technician_id = u.id
        LEFT JOIN jobs j ON jt.job_id = j.id AND j.created_at >= ${startDate}
        LEFT JOIN (
          SELECT user_id, SUM(earned_amount) as earned_amount
          FROM accrued_values
          WHERE created_at >= ${startDate}
          GROUP BY user_id
        ) av_user ON av_user.user_id = u.id
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY total_earned DESC
      `;

      data = {
        technicianPerformance: technicianPerformance.map(toCamelCase),
        userJobStats: userJobStats.map(toCamelCase),
      };
    } else if (reportType === 'maintenance') {
      // Maintenance stats
      const maintenanceStats = await sql`
        SELECT
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_tasks,
          COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_tasks
        FROM maintenance_templates mt
        JOIN maintenance_occurrences mo ON mt.id = mo.template_id
        WHERE mo.scheduled_date >= ${startDate}
      `;

      // Maintenance by technician
      const maintenanceByTechnician = await sql`
        SELECT
          u.id,
          u.first_name || ' ' || u.last_name as name,
          u.email,
          COUNT(mo.id) as total_tasks,
          COUNT(CASE WHEN mo.status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN mo.status = 'in_progress' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN mo.status = 'scheduled' THEN 1 END) as scheduled_tasks,
          COUNT(CASE WHEN mo.status = 'overdue' THEN 1 END) as overdue_tasks
        FROM users u
        LEFT JOIN maintenance_occurrences mo ON mo.assigned_to = u.id AND mo.scheduled_date >= ${startDate}
        WHERE u.role_id = (SELECT id FROM roles WHERE name = 'Technician')
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY completed_tasks DESC
      `;

      data = {
        maintenanceStats: maintenanceStats[0],
        maintenanceByTechnician: maintenanceByTechnician.map(toCamelCase),
      };
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Dashboard reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
