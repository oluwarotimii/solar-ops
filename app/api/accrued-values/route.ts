import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { authenticateApiRequest } from '@/lib/api-auth';
import { hasPermission } from '@/lib/auth';
import { calculateEarnedAmount } from '@/lib/earnings';

const createAccruedValueSchema = z.object({
  userId: z.string().min(1),
  jobId: z.string().min(1),
  jobType: z.enum(["job", "maintenance"]),
  rating: z.number().optional(),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
})

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'accrued_values:read')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    let userId = searchParams.get('userId');
    const mode = searchParams.get('mode');

    if (!hasPermission(user, 'accrued_values:read:all')) {
      userId = user.id;
    }

    const where: Prisma.AccruedValueWhereInput = {};

    if (month && month !== 'all') {
      where.month = parseInt(month, 10);
    }
    if (year && year !== 'all') {
      where.year = parseInt(year, 10);
    }
    if (userId) {
      where.userId = userId;
    }

    let accruedValues;
    if (mode === 'detailed') {
      const records = await prisma.accruedValue.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          job: { select: { id: true, title: true, jobType: { select: { name: true } } } },
          maintenanceOccurrence: {
            include: { template: { select: { title: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      accruedValues = records.map((r) => ({
        id: r.id,
        user: {
          id: r.user.id,
          name: `${r.user.firstName} ${r.user.lastName}`,
          email: r.user.email,
        },
        job: {
          id: r.jobId || r.maintenanceOccurrenceId || '',
          title: r.job?.title || r.maintenanceOccurrence?.template?.title || 'Maintenance',
          type: r.job?.jobType?.name || 'Maintenance',
        },
        earnedAmount: Number(r.earnedAmount),
        rating: r.rating ? Number(r.rating) : undefined,
        month: r.month,
        year: r.year,
        createdAt: r.createdAt.toISOString(),
      }));
    } else {
      const grouped = await prisma.accruedValue.groupBy({
        by: ['userId'],
        where,
        _sum: { earnedAmount: true },
        orderBy: { _sum: { earnedAmount: 'desc' } },
      });

      const userIds = grouped.map((g) => g.userId);
      const users = userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true, email: true },
          })
        : [];
      const userMap = new Map(users.map((u) => [u.id, u]));

      accruedValues = grouped.map((g) => {
        const u = userMap.get(g.userId);
        return {
          user: {
            id: g.userId,
            name: u ? `${u.firstName} ${u.lastName}` : 'Unknown',
            email: u?.email ?? '',
          },
          totalEarnedAmount: Number(g._sum.earnedAmount) || 0,
        };
      });
    }

    const yearRange = await prisma.accruedValue.aggregate({
      _min: { year: true },
      _max: { year: true },
    });
    const minYear = yearRange._min.year ?? new Date().getFullYear();
    const maxYear = yearRange._max.year ?? new Date().getFullYear();

    return NextResponse.json({ accruedValues, minYear, maxYear });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(req);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'accrued_values:create')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createAccruedValueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }
    const { userId, jobId, jobType, rating, month, year } = parsed.data;

    if (!hasPermission(user, 'accrued_values:create:all') && userId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You can only create accrued values for yourself." }, { status: 403 });
    }

    let jobValue: number;
    let earnedAmount = 0;
    let result;

    if (jobType === 'job') {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { jobValue: true },
      });

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      jobValue = Number(job.jobValue);

      const technicianCount = await prisma.jobTechnician.count({
        where: { jobId },
      });

      earnedAmount = await calculateEarnedAmount(jobValue, technicianCount);

      result = await prisma.accruedValue.create({
        data: {
          userId,
          jobId,
          jobValue,
          earnedAmount,
          rating: rating || null,
          month,
          year,
        },
      });
    } else if (jobType === 'maintenance') {
      const occurrence = await prisma.maintenanceOccurrence.findUnique({
        where: { id: jobId },
        select: { templateId: true },
      });

      if (!occurrence) {
        return NextResponse.json({ error: "Maintenance occurrence not found" }, { status: 404 });
      }

      const template = await prisma.maintenanceTemplate.findUnique({
        where: { id: occurrence.templateId },
        select: { jobValue: true, recurrenceType: true },
      });

      if (!template) {
        return NextResponse.json({ error: "Maintenance template not found" }, { status: 404 });
      }

      jobValue = Number(template.jobValue);
      earnedAmount = jobValue;

      result = await prisma.accruedValue.create({
        data: {
          userId,
          maintenanceOccurrenceId: jobId,
          jobValue,
          earnedAmount,
          rating: rating || null,
          month,
          year,
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid job type" }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}