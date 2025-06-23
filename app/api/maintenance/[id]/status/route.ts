import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken, getUserById } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = await getUserById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { status } = await request.json()
    if (!status || !["scheduled", "in_progress", "completed", "overdue"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Get the task to check if it's recurring
    const taskResult = await sql`
      SELECT * FROM maintenance_tasks WHERE id = ${params.id}
    `

    if (taskResult.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const task = taskResult[0]

    // Update the task status
    await sql`
      UPDATE maintenance_tasks 
      SET status = ${status}, 
          last_completed = ${status === "completed" ? new Date() : null}
      WHERE id = ${params.id}
    `

    // If the task is completed and recurring, create the next occurrence
    if (status === "completed" && task.recurrence_type) {
      const scheduledDate = new Date(task.scheduled_date)
      const nextDate = new Date(scheduledDate)

      switch (task.recurrence_type) {
        case "daily":
          nextDate.setDate(scheduledDate.getDate() + task.recurrence_interval)
          break
        case "weekly":
          nextDate.setDate(scheduledDate.getDate() + task.recurrence_interval * 7)
          break
        case "monthly":
          nextDate.setMonth(scheduledDate.getMonth() + task.recurrence_interval)
          break
        case "yearly":
          nextDate.setFullYear(scheduledDate.getFullYear() + task.recurrence_interval)
          break
      }

      // Create the next occurrence
      await sql`
        INSERT INTO maintenance_tasks (
          title, description, site_location, assigned_to, created_by,
          status, priority, scheduled_date, recurrence_type, recurrence_interval
        ) VALUES (
          ${task.title},
          ${task.description},
          ${task.site_location},
          ${task.assigned_to},
          ${user.id},
          'scheduled',
          ${task.priority},
          ${nextDate.toISOString().split("T")[0]},
          ${task.recurrence_type},
          ${task.recurrence_interval}
        )
      `
    }

    return NextResponse.json({
      message: "Task status updated successfully",
    })
  } catch (error) {
    console.error("Maintenance task status update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
