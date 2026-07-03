import { NextResponse } from "next/server";
import { getDbSql } from "@/lib/db";

export const dynamic = 'force-dynamic';

// This endpoint should be called by a cron job (e.g., every hour)
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = getDbSql();
    const now = new Date();
    let notificationsSent = 0;

    // --- 1. Handle Overdue Jobs ---
    const overdueJobs = await sql`
      SELECT id, title, scheduled_date FROM jobs
      WHERE scheduled_date < ${now.toISOString().split('T')[0]}
      AND status NOT IN ('completed', 'cancelled')
    `;

    if (overdueJobs.length > 0) {
      const admins = await sql`
        SELECT u.id FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.is_admin = TRUE
      `;
      for (const job of overdueJobs) {
        for (const admin of admins) {
          await sql`
            INSERT INTO notifications (recipient_id, title, message, type, related_job_id)
            VALUES (${admin.id}, 'Overdue Job Alert', ${`Job "${job.title}" was scheduled for ${new Date(job.scheduled_date).toLocaleDateString('en-NG')} and is not completed.`}, 'overdue_job_alert', ${job.id})
          `;
          notificationsSent++;
        }
      }
    }

    // --- 2. Handle Job Reminders (Today & Hourly) ---
    const today = now.toISOString().split('T')[0];
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingJobs = await sql`
      SELECT id, title, scheduled_date, scheduled_time FROM jobs
      WHERE scheduled_date = ${today}
      AND status NOT IN ('completed', 'cancelled')
    `;

    for (const job of upcomingJobs) {
      const technicians = await sql`
        SELECT technician_id FROM job_technicians WHERE job_id = ${job.id}
      `;

      // Send "Today" reminder (if not already sent)
      // Note: A more robust solution would track sent reminders to avoid duplicates.
      for (const tech of technicians) {
        await sql`
          INSERT INTO notifications (recipient_id, title, message, type, related_job_id)
          VALUES (${tech.technician_id}, 'Job Reminder', ${`Job "${job.title}" is scheduled for today.`}, 'job_reminder', ${job.id})
          ON CONFLICT (recipient_id, related_job_id, type) DO NOTHING;
        `;
        notificationsSent++;
      }

      // Send "1-Hour" reminder
      if (job.scheduled_time) {
        const scheduledTime = new Date(`${job.scheduled_date}T${job.scheduled_time}`);
        if (scheduledTime > now && scheduledTime <= oneHourFromNow) {
          for (const tech of technicians) {
            await sql`
              INSERT INTO notifications (recipient_id, title, message, type, related_job_id)
              VALUES (${tech.technician_id}, 'Job Starting Soon', ${`Job "${job.title}" is scheduled to start in about an hour.`}, 'job_reminder_hourly', ${job.id})
              ON CONFLICT (recipient_id, related_job_id, type) DO NOTHING;
            `;
            notificationsSent++;
          }
        }
      }
    }

    return NextResponse.json({
      message: "Cron job for reminders and overdue checks completed successfully.",
      overdueJobsChecked: overdueJobs.length,
      upcomingJobsChecked: upcomingJobs.length,
      notificationsSent,
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
