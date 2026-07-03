import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

interface TimeOverviewRow {
  activeTechnicians: number;
  totalShifts: number;
  totalHoursWorked: number;
}

interface TimeTechnicianRow {
  id: string;
  name: string;
  email: string;
  shiftsCount: bigint;
  totalHours: number;
  avgShiftHours: number;
}

interface TimeJobRow {
  id: string;
  title: string;
  jobType: string | null;
  clockIns: bigint;
  totalHours: number;
  avgHoursPerShift: number;
  jobValue: string | null;
}

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user || !hasPermission(user, 'reports:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const reportType = searchParams.get('type') || 'overview';
    const dateRange = searchParams.get('range') || '30';

    const getStartDate = (range: string): Date => {
      const now = new Date();
      const days = parseInt(range, 10);
      if (isNaN(days)) return new Date(0);
      now.setDate(now.getDate() - days);
      return now;
    };

    const startDate = getStartDate(dateRange);

    let data = {};

    if (reportType === 'overview') {
      const [
        totalJobs,
        completedJobs,
        customerSatisfaction,
        totalTechnicians,
        activeTechnicians,
        revenueData,
        avgJobValueData,
      ] = await Promise.all([
        prisma.job.count({ where: { createdAt: { gte: startDate } } }),
        prisma.job.count({ where: { status: 'completed', completedAt: { gte: startDate } } }),
        prisma.accruedValue.aggregate({ _avg: { rating: true }, where: { createdAt: { gte: startDate } } }),
        prisma.user.count({ where: { role: { name: 'Technician' } } }),
        prisma.jobTechnician.groupBy({
          by: ['technicianId'],
          where: { job: { createdAt: { gte: startDate } } },
        }).then((r) => r.length),
        prisma.job.aggregate({
          _sum: { jobValue: true },
          where: { createdAt: { gte: startDate } },
        }),
        prisma.job.aggregate({
          _avg: { jobValue: true },
          where: { createdAt: { gte: startDate }, jobValue: { gt: 0 } },
        }),
      ]);

      const completedRevenue = await prisma.job.aggregate({
        _sum: { jobValue: true },
        where: { status: 'completed', createdAt: { gte: startDate } },
      });

      const technicianUtilization = totalTechnicians > 0 ? (activeTechnicians / totalTechnicians) * 100 : 0;

      data = {
        overviewStats: {
          totalJobs,
          completedJobs,
          customerSatisfaction: (customerSatisfaction._avg.rating ?? 0).toFixed(1),
          technicianUtilization: technicianUtilization.toFixed(1),
          totalRevenue: Number(revenueData._sum.jobValue ?? 0),
          completedRevenue: Number(completedRevenue._sum.jobValue ?? 0),
          averageJobValue: Number(avgJobValueData._avg.jobValue ?? 0),
        },
      };
    } else if (reportType === 'jobs') {
      const [jobsByType, jobsByStatus, jobsByPriority, revenueByJobType] = await Promise.all([
        prisma.job.groupBy({
          by: ['jobTypeId'],
          where: { createdAt: { gte: startDate }, jobTypeId: { not: null } },
          _count: { id: true },
        }).then(async (rows) => {
          const typeIds = rows.map((r) => r.jobTypeId!);
          const types = typeIds.length > 0
            ? await prisma.jobType.findMany({ where: { id: { in: typeIds } }, select: { id: true, name: true } })
            : [];
          const typeMap = new Map(types.map((t) => [t.id, t.name]));
          return rows.map((r) => ({ name: typeMap.get(r.jobTypeId!) ?? 'Unknown', count: r._count.id }));
        }),
        prisma.job.groupBy({
          by: ['status'],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
        }).then((rows) => rows.map((r) => ({ status: r.status, count: r._count.id }))),
        prisma.job.groupBy({
          by: ['priority'],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
        }).then((rows) => rows.map((r) => ({ priority: r.priority, count: r._count.id }))),
        prisma.job.groupBy({
          by: ['jobTypeId'],
          where: { createdAt: { gte: startDate }, jobTypeId: { not: null } },
          _count: { id: true },
          _sum: { jobValue: true },
        }).then(async (rows) => {
          const typeIds = rows.map((r) => r.jobTypeId!);
          const types = typeIds.length > 0
            ? await prisma.jobType.findMany({ where: { id: { in: typeIds } }, select: { id: true, name: true } })
            : [];
          const typeMap = new Map(types.map((t) => [t.id, t.name]));
          return rows.map((r) => ({
            name: typeMap.get(r.jobTypeId!) ?? 'Unknown',
            jobCount: r._count.id,
            totalValue: Number(r._sum.jobValue ?? 0),
          }));
        }),
      ]);

      data = { jobsByType, jobsByStatus, jobsByPriority, revenueByJobType };
    } else if (reportType === 'technicians') {
      const technicianRole = await prisma.role.findFirst({ where: { name: 'Technician' }, select: { id: true } });

      const technicianPerformance = await prisma.user.findMany({
        where: { roleId: technicianRole?.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          jobTechnicians: {
            where: { job: { status: 'completed', completedAt: { gte: startDate } } },
            select: { jobId: true },
          },
        },
      });

      const techPerformance = await Promise.all(
        technicianPerformance.map(async (tech) => {
          const earnedAgg = await prisma.accruedValue.aggregate({
            _sum: { earnedAmount: true },
            _avg: { rating: true },
            where: { userId: tech.id, createdAt: { gte: startDate } },
          });
          return {
            id: tech.id,
            name: `${tech.firstName} ${tech.lastName}`,
            email: tech.email,
            completedJobs: tech.jobTechnicians.length,
            totalEarned: Number(earnedAgg._sum.earnedAmount ?? 0),
            averageRating: Number(earnedAgg._avg.rating ?? 0),
          };
        })
      );

      techPerformance.sort((a, b) => b.totalEarned - a.totalEarned);

      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          jobTechnicians: {
            where: { job: { createdAt: { gte: startDate } } },
            include: { job: { select: { status: true, jobValue: true } } },
          },
        },
      });

      const userJobStats = allUsers.map((u) => {
        const jobs = u.jobTechnicians.map((jt) => jt.job);
        const totalValue = jobs.reduce((s, j) => s + Number(j.jobValue ?? 0), 0);
        const completedValue = jobs
          .filter((j) => j.status === 'completed')
          .reduce((s, j) => s + Number(j.jobValue ?? 0), 0);
        return {
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          totalJobs: jobs.length,
          completedJobs: jobs.filter((j) => j.status === 'completed').length,
          inProgressJobs: jobs.filter((j) => j.status === 'in_progress').length,
          assignedJobs: jobs.filter((j) => j.status === 'assigned').length,
          cancelledJobs: jobs.filter((j) => j.status === 'cancelled').length,
          totalValue,
          completedValue,
          totalEarned: 0,
        };
      });

      data = {
        technicianPerformance: techPerformance,
        userJobStats,
      };
    } else if (reportType === 'maintenance') {
      const [totalTasks, completedTasks, inProgressTasks, scheduledTasks] = await Promise.all([
        prisma.maintenanceOccurrence.count({ where: { scheduledDate: { gte: startDate } } }),
        prisma.maintenanceOccurrence.count({ where: { status: 'completed', scheduledDate: { gte: startDate } } }),
        prisma.maintenanceOccurrence.count({ where: { status: 'in_progress', scheduledDate: { gte: startDate } } }),
        prisma.maintenanceOccurrence.count({ where: { status: 'scheduled', scheduledDate: { gte: startDate } } }),
      ]);

      const maintenanceStats = {
        totalTasks,
        completedTasks,
        inProgressTasks,
        scheduledTasks,
        overdueTasks: 0,
      };

      const technicianRole = await prisma.role.findFirst({ where: { name: 'Technician' }, select: { id: true } });
      const maintenanceByTechnician = await prisma.user.findMany({
        where: { roleId: technicianRole?.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          maintenanceOccurrences: {
            where: { scheduledDate: { gte: startDate } },
            select: { status: true },
          },
        },
      });

      data = {
        maintenanceStats,
        maintenanceByTechnician: maintenanceByTechnician.map((tech) => {
          const occs = tech.maintenanceOccurrences;
          return {
            id: tech.id,
            name: `${tech.firstName} ${tech.lastName}`,
            email: tech.email,
            totalTasks: occs.length,
            completedTasks: occs.filter((o) => o.status === 'completed').length,
            inProgressTasks: occs.filter((o) => o.status === 'in_progress').length,
            scheduledTasks: occs.filter((o) => o.status === 'scheduled').length,
            overdueTasks: occs.filter((o) => o.status === 'missed').length,
          };
        }),
      };
    } else if (reportType === 'time') {
      const timeRows = await prisma.$queryRaw<TimeOverviewRow[]>`
        SELECT
          COUNT(DISTINCT te.user_id) as "activeTechnicians",
          COUNT(te.id) as "totalShifts",
          COALESCE(SUM(EXTRACT(EPOCH FROM (te.clock_out - te.clock_in)) / 3600), 0) as "totalHoursWorked"
        FROM time_entries te
        WHERE te.created_at >= ${startDate}
          AND te.clock_out IS NOT NULL
      `;
      const timeOverview = timeRows[0];

      const hoursByTechnician = await prisma.$queryRaw<TimeTechnicianRow[]>`
        SELECT
          u.id,
          u.first_name || ' ' || u.last_name as name,
          u.email,
          COUNT(te.id) as "shiftsCount",
          COALESCE(SUM(EXTRACT(EPOCH FROM (te.clock_out - te.clock_in)) / 3600), 0) as "totalHours",
          COALESCE(AVG(EXTRACT(EPOCH FROM (te.clock_out - te.clock_in)) / 3600), 0) as "avgShiftHours"
        FROM users u
        JOIN time_entries te ON te.user_id = u.id
        WHERE te.created_at >= ${startDate}
          AND te.clock_out IS NOT NULL
          AND u.role_id = (SELECT id FROM roles WHERE name = 'Technician')
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY "totalHours" DESC
      `;

      const hoursByJob = await prisma.$queryRaw<TimeJobRow[]>`
        SELECT
          j.id,
          j.title,
          jt.name as "jobType",
          COUNT(te.id) as "clockIns",
          COALESCE(SUM(EXTRACT(EPOCH FROM (te.clock_out - te.clock_in)) / 3600), 0) as "totalHours",
          COALESCE(AVG(EXTRACT(EPOCH FROM (te.clock_out - te.clock_in)) / 3600), 0) as "avgHoursPerShift",
          j.job_value as "jobValue"
        FROM jobs j
        JOIN time_entries te ON te.job_id = j.id
        LEFT JOIN job_types jt ON j.job_type_id = jt.id
        WHERE te.created_at >= ${startDate}
          AND te.clock_out IS NOT NULL
          AND te.job_id IS NOT NULL
        GROUP BY j.id, j.title, jt.name, j.job_value
        ORDER BY "totalHours" DESC
      `;

      data = {
        timeOverview: timeOverview ?? { activeTechnicians: 0, totalShifts: 0, totalHoursWorked: 0 },
        hoursByTechnician: hoursByTechnician.map((r) => ({
          ...r,
          totalHours: parseFloat(String(r.totalHours)) || 0,
          avgShiftHours: parseFloat(String(r.avgShiftHours)) || 0,
          shiftsCount: Number(r.shiftsCount),
        })),
        hoursByJob: hoursByJob.map((r) => ({
          ...r,
          totalHours: parseFloat(String(r.totalHours)) || 0,
          avgHoursPerShift: parseFloat(String(r.avgHoursPerShift)) || 0,
          clockIns: Number(r.clockIns),
          jobValue: parseFloat(String(r.jobValue)) || 0,
        })),
      };
    }

    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
