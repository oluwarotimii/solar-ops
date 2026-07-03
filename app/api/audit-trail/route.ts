import { NextResponse, type NextRequest } from "next/server";
import { getDbSql } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/api-auth";
import { hasPermission } from "@/lib/auth";

export const dynamic = 'force-dynamic';

interface AuditLogRow {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response || !user) {
      return response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(user, 'audit_trail:read')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const sql = getDbSql();

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

    let countQuery = sql`SELECT COUNT(*) as count FROM audit_logs al WHERE 1=1`;
    if (startDate) {
      countQuery = sql`${countQuery} AND al.created_at >= ${startDate}`;
    }
    if (endDate) {
      countQuery = sql`${countQuery} AND al.created_at <= ${endDate + ' 23:59:59'}`;
    }
    
    const [{ count }] = await sql`${countQuery}`;

    return NextResponse.json({
      logs: logs.map((log: AuditLogRow) => ({
        ...log,
        userName: log.firstName && log.lastName ? `${log.firstName} ${log.lastName}` : log.email || 'Unknown User'
      })),
      totalCount: parseInt(count, 10),
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}