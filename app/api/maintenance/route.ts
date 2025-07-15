import { type NextRequest, NextResponse } from "next/server"
import { toCamelCase, getDbSql } from "@/lib/db"
import { authenticateApiRequest } from "@/lib/api-auth"
import { hasPermission } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request)
  if (response) {
    return response
  }

  if (!user || !hasPermission(user, 'maintenance:read')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const sql = getDbSql();

    const result = await sql`
      SELECT 
        mt.*,
        au.first_name as assigned_first_name, au.last_name as assigned_last_name,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM maintenance_tasks mt
      LEFT JOIN users au ON mt.assigned_to = au.id
      LEFT JOIN users cu ON mt.created_by = cu.id
      ORDER BY 
        CASE 
          WHEN mt.status = 'overdue' THEN 1
          WHEN mt.status = 'scheduled' THEN 2
          WHEN mt.status = 'in_progress' THEN 3
          ELSE 4
        END,
        mt.scheduled_date ASC
    `

    const tasks = result.map((row: any) => {
      const task = toCamelCase(row)

      // Build nested objects
      if (task.assignedFirstName) {
        task.assignedUser = {
          id: task.assignedTo,
          firstName: task.assignedFirstName,
          lastName: task.assignedLastName,
        }
      }

      if (task.createdFirstName) {
        task.createdUser = {
          id: task.createdBy,
          firstName: task.createdFirstName,
          lastName: task.createdLastName,
        }
      }

      // Clean up the flat fields
      delete task.assignedFirstName
      delete task.assignedLastName
      delete task.createdFirstName
      delete task.createdLastName

      return task
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Maintenance tasks fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await authenticateApiRequest(request)
  if (response) {
    return response
  }

  if (!user || !hasPermission(user, 'maintenance:create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const sql = getDbSql();

    const taskData = await request.json()

    if (!taskData.title || !taskData.siteLocation || !taskData.scheduledDate) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    // Check if the scheduled date is in the past
    const scheduledDate = new Date(taskData.scheduledDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const status = scheduledDate < today ? "overdue" : "scheduled"

    const result = await sql`
      INSERT INTO maintenance_tasks (
        title, description, site_location, assigned_to, created_by,
        status, priority, scheduled_date, recurrence_type, recurrence_interval
      ) VALUES (
        ${taskData.title},
        ${taskData.description || null},
        ${taskData.siteLocation},
        ${taskData.assignedTo || null},
        ${user.id},
        ${status},
        ${taskData.priority || "medium"},
        ${taskData.scheduledDate},
        ${taskData.recurrenceType || null},
        ${taskData.recurrenceInterval || null}
      ) RETURNING id
    `

    // Send notification to assigned technician if one is assigned
    if (taskData.assignedTo) {
      await sql`
        INSERT INTO notifications (recipient_id, sender_id, title, message, type)
        VALUES (
          ${taskData.assignedTo},
          ${user.id},
          'New Maintenance Task',
          ${`You have been assigned a new maintenance task: ${taskData.title}`},
          'maintenance_reminder'
        )
      `
    }

    return NextResponse.json({
      id: result[0].id,
      message: "Maintenance task created successfully",
    })
  } catch (error) {
    console.error("Maintenance task creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
