"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, FileText, CheckCircle, Clock, MapPin, DollarSign, TrendingUp, AlertTriangle, Loader2 } from "lucide-react"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch actual user from localStorage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    // Fetch dashboard stats
    const fetchStats = async () => {
      setLoadingStats(true)
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("Authentication token not found.")
          setLoadingStats(false)
          return
        }

        const response = await fetch("/api/dashboard/reports", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch dashboard stats.")
        }

        const data = await response.json()
        setStats(data)
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while fetching stats.")
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [])

  if (loadingStats) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2 text-lg">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-600">
        <AlertTriangle className="h-8 w-8 mr-2" />
        <p className="text-lg">Error: {error}</p>
      </div>
    )
  }

  // Render null or a message if stats are not available after loading
  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-muted-foreground">No dashboard data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Solar Field Operations{user ? `, ${user.firstName}` : ""}</p>
        {user && user.role && (
          <Badge variant="outline" className="mt-2">
            {user.role.name}
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeJobs} active, {stats.completedJobs} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Technicians</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTechnicians}</div>
            <p className="text-xs text-muted-foreground">Currently in field</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Maintenance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingMaintenance}</div>
            <p className="text-xs text-muted-foreground">Tasks scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest job updates and technician check-ins</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Placeholder for Recent Activity - Data will be fetched from API */}
            <div className="text-center text-muted-foreground py-8">
              <p>No recent activity to display.</p>
              <p className="text-sm">Data will load here from API.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Completion Rate</CardTitle>
            <CardDescription>This month's performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Placeholder for Job Completion Rate - Data will be fetched from API */}
            <div className="text-center text-muted-foreground py-8">
              <p>No completion rate data available.</p>
              <p className="text-sm">Data will load here from API.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
