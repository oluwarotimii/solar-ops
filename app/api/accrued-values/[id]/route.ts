import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDbSql, toCamelCase } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

const updateAccruedValueSchema = z.object({
  rating: z.number().optional(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response;
    }

    if (!user || !hasPermission(user, 'accrued_values:read')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const sql = getDbSql();

    const result = await sql`
      SELECT
        av.*,
        u.first_name as technician_first_name,
        u.last_name as technician_last_name,
        u.email as technician_email,
        j.title as job_title,
        jt.name as job_type_name
      FROM accrued_values av
      JOIN users u ON av.user_id = u.id
      JOIN jobs j ON av.job_id = j.id
      JOIN job_types jt ON j.job_type_id = jt.id
      WHERE av.id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Accrued value not found" }, { status: 404 });
    }

    const value = toCamelCase(result[0]);
    const accruedValue = {
      id: value.id,
      user: {
        id: value.userId,
        name: `${value.technicianFirstName} ${value.technicianLastName}`,
        email: value.technicianEmail,
      },
      job: {
        id: value.jobId,
        title: value.jobTitle,
        type: value.jobTypeName,
      },
      
      
      rating: value.rating,
      month: value.month,
      year: value.year,
      createdAt: value.createdAt,
    };

    return NextResponse.json(accruedValue);
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

    if (!user || !hasPermission(user, 'accrued_values:update')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const parsed = updateAccruedValueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }
    const { rating } = parsed.data;
    const sql = getDbSql();

    const result = await sql`
      UPDATE accrued_values
      SET rating = ${rating}
      WHERE id = ${id}
      RETURNING *;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Accrued value not found or no changes made" }, { status: 404 });
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

    if (!user || !hasPermission(user, 'accrued_values:delete')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const sql = getDbSql();

    const result = await sql`
      DELETE FROM accrued_values
      WHERE id = ${id}
      RETURNING id;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Accrued value not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Accrued value deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

