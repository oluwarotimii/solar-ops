import { type NextRequest, NextResponse } from "next/server";
import { getDbSql, toCamelCase } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'maintenance:read')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const sql = getDbSql();

    const result = await sql`
      SELECT 
        mt.*,
        au.first_name as assigned_first_name, au.last_name as assigned_last_name,
        cu.first_name as created_first_name, cu.last_name as created_last_name
      FROM maintenance_tasks mt
      LEFT JOIN users au ON mt.assigned_to = au.id
      LEFT JOIN users cu ON mt.created_by = cu.id
      WHERE mt.id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Maintenance task not found" }, { status: 404 });
    }

    const task = toCamelCase(result[0]);

    if (task.assignedFirstName) {
      task.assignedUser = {
        id: task.assignedTo,
        firstName: task.assignedFirstName,
        lastName: task.assignedLastName,
      };
    }

    if (task.createdFirstName) {
      task.createdUser = {
        id: task.createdBy,
        firstName: task.createdFirstName,
        lastName: task.createdLastName,
      };
    }

    delete task.assignedFirstName;
    delete task.assignedLastName;
    delete task.createdFirstName;
    delete task.createdLastName;

    return NextResponse.json(task);
  } catch (error) {
    console.error("Maintenance task GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'maintenance:update')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const taskData = await request.json();
    const sql = getDbSql();

    const {
      title, description, siteLocation, assignedTo, status,
      priority, scheduledDate, recurrenceType, recurrenceInterval
    } = taskData;

    const result = await sql`
      UPDATE maintenance_tasks
      SET
        title = ${title},
        description = ${description || null},
        site_location = ${siteLocation},
        assigned_to = ${assignedTo || null},
        status = ${status || "scheduled"},
        priority = ${priority || "medium"},
        scheduled_date = ${scheduledDate},
        recurrence_type = ${recurrenceType || null},
        recurrence_interval = ${recurrenceInterval || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Maintenance task not found or no changes made" }, { status: 404 });
    }

    return NextResponse.json({ message: "Maintenance task updated successfully" });
  } catch (error) {
    console.error("Maintenance task PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'maintenance:delete')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const sql = getDbSql();

    const result = await sql`
      DELETE FROM maintenance_tasks
      WHERE id = ${id}
      RETURNING id;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Maintenance task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Maintenance task deleted successfully" });
  } catch (error) {
    console.error("Maintenance task DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
