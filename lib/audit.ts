import { getDbSql } from "@/lib/db";
import { NextRequest } from "next/server";

// In-memory cache to prevent duplicate logs within a short time period
const logCache: Map<string, number> = new Map();
const CACHE_DURATION = 5000; // 5 seconds

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
    // Create a cache key to identify duplicate events
    const cacheKey = `${userId || 'system'}-${action}-${targetType || 'none'}-${targetId || 'none'}-${JSON.stringify(details || {})}`;
    const now = Date.now();
    
    // Check if we've logged this exact event recently
    const lastLogged = logCache.get(cacheKey);
    if (lastLogged && now - lastLogged < CACHE_DURATION) {
      // Skip logging this duplicate event
      return;
    }
    
    // Update the cache
    logCache.set(cacheKey, now);
    
    // Clean up old cache entries periodically
    if (logCache.size > 100) {
      for (const [key, timestamp] of logCache.entries()) {
        if (now - timestamp > CACHE_DURATION) {
          logCache.delete(key);
        }
      }
    }

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
