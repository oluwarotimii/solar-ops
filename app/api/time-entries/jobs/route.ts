import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request);
  if (response) {
    return response;
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobs = await prisma.job.findMany({
      where: {
        jobTechnicians: {
          some: { technicianId: user.id },
        },
        isArchived: false,
        status: { in: ["assigned", "in_progress"] },
      },
      include: {
        jobType: { select: { name: true, color: true } },
      },
      orderBy: [
        { status: "asc" },
        { scheduledDate: { sort: "asc", nulls: "last" } },
        { scheduledTime: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take: 10,
    });

    const mapped = jobs.map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      priority: j.priority,
      locationAddress: j.locationAddress,
      scheduledDate: j.scheduledDate?.toISOString().split("T")[0] ?? null,
      scheduledTime: j.scheduledTime?.toISOString().slice(11, 16) ?? null,
      jobValue: Number(j.jobValue),
      jobTypeName: j.jobType?.name ?? null,
      jobTypeColor: j.jobType?.color ?? null,
    }));

    return NextResponse.json({ jobs: mapped });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
