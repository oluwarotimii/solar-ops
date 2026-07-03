"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Download, Calendar, DollarSign, Users, Target, Loader2, AlertCircle, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatNaira } from "@/lib/utils"
import { MonetaryValue } from "@/components/ui/monetary-value"

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("30")
  const [reportType, setReportType] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [completionRate, setCompletionRate] = useState(0)
  const { toast } = useToast()

  const fetchReportData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/dashboard/reports?type=${reportType}&range=${dateRange}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch report data.")
      }

      const data = await response.json()
      setReportData(data)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching reports.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [reportType, dateRange])

  useEffect(() => {
    if (reportData?.overviewStats) {
      console.log('Received overviewStats:', reportData.overviewStats);
      
      const numCompletedJobs = Number(reportData.overviewStats.completedJobs || 0);
      const numTotalJobs = Number(reportData.overviewStats.totalJobs || 0);

      console.log('Parsed Jobs -> Completed:', numCompletedJobs, 'Total:', numTotalJobs);

      if (isNaN(numCompletedJobs) || isNaN(numTotalJobs)) {
        console.error('Calculation aborted: Invalid number detected.');
        setCompletionRate(0);
        return;
      }

      const rate = numTotalJobs > 0 ? (numCompletedJobs / numTotalJobs) * 100 : 0;
      console.log('Calculated Rate:', rate);
      setCompletionRate(rate);
    }
  }, [reportData])

  const handleExport = () => {
    if (!reportData) {
      toast({
        title: "Export Failed",
        description: "No data available to export.",
        variant: "destructive",
      })
      return
    }

    let csvContent = ""
    let headers: string[] = []
    let rows: string[][] = []
    let filename = `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`

    if (reportType === 'overview' && reportData.overviewStats) {
      headers = ["Metric", "Value"]
      rows = [
        ["Total Jobs", reportData.overviewStats.totalJobs],
        ["Completed Jobs", reportData.overviewStats.completedJobs],
        ["Customer Satisfaction", reportData.overviewStats.customerSatisfaction],
        ["Technician Utilization", reportData.overviewStats.technicianUtilization],
        ["Total Revenue", formatNaira(reportData.overviewStats.totalRevenue)],
        ["Completed Revenue", formatNaira(reportData.overviewStats.completedRevenue)],
        ["Average Job Value", formatNaira(reportData.overviewStats.averageJobValue)]
      ]

    } else if (reportType === 'jobs' && (reportData.jobsByType || reportData.jobsByStatus || reportData.jobsByPriority || reportData.revenueByJobType)) {
      // Jobs by Type
      if (reportData.jobsByType) {
        headers = ["Job Type", "Count"]
        rows = reportData.jobsByType.map((d: any) => [d.name, d.count])
        csvContent += "Jobs by Type\n"
        csvContent += headers.map(field => `"${field}"`).join(",") + "\n"
        rows.forEach(row => {
          const escapedRow = row.map(field => {
            if (field === null || field === undefined) return '""'
            return `"${String(field).replace(/"/g, '""')}"`
          })
          csvContent += escapedRow.join(",") + "\n"
        })
        csvContent += "\n"
      }

      // Jobs by Status
      if (reportData.jobsByStatus) {
        headers = ["Status", "Count"]
        rows = reportData.jobsByStatus.map((d: any) => [d.status, d.count])
        csvContent += "Jobs by Status\n"
        csvContent += headers.map(field => `"${field}"`).join(",") + "\n"
        rows.forEach(row => {
          const escapedRow = row.map(field => {
            if (field === null || field === undefined) return '""'
            return `"${String(field).replace(/"/g, '""')}"`
          })
          csvContent += escapedRow.join(",") + "\n"
        })
        csvContent += "\n"
      }

      // Jobs by Priority
      if (reportData.jobsByPriority) {
        headers = ["Priority", "Count"]
        rows = reportData.jobsByPriority.map((d: any) => [d.priority, d.count])
        csvContent += "Jobs by Priority\n"
        csvContent += headers.map(field => `"${field}"`).join(",") + "\n"
        rows.forEach(row => {
          const escapedRow = row.map(field => {
            if (field === null || field === undefined) return '""'
            return `"${String(field).replace(/"/g, '""')}"`
          })
          csvContent += escapedRow.join(",") + "\n"
        })
        csvContent += "\n"
      }

      // Revenue by Job Type
      if (reportData.revenueByJobType) {
        headers = ["Job Type", "Job Count", "Total Value"]
        rows = reportData.revenueByJobType.map((d: any) => [d.name, d.jobCount, formatNaira(d.totalValue)])
        csvContent += "Revenue by Job Type\n"
        csvContent += headers.map(field => `"${field}"`).join(",") + "\n"
        rows.forEach(row => {
          const escapedRow = row.map(field => {
            if (field === null || field === undefined) return '""'
            return `"${String(field).replace(/"/g, '""')}"`
          })
          csvContent += escapedRow.join(",") + "\n"
        })
      }

      // Reset for file naming
      headers = []
      rows = []

    } else if (reportType === 'technicians' && (reportData.technicianPerformance || reportData.userJobStats)) {
      // Technician Performance Summary
      if (reportData.technicianPerformance) {
        headers = ["Name", "Email", "Completed Jobs", "Total Earned (NGN)", "Average Rating"]
        rows = reportData.technicianPerformance.map((d: any) => [
          d.name,
          d.email,
          d.completedJobs,
          formatNaira(d.totalEarned),
          parseFloat(d.averageRating).toFixed(2)
        ])
        csvContent += "Technician Performance Summary\n"
        csvContent += headers.map(field => `"${field}"`).join(",") + "\n"
        rows.forEach(row => {
          const escapedRow = row.map(field => {
            if (field === null || field === undefined) return '""'
            return `"${String(field).replace(/"/g, '""')}"`
          })
          csvContent += escapedRow.join(",") + "\n"
        })
        csvContent += "\n"
      }

      // User Job Statistics
      if (reportData.userJobStats) {
        headers = [
          "Name", "Email", "Total Jobs", "Completed Jobs", "In Progress Jobs", 
          "Assigned Jobs", "Cancelled Jobs", "Total Value (NGN)", "Completed Value (NGN)", "Total Earned (NGN)"
        ]
        rows = reportData.userJobStats.map((d: any) => [
          d.name,
          d.email,
          d.totalJobs,
          d.completedJobs,
          d.inProgressJobs,
          d.assignedJobs,
          d.cancelledJobs,
          formatNaira(d.totalValue),
          formatNaira(d.completedValue),
          formatNaira(d.totalEarned)
        ])
        csvContent += "User Job Statistics\n"
        csvContent += headers.map(field => `"${field}"`).join(",") + "\n"
        rows.forEach(row => {
          const escapedRow = row.map(field => {
            if (field === null || field === undefined) return '""'
            return `"${String(field).replace(/"/g, '""')}"`
          })
          csvContent += escapedRow.join(",") + "\n"
        })
      }

      // Reset for file naming
      headers = []
      rows = []

    } else if (reportType === 'maintenance' && (reportData.maintenanceStats || reportData.maintenanceByTechnician)) {
      // Maintenance Statistics
      if (reportData.maintenanceStats) {
        headers = ["Metric", "Value"]
        rows = [
          ["Total Tasks", reportData.maintenanceStats.totalTasks],
          ["Completed Tasks", reportData.maintenanceStats.completedTasks],
          ["In Progress Tasks", reportData.maintenanceStats.inProgressTasks],
          ["Scheduled Tasks", reportData.maintenanceStats.scheduledTasks],
          ["Overdue Tasks", reportData.maintenanceStats.overdueTasks]
        ]
        csvContent += "Maintenance Statistics\n"
        csvContent += headers.map(field => `"${field}"`).join(",") + "\n"
        rows.forEach(row => {
          const escapedRow = row.map(field => {
            if (field === null || field === undefined) return '""'
            return `"${String(field).replace(/"/g, '""')}"`
          })
          csvContent += escapedRow.join(",") + "\n"
        })
        csvContent += "\n"
      }

      // Maintenance by Technician
      if (reportData.maintenanceByTechnician) {
        headers = [
          "Name", "Email", "Total Tasks", "Completed Tasks", "In Progress Tasks", 
          "Scheduled Tasks", "Overdue Tasks"
        ]
        rows = reportData.maintenanceByTechnician.map((d: any) => [
          d.name,
          d.email,
          d.totalTasks,
          d.completedTasks,
          d.inProgressTasks,
          d.scheduledTasks,
          d.overdueTasks
        ])
        csvContent += "Maintenance by Technician\n"
        csvContent += headers.map(field => `"${field}"`).join(",") + "\n"
        rows.forEach(row => {
          const escapedRow = row.map(field => {
            if (field === null || field === undefined) return '""'
            return `"${String(field).replace(/"/g, '""')}"`
          })
          csvContent += escapedRow.join(",") + "\n"
        })
      }

      // Reset for file naming
      headers = []
      rows = []

    } else if (reportType === 'trends') {
      toast({ 
        title: "Export not available", 
        description: "Trend data is not yet available for export." 
      })
      return
    } else if (reportType === 'time' && reportData.timeOverview) {
      // Time analytics overview
      headers = ["Metric", "Value"]
      rows = [
        ["Active Technicians", reportData.timeOverview.activeTechnicians],
        ["Total Shifts", reportData.timeOverview.totalShifts],
        ["Total Hours Worked", parseFloat(reportData.timeOverview.totalHoursWorked).toFixed(1)],
      ]
      csvContent += "Time Analytics Overview\n"
      csvContent += headers.map(field => `"${field}"`).join(",") + "\n"
      rows.forEach(row => {
        const escapedRow = row.map(field => {
          if (field === null || field === undefined) return '""'
          return `"${String(field).replace(/"/g, '""')}"`
        })
        csvContent += escapedRow.join(",") + "\n"
      })
      csvContent += "\n"

      // Hours by Technician
      if (reportData.hoursByTechnician) {
        headers = ["Name", "Email", "Shifts", "Total Hours", "Avg Shift (h)"]
        rows = reportData.hoursByTechnician.map((d: any) => [
          d.name, d.email, d.shiftsCount,
          parseFloat(d.totalHours).toFixed(1),
          parseFloat(d.avgShiftHours).toFixed(1)
        ])
        csvContent += "Hours by Technician\n"
        csvContent += headers.map(field => `"${field}"`).join(",") + "\n"
        rows.forEach(row => {
          const escapedRow = row.map(field => {
            if (field === null || field === undefined) return '""'
            return `"${String(field).replace(/"/g, '""')}"`
          })
          csvContent += escapedRow.join(",") + "\n"
        })
        csvContent += "\n"
      }

      // Hours by Job
      if (reportData.hoursByJob) {
        headers = ["Job Title", "Type", "Clock-ins", "Total Hours", "Avg/Shift", "Job Value"]
        rows = reportData.hoursByJob.map((d: any) => [
          d.title, d.jobType || 'N/A', d.clockIns,
          parseFloat(d.totalHours).toFixed(1),
          parseFloat(d.avgHoursPerShift).toFixed(1),
          formatNaira(d.jobValue || 0)
        ])
        csvContent += "Hours by Job\n"
        csvContent += headers.map(field => `"${field}"`).join(",") + "\n"
        rows.forEach(row => {
          const escapedRow = row.map(field => {
            if (field === null || field === undefined) return '""'
            return `"${String(field).replace(/"/g, '""')}"`
          })
          csvContent += escapedRow.join(",") + "\n"
        })
      }

      // Reset
      headers = []
      rows = []
    } else {
      toast({ 
        title: "Export not available", 
        description: "No data available for export in this view." 
      })
      return
    }

    // If we have headers/rows (for simple exports), create CSV content
    if (headers.length > 0 && rows.length > 0) {
      csvContent += headers.map(field => `"${field}"`).join(",") + "\n"
      rows.forEach(row => {
        const escapedRow = row.map(field => {
          if (field === null || field === undefined) return '""'
          return `"${String(field).replace(/"/g, '""')}"`
        })
        csvContent += escapedRow.join(",") + "\n"
      })
    }

    // Create blob and download link
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({ title: "Export Successful", description: `Downloaded ${filename}` })
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="ml-2 text-lg">Loading report...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex justify-center items-center h-64 text-red-600">
          <AlertCircle className="h-8 w-8 mr-2" />
          <p className="text-lg">Error: {error}</p>
        </div>
      )
    }

    return (
      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Job Analysis</TabsTrigger>
          <TabsTrigger value="technicians">Technician Performance</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="time">Time</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.overviewStats?.totalJobs || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.overviewStats?.completedJobs || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tech Utilization</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.overviewStats?.technicianUtilization || 0}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Satisfaction</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.overviewStats?.customerSatisfaction || 0} ★</div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"><MonetaryValue value={reportData?.overviewStats?.totalRevenue || 0} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"><MonetaryValue value={reportData?.overviewStats?.completedRevenue || 0} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Job Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"><MonetaryValue value={reportData?.overviewStats?.averageJobValue || 0} /></div>
              </CardContent>
            </Card>
          </div>

          {/* Completion Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Job Completion Rate</CardTitle>
              <CardDescription>Percentage of jobs completed successfully in the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Completed Jobs</span>
                  <span>
                    {reportData?.overviewStats?.completedJobs || 0} / {reportData?.overviewStats?.totalJobs || 0}
                  </span>
                </div>
                <Progress value={completionRate} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Jobs by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Jobs by Type</CardTitle>
                <CardDescription>Breakdown of jobs by type for the selected period.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reportData?.jobsByType?.map((job: any, index: number) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{job.name}</span>
                      <span>{job.count}</span>
                    </div>
                    <Progress value={
                      (reportData?.overviewStats?.totalJobs ?? 0) > 0
                        ? (job.count / reportData.overviewStats.totalJobs) * 100
                        : 0
                    } className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Jobs by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Jobs by Status</CardTitle>
                <CardDescription>Breakdown of jobs by status for the selected period.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {reportData?.jobsByStatus?.map((job: any, index: number) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                    <span className="capitalize text-sm font-medium">{job.status.replace('_', ' ')}</span>
                    <Badge variant="secondary">{job.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Jobs by Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Jobs by Priority</CardTitle>
                <CardDescription>Breakdown of jobs by priority level for the selected period.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {reportData?.jobsByPriority?.map((job: any, index: number) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                    <span className="capitalize text-sm font-medium">{job.priority}</span>
                    <Badge variant="secondary">{job.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Revenue by Job Type */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Job Type</CardTitle>
                <CardDescription>Total revenue generated by each job type for the selected period.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reportData?.revenueByJobType?.map((job: any, index: number) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{job.name}</span>
                      <MonetaryValue value={job.totalValue} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{job.jobCount} jobs</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technicians" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technician Performance</CardTitle>
              <CardDescription>Performance metrics for technicians for the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="border rounded-lg">
                  <div className="hidden md:grid md:grid-cols-5 font-semibold p-4 bg-gray-50 dark:bg-gray-700">
                    <div>Name</div>
                    <div className="text-right">Completed Jobs</div>
                    <div className="text-right">Total Earned</div>
                    <div className="text-right">Avg. Rating</div>
                    <div className="text-right">Job Details</div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData?.technicianPerformance?.map((tech: any) => (
                      <div key={tech.id} className="grid grid-cols-2 md:grid-cols-5 p-4 gap-4 items-center">
                        <div className="md:col-span-1 col-span-2">
                          <p className="font-medium text-gray-900 dark:text-white">{tech.name}</p>
                          <p className="text-xs text-muted-foreground">{tech.email}</p>
                        </div>
                        <div className="text-left md:text-right">
                          <span className="md:hidden font-semibold">Completed Jobs: </span>
                          {tech.completedJobs}
                        </div>
                        <div className="text-left md:text-right">
                          <span className="md:hidden font-semibold">Total Earned: </span>
                          <MonetaryValue value={tech.totalEarned} />
                        </div>
                        <div className="text-left md:text-right">
                          <span className="md:hidden font-semibold">Avg. Rating: </span>
                          {parseFloat(tech.averageRating).toFixed(1)} ★
                        </div>
                        <div className="text-left md:text-right">
                          <Button variant="outline" size="sm">View Jobs</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Job Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>User Job Statistics</CardTitle>
              <CardDescription>Job statistics for all users for the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="border rounded-lg">
                  <div className="hidden md:grid md:grid-cols-8 font-semibold p-4 bg-gray-50 dark:bg-gray-700 text-sm">
                    <div>Name</div>
                    <div className="text-right">Total Jobs</div>
                    <div className="text-right">Completed</div>
                    <div className="text-right">In Progress</div>
                    <div className="text-right">Assigned</div>
                    <div className="text-right">Cancelled</div>
                    <div className="text-right">Total Value</div>
                    <div className="text-right">Total Earned</div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData?.userJobStats?.map((user: any) => (
                      <div key={user.id} className="grid grid-cols-2 md:grid-cols-8 p-4 gap-4 items-center text-sm">
                        <div className="md:col-span-1 col-span-2">
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="text-left md:text-right">
                          <span className="md:hidden font-semibold">Total Jobs: </span>
                          {user.totalJobs}
                        </div>
                        <div className="text-left md:text-right">
                          <span className="md:hidden font-semibold">Completed: </span>
                          {user.completedJobs}
                        </div>
                        <div className="text-left md:text-right">
                          <span className="md:hidden font-semibold">In Progress: </span>
                          {user.inProgressJobs}
                        </div>
                        <div className="text-left md:text-right">
                          <span className="md:hidden font-semibold">Assigned: </span>
                          {user.assignedJobs}
                        </div>
                        <div className="text-left md:text-right">
                          <span className="md:hidden font-semibold">Cancelled: </span>
                          {user.cancelledJobs}
                        </div>
                        <div className="text-left md:text-right">
                          <span className="md:hidden font-semibold">Total Value: </span>
                          <MonetaryValue value={user.totalValue} />
                        </div>
                        <div className="text-left md:text-right">
                          <span className="md:hidden font-semibold">Total Earned: </span>
                          <MonetaryValue value={user.totalEarned} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Maintenance Stats Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Overview</CardTitle>
                <CardDescription>Summary of maintenance tasks for the selected period.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                    <p className="text-2xl font-bold">{reportData?.maintenanceStats?.totalTasks || 0}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{reportData?.maintenanceStats?.completedTasks || 0}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold">{reportData?.maintenanceStats?.inProgressTasks || 0}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold">{reportData?.maintenanceStats?.overdueTasks || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance by Technician */}
            <Card>
              <CardHeader>
                <CardTitle>Maintenance by Technician</CardTitle>
                <CardDescription>Breakdown of maintenance tasks by technician.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData?.maintenanceByTechnician?.map((tech: any) => (
                    <div key={tech.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div>
                        <p className="font-medium">{tech.name}</p>
                        <p className="text-sm text-muted-foreground">{tech.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{tech.completedTasks}/{tech.totalTasks}</p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <div className="flex justify-center items-center h-64 border-2 border-dashed rounded-lg">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Trend analysis coming soon</h3>
              <p className="mt-1 text-sm text-gray-500">Historical data charts will be available here in a future update.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Technicians</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.timeOverview?.activeTechnicians || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.timeOverview?.totalShifts || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hours Worked</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{parseFloat(reportData?.timeOverview?.totalHoursWorked || 0).toFixed(1)}h</div>
              </CardContent>
            </Card>
          </div>

          {/* Hours by Technician */}
          <Card>
            <CardHeader>
              <CardTitle>Hours by Technician</CardTitle>
              <CardDescription>Shift and hour breakdown per technician for the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="border rounded-lg">
                  <div className="hidden md:grid md:grid-cols-4 font-semibold p-4 bg-gray-50 dark:bg-gray-700">
                    <div>Name</div>
                    <div className="text-right">Shifts</div>
                    <div className="text-right">Total Hours</div>
                    <div className="text-right">Avg Shift (h)</div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData?.hoursByTechnician?.map((tech: any) => (
                      <div key={tech.id} className="grid grid-cols-2 md:grid-cols-4 p-4 gap-4 items-center">
                        <div className="md:col-span-1 col-span-2">
                          <p className="font-medium">{tech.name}</p>
                          <p className="text-xs text-muted-foreground">{tech.email}</p>
                        </div>
                        <div className="text-left md:text-right">{tech.shiftsCount}</div>
                        <div className="text-left md:text-right">{parseFloat(tech.totalHours).toFixed(1)}h</div>
                        <div className="text-left md:text-right">{parseFloat(tech.avgShiftHours).toFixed(1)}h</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hours by Job */}
          <Card>
            <CardHeader>
              <CardTitle>Time Spent Per Job</CardTitle>
              <CardDescription>Hours logged against specific jobs for the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="border rounded-lg">
                  <div className="hidden md:grid md:grid-cols-5 font-semibold p-4 bg-gray-50 dark:bg-gray-700">
                    <div>Job Title</div>
                    <div className="text-right">Clock-ins</div>
                    <div className="text-right">Total Hours</div>
                    <div className="text-right">Avg/Shift</div>
                    <div className="text-right">Job Value</div>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData?.hoursByJob?.map((job: any) => (
                      <div key={job.id} className="grid grid-cols-2 md:grid-cols-5 p-4 gap-4 items-center">
                        <div className="md:col-span-1 col-span-2">
                          <p className="font-medium">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.jobType || 'N/A'}</p>
                        </div>
                        <div className="text-left md:text-right">{job.clockIns}</div>
                        <div className="text-left md:text-right">{parseFloat(job.totalHours).toFixed(1)}h</div>
                        <div className="text-left md:text-right">{parseFloat(job.avgHoursPerShift).toFixed(1)}h</div>
                        <div className="text-left md:text-right"><MonetaryValue value={job.jobValue || 0} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Analytics and performance insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="mt-6">{renderContent()}</div>
    </div>
  )
}
