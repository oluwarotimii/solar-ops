import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response || !user) {
      return response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    let userId = searchParams.get("userId");

    if (!hasPermission(user, 'time_entries:read:all')) {
      userId = user.id;
    }

    const where: Prisma.TimeEntryWhereInput = {};

    if (startDate) {
      where.createdAt = { ...(where.createdAt as Prisma.DateTimeFilter || {}), gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...(where.createdAt as Prisma.DateTimeFilter || {}), lte: end };
    }
    if (userId) {
      where.userId = userId;
    }

    const [timeEntries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          job: { select: { title: true, jobType: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.timeEntry.count({ where }),
    ]);

    const mapped = timeEntries.map((te) => ({
      id: te.id,
      userId: te.userId,
      jobId: te.jobId,
      clockIn: te.clockIn,
      clockOut: te.clockOut,
      latitude: te.latitude ? Number(te.latitude) : null,
      longitude: te.longitude ? Number(te.longitude) : null,
      notes: te.notes,
      createdAt: te.createdAt,
      firstName: te.user?.firstName ?? null,
      lastName: te.user?.lastName ?? null,
      email: te.user?.email ?? null,
      jobTitle: te.job?.title ?? null,
      jobTypeName: te.job?.jobType?.name ?? null,
    }));

    return NextResponse.json({
      timeEntries: mapped,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
