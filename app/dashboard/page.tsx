"use client"

import { useDashboardData } from "@/lib/dashboard-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, FileText, CheckCircle, Clock, MapPin, DollarSign, TrendingUp, AlertTriangle, Loader2, Briefcase } from "lucide-react"

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { stats, activity, completionRate, spilloverJobs, loading, error, user } = useDashboardData()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  if (!stats && !loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-muted-foreground">No dashboard data available.</p>
      </div>
    )
  }

  const isAdmin = user?.role?.isAdmin;

  const AdminDashboard = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦{(stats?.totalRevenue || 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Spillover Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₦{(stats?.spilloverRevenue || 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">From previous months</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalJobs}</div>
          <p className="text-xs text-muted-foreground">
            {stats?.activeJobs} active, {stats?.completedJobs} completed
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalUsers}</div>
          <p className="text-xs text-muted-foreground">Registered on platform</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Maintenance</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.pendingMaintenance}</div>
          <p className="text-xs text-muted-foreground">Tasks scheduled</p>
        </CardContent>
      </Card>
    </div>
  );

  const TechnicianDashboard = () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">My Assigned Jobs</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalAssignedJobs}</div>
          <p className="text-xs text-muted-foreground">Total jobs assigned to you</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">My Completed Jobs</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.completedJobs}</div>
          <p className="text-xs text-muted-foreground">Total jobs you have completed</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user ? `${user.firstName} ${user.lastName}` : ""}</p>
        {user && user.role && (
          <Badge variant="outline" className="mt-2">
            {user.role.name}
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      {isAdmin ? <AdminDashboard /> : <TechnicianDashboard />}

      {/* Admin-only Sections */}
      {isAdmin && (
        <>
          {/* Monthly Job Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jobs This Month</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate?.totalJobsThisMonth}</div>
                <p className="text-xs text-muted-foreground">Total jobs so far this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate?.completedJobsThisMonth}</div>
                <p className="text-xs text-muted-foreground">Jobs completed this month</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Quick Actions */}
          {/* Spillover Jobs */}
          {spilloverJobs && spilloverJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Spillover Jobs ({spilloverJobs.length})
                </CardTitle>
                <CardDescription>Jobs from last month not yet completed or cancelled.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {spilloverJobs.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{job.jobTypeName} - {job.locationAddress}</p>
                      <p className="text-xs text-muted-foreground">Scheduled: {new Date(job.scheduledDate).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">{job.status.replace("_", " ")}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>What's been happening across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activity && activity.length > 0 ? (
                    activity.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                          {item.type === 'job_created' && <Briefcase className="h-4 w-4 text-secondary-foreground" />}
                          {item.type === 'job_completed' && <CheckCircle className="h-4 w-4 text-secondary-foreground" />}
                          {item.type === 'user_login' && <Users className="h-4 w-4 text-secondary-foreground" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {item.type === 'job_created' && `New Job: ${item.title}`}
                            {item.type === 'job_completed' && `Job Completed: ${item.title}`}
                            {item.type === 'user_login' && `User Login: ${item.firstName} ${item.lastName}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No recent activity.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card> */}

            <Card>
              <CardHeader>
                <CardTitle>Job Completion Rate</CardTitle>
                <CardDescription>This month's performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <p className="ml-2">Loading completion rate...</p>
                  </div>
                ) : completionRate ? (
                  <div className="text-center py-4">
                    <p className="text-4xl font-bold text-primary">{completionRate.completionRate}%</p>
                    <p className="text-muted-foreground">{completionRate.completedJobsThisMonth} of {completionRate.totalJobsThisMonth} jobs completed this month</p>
                    <Progress value={parseFloat(completionRate.completionRate)} className="mt-4" />
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No completion rate data available.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}