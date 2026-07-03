import { type NextRequest, NextResponse } from "next/server";
import { getDbSql, toCamelCase } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";
import { z } from "zod";

const updateJobTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional().nullable(),
  color: z.string().min(1, "Color is required").max(7),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'job_types:read')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const sql = getDbSql();

    const result = await sql`SELECT * FROM job_types WHERE id = ${id}`;

    if (result.length === 0) {
      return NextResponse.json({ error: "Job type not found" }, { status: 404 });
    }

    return NextResponse.json(toCamelCase(result[0]));
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'job_types:update')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const validation = updateJobTypeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { name, description, color } = validation.data;
    const sql = getDbSql();

    const result = await sql`
      UPDATE job_types
      SET name = ${name}, description = ${description || null}, color = ${color}
      WHERE id = ${id}
      RETURNING *;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Job type not found or no changes made" }, { status: 404 });
    }

    return NextResponse.json(toCamelCase(result[0]));
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'job_types:delete')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const sql = getDbSql();

    const associatedJobs = await sql`SELECT COUNT(*) FROM jobs WHERE job_type_id = ${id}`;
    if (parseInt(associatedJobs[0].count, 10) > 0) {
      return NextResponse.json({ error: "Cannot delete job type with associated jobs" }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM job_types
      WHERE id = ${id}
      RETURNING id;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Job type not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Job type deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
