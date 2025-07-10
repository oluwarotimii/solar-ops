import { type NextRequest, NextResponse } from "next/server"
import { getDbSql } from "@/lib/db"
import { verifyToken, getUserById } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const sql = getDbSql();
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = await getUserById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get total jobs
    const totalJobsResult = await sql`SELECT COUNT(*) as count FROM jobs`
    const totalJobs = Number(totalJobsResult[0].count)

    // Get active jobs
    const activeJobsResult = await sql`
      SELECT COUNT(*) as count FROM jobs 
      WHERE status IN ('assigned', 'in_progress')
    `
    const activeJobs = Number(activeJobsResult[0].count)

    // Get completed jobs
    const completedJobsResult = await sql`
      SELECT COUNT(*) as count FROM jobs WHERE status = 'completed'
    `
    const completedJobs = Number(completedJobsResult[0].count)

    // Get active technicians (users with technician role who have active jobs)
    const activeTechniciansResult = await sql`
      SELECT COUNT(DISTINCT jt.technician_id) as count
      FROM job_technicians jt
      JOIN jobs j ON jt.job_id = j.id
      JOIN users u ON jt.technician_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE j.status IN ('assigned', 'in_progress')
      AND r.name = 'Technician'
    `
    const activeTechnicians = Number(activeTechniciansResult[0].count)

    // Get pending maintenance tasks
    const pendingMaintenanceResult = await sql`
      SELECT COUNT(*) as count FROM maintenance_tasks 
      WHERE status IN ('scheduled', 'overdue')
    `
    const pendingMaintenance = Number(pendingMaintenanceResult[0].count)

    // Get total revenue for current month
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    const revenueResult = await sql`
      SELECT COALESCE(SUM(job_value), 0) as total
      FROM jobs 
      WHERE status = 'completed'
      AND EXTRACT(MONTH FROM completed_at) = ${currentMonth}
      AND EXTRACT(YEAR FROM completed_at) = ${currentYear}
    `
    const totalRevenue = Number(revenueResult[0].total)

    return NextResponse.json({
      totalJobs,
      activeJobs,
      completedJobs,
      activeTechnicians,
      pendingMaintenance,
      totalRevenue,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
