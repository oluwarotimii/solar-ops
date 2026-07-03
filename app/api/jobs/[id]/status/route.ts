import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { logAuditEvent } from "@/lib/audit";

const updateStatusSchema = z.object({
  status: z.string().optional(),
});

const validStatuses = ["assigned", "in_progress", "completed", "on_hold", "cancelled"] as const;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = params;
    if (user.role?.isAdmin) {
      const body = await request.json();
      const parsed = updateStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
      }
      const { status } = parsed.data;
      if (!status) {
        return NextResponse.json({ error: "Status is required for admin action" }, { status: 400 });
      }
      if (!validStatuses.includes(status as typeof validStatuses[number])) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }

      const currentJob = await prisma.job.findUnique({
        where: { id: jobId },
        select: { status: true },
      });
      const currentStatus = currentJob?.status;

      if (status === 'completed') {
        const job = await prisma.job.update({
          where: { id: jobId },
          data: { status: 'completed', completedAt: new Date() },
          select: { id: true, jobValue: true },
        });

        const technicians = await prisma.jobTechnician.findMany({
          where: { jobId },
          select: { technicianId: true },
        });
        const technicianIds = technicians.map((t) => t.technicianId);
        const numberOfTechnicians = technicianIds.length;

        if (numberOfTechnicians > 0) {
          const earnedAmount = Number(job.jobValue);
          const now = new Date();
          const month = now.getMonth() + 1;
          const year = now.getFullYear();

          await prisma.accruedValue.createMany({
            data: technicianIds.map((techId) => ({
              userId: techId,
              jobId,
              jobValue: job.jobValue,
              earnedAmount,
              month,
              year,
            })),
          });
        }
      } else {
        await prisma.accruedValue.deleteMany({ where: { jobId } });

        if (status === 'assigned') {
          await prisma.job.update({
            where: { id: jobId },
            data: { status, completedAt: null, isArchived: false, archivedAt: null },
          });
          await prisma.jobTechnician.updateMany({
            where: { jobId },
            data: { completedAt: null },
          });
        } else {
          await prisma.job.update({
            where: { id: jobId },
            data: { status, completedAt: null, isArchived: false, archivedAt: null },
          });
        }
      }

      if (currentStatus !== status) {
        await logAuditEvent({
          userId: user.id,
          action: "job_status_update_admin",
          targetType: "job",
          targetId: jobId,
          details: { status },
          request,
        });
      }

      return NextResponse.json({ message: "Job status updated successfully by admin" });
    }

    const assignedTechnician = await prisma.jobTechnician.findFirst({
      where: { jobId, technicianId: user.id },
      select: { id: true },
    });

    if (!assignedTechnician) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this job" }, { status: 403 });
    }

    await prisma.jobTechnician.updateMany({
      where: { jobId, technicianId: user.id },
      data: { completedAt: new Date() },
    });

    await logAuditEvent({
      userId: user.id,
      action: "job_technician_complete",
      targetType: "job",
      targetId: jobId,
      request,
    });

    const totalTechnicians = await prisma.jobTechnician.count({ where: { jobId } });
    const completedTechnicians = await prisma.jobTechnician.count({
      where: { jobId, completedAt: { not: null } },
    });

    if (totalTechnicians > 0 && totalTechnicians === completedTechnicians) {
      const currentJob = await prisma.job.findUnique({
        where: { id: jobId },
        select: { status: true },
      });
      const currentStatus = currentJob?.status;

      const job = await prisma.job.update({
        where: { id: jobId },
        data: { status: 'completed', completedAt: new Date() },
        select: { id: true, jobValue: true },
      });

      const technicians = await prisma.jobTechnician.findMany({
        where: { jobId },
        select: { technicianId: true },
      });
      const technicianIds = technicians.map((t) => t.technicianId);
      const numberOfTechnicians = technicianIds.length;

      if (numberOfTechnicians > 0) {
        const earnedAmount = Number(job.jobValue);
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        await prisma.accruedValue.createMany({
          data: technicianIds.map((techId) => ({
            userId: techId,
            jobId,
            jobValue: job.jobValue,
            earnedAmount,
            month,
            year,
          })),
        });
      }

      if (currentStatus !== 'completed') {
        await logAuditEvent({
          userId: null,
          action: "job_status_update_system",
          targetType: "job",
          targetId: jobId,
          details: { status: "completed", reason: "All technicians marked as complete" },
        });
      }
    }

    return NextResponse.json({ message: "Your status has been marked as complete." });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    if (errorMessage.includes("Unexpected end of JSON input")) {
        return NextResponse.json({ error: "Invalid request body. Please provide a valid JSON." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update job status" }, { status: 500 });
  }
}
