import { sql, toCamelCase } from "./db"

export async function checkForOverdueTasks() {
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

  return result.length
}

export async function createRecurringTask(taskId: string) {
  // Get the task details
  const taskResult = await sql`
    SELECT * FROM maintenance_tasks WHERE id = ${taskId}
  `

  if (taskResult.length === 0) {
    throw new Error("Task not found")
  }

  const task = taskResult[0]

  if (!task.recurrence_type) {
    return null // Not a recurring task
  }

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
  const result = await sql`
    INSERT INTO maintenance_tasks (
      title, description, site_location, assigned_to, created_by,
      status, priority, scheduled_date, recurrence_type, recurrence_interval
    ) VALUES (
      ${task.title},
      ${task.description},
      ${task.site_location},
      ${task.assigned_to},
      ${task.created_by},
      'scheduled',
      ${task.priority},
      ${nextDate.toISOString().split("T")[0]},
      ${task.recurrence_type},
      ${task.recurrence_interval}
    )
    RETURNING id
  `

  return toCamelCase(result[0])
}
