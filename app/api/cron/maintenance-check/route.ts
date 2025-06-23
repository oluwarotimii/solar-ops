import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

// This endpoint should be called by a cron job daily
export async function GET(request: Request) {
  try {
    // Verify that this is called by an authorized source
    const authHeader = request.headers.get("authorization")
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Update status of overdue tasks
    const result = await sql`
      UPDATE maintenance_tasks
      SET status = 'overdue'
      WHERE status = 'scheduled'
      AND scheduled_date < ${today.toISOString().split("T")[0]}
      RETURNING id, title, assigned_to
    `

    // Send notifications for overdue tasks
    for (const task of result) {
      if (task.assigned_to) {
        await sql`
          INSERT INTO notifications (recipient_id, title, message, type)
          VALUES (
            ${task.assigned_to},
            'Maintenance Task Overdue',
            ${`Task "${task.title}" is now overdue and requires attention.`},
            'maintenance_reminder'
          )
        `
      }
    }

    return NextResponse.json({
      message: "Maintenance check completed",
      overdueTasksUpdated: result.length,
    })
  } catch (error) {
    console.error("Maintenance check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
