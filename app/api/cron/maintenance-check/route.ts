import { NextResponse } from "next/server"
import { getDbSql } from "@/lib/db"

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

    // Update status of overdue maintenance occurrences
    const result = await getDbSql()`UPDATE maintenance_occurrences
      SET status = 'missed'
      WHERE status = 'scheduled'
      AND scheduled_date < ${today.toISOString().split("T")[0]}
      RETURNING id, template_id, assigned_to`

    // Send notifications for missed occurrences
    for (const occurrence of result) {
      if (occurrence.assigned_to) {
        // Get template title for the notification
        const [template] = await getDbSql()`SELECT title FROM maintenance_templates WHERE id = ${occurrence.template_id}`
        
        await getDbSql()`
          INSERT INTO notifications (recipient_id, title, message, type)
          VALUES (
            ${occurrence.assigned_to},
            'Maintenance Occurrence Missed',
            ${`Maintenance task "${template?.title || 'Untitled'}" was missed as it was scheduled for ${today.toISOString().split("T")[0]}.`},
            'maintenance_reminder'
          )
        `
      }
    }

    return NextResponse.json({
      message: "Maintenance check completed",
      missedOccurrencesUpdated: result.length,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
