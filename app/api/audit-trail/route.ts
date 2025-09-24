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

    // This is a critical security check. Only users with the correct permission can view the audit trail.
    if (!hasPermission(user, 'audit_trail:read')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    console.log('Audit trail request params:', { page, limit, offset, startDate, endDate });

    const sql = getDbSql();

    // Build date filter conditions
    let dateConditions = sql``;
    if (startDate || endDate) {
      const conditions = [];
      if (startDate) {
        conditions.push(sql`al.created_at >= ${startDate}`);
      }
      if (endDate) {
        conditions.push(sql`al.created_at <= ${endDate + ' 23:59:59'}`);
      }
      if (conditions.length > 0) {
        dateConditions = sql`AND ${conditions.reduce((prev, curr, i) => i === 0 ? curr : sql`${prev} AND ${curr}`)}`;
      }
    }

    console.log('Date conditions:', dateConditions);

    const logs = await sql`
      SELECT
        al.id,
        al.action,
        al.target_type,
        al.target_id,
        al.details,
        al.ip_address,
        al.user_agent,
        al.created_at,
        u.first_name,
        u.last_name,
        u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1 ${dateConditions}
      ORDER BY al.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    console.log('Audit logs query result count:', logs.length);
    console.log('First log created_at:', logs[0]?.created_at);

    // Count query with same filters
    let countQuery = sql`SELECT COUNT(*) as count FROM audit_logs al WHERE 1=1`;
    if (startDate) {
      countQuery = sql`${countQuery} AND al.created_at >= ${startDate}`;
    }
    if (endDate) {
      countQuery = sql`${countQuery} AND al.created_at <= ${endDate + ' 23:59:59'}`;
    }
    
    const [{ count }] = await sql`${countQuery}`;

    console.log("Audit logs count:", count); // Debug log

    return NextResponse.json({
      logs: logs.map((log: any) => ({
        ...log,
        userName: log.firstName && log.lastName ? `${log.firstName} ${log.lastName}` : log.email || 'Unknown User'
      })),
      totalCount: parseInt(count, 10),
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error("Audit Trail GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}