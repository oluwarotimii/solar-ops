import { NextResponse } from "next/server";
import { getDbSql } from "@/lib/db";

// This endpoint should be called by a cron job daily
export async function GET(request: Request) {
  try {
    // Verify that this is called by an authorized source
    const authHeader = request.headers.get("authorization");
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDbSql();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateString = tomorrow.toISOString().split("T")[0];

    // Find jobs scheduled for tomorrow that are not completed, cancelled, or archived
    const upcomingJobs = await sql`
      SELECT id, title
      FROM jobs
      WHERE scheduled_date = ${tomorrowDateString}
      AND status NOT IN ('completed', 'cancelled', 'archived')
    `;

    let notificationsSent = 0;
    for (const job of upcomingJobs) {
      // Find assigned technicians for the job
      const technicians = await sql`
        SELECT technician_id
        FROM job_technicians
        WHERE job_id = ${job.id}
      `;

      // Send a notification to each assigned technician
      for (const tech of technicians) {
        await sql`
          INSERT INTO notifications (recipient_id, title, message, type, related_job_id)
          VALUES (
            ${tech.technician_id},
            'Upcoming Job Reminder',
            ${`Job "${job.title}" is scheduled for tomorrow.`},
            'job_reminder',
            ${job.id}
          )
        `;
        notificationsSent++;
      }
    }

    return NextResponse.json({
      message: "Upcoming job check completed",
      jobsFound: upcomingJobs.length,
      notificationsSent,
    });
  } catch (error) {
    console.error("Upcoming job check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
