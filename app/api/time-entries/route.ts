import { NextResponse, type NextRequest } from "next/server";
import { getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response || !user) {
      return response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    let userId = searchParams.get("userId");

    if (!hasPermission(user, 'time_entries:read:all')) {
      userId = user.id;
    }

    const sql = getDbSql();

    // Build filter conditions
    const conditions = [];
    if (startDate) {
      conditions.push(sql`te.created_at >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`te.created_at <= ${endDate} 23:59:59`);
    }
    if (userId) {
      conditions.push(sql`te.user_id = ${userId}`);
    }

    let whereClause = sql``;
    if (conditions.length > 0) {
      whereClause = sql`WHERE ${conditions.reduce((prev, curr, i) => i === 0 ? curr : sql`${prev} AND ${curr}`)}`;
    }

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
      ${whereClause}
      ORDER BY te.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Count query with same filters
    const countResult = await sql`SELECT COUNT(*) FROM time_entries te ${whereClause}`;
    const count = countResult[0].count;

    console.log("Time entries count:", count); // Debug log

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
