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
      technician: {
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
    console.error("Accrued value GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


