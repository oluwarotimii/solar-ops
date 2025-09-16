import { NextResponse, type NextRequest } from "next/server";
import { getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response || !user) {
      return response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can view all time entries
    if (!user.role?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const sql = getDbSql();

    const timeEntries = await sql`
      SELECT
        te.id,
        te.user_id,
        te.clock_in,
        te.clock_out,
        te.notes,
        te.created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM time_entries te
      LEFT JOIN users u ON te.user_id = u.id
      ORDER BY te.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const [{ count }] = await sql`SELECT COUNT(*) FROM time_entries`;

    return NextResponse.json({
      timeEntries,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error("Time Entries GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
