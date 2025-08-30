import { getDbSql } from "@/lib/db";
import { NextRequest } from "next/server";

interface AuditLogParams {
  userId: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, any>;
  request?: NextRequest;
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  const {
    userId,
    action,
    targetType,
    targetId,
    details,
    request,
  } = params;

  try {
    const sql = getDbSql();
    
    let ipAddress = null;
    let userAgent = null;

    if (request) {
      ipAddress = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
      userAgent = request.headers.get('user-agent');
    }

    await sql`
      INSERT INTO audit_logs (user_id, action, target_type, target_id, details, ip_address, user_agent)
      VALUES (
        ${userId},
        ${action},
        ${targetType || null},
        ${targetId || null},
        ${details ? JSON.stringify(details) : null},
        ${ipAddress},
        ${userAgent}
      );
    `;
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // We don't want to throw an error here and interrupt the user's action,
    // so we just log it to the console.
  }
}
