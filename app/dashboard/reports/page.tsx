"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Download, Calendar, DollarSign, Users, Target, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleExport = () => {
    if (!reportData) {
      toast({
        title: "Export Failed",
        description: "No data available to export.",
        variant: "destructive",
      })
      return
    }

    let csvContent = "data:text/csv;charset=utf-8,"
    let headers: string[] = []
    let rows: string[][] = []
    let filename = `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`

    if (reportType === 'jobs' && reportData.jobsByType) {
      headers = ["Job Type", "Count"]
      rows = reportData.jobsByType.map((d: any) => [d.name, d.count])
      csvContent += headers.join(",") + "\n"
      rows.forEach(row => { csvContent += row.join(",") + "\n" })

    } else if (reportType === 'technicians' && reportData.technicianPerformance) {
      headers = ["Name", "Email", "Completed Jobs", "Total Earned (NGN)", "Average Rating"]
      rows = reportData.technicianPerformance.map((d: any) => [
        d.name,
        d.email,
        d.completedJobs,
        d.totalEarned,
        parseFloat(d.averageRating).toFixed(2)
      ])
      csvContent += headers.join(",") + "\n"
      rows.forEach(row => { csvContent += `"${row.join('","')}"\n` })

    } else {
      toast({ title: "Export not available for this view." })
      return
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
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
          <Card>
            <CardHeader>
              <CardTitle>Job Analysis</CardTitle>
              <CardDescription>Breakdown of jobs by type and status for the selected period.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-4">Jobs by Type</h3>
                <div className="space-y-3">
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
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Jobs by Status</h3>
                <div className="space-y-2">
                  {reportData?.jobsByStatus?.map((job: any, index: number) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                      <span className="capitalize text-sm font-medium">{job.status.replace('_', ' ')}</span>
                      <Badge variant="secondary">{job.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technicians" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technician Performance</CardTitle>
              <CardDescription>Performance metrics for each technician for the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">Name</th>
                      <th scope="col" className="px-6 py-3 text-right">Completed Jobs</th>
                      <th scope="col" className="px-6 py-3 text-right">Total Earned</th>
                      <th scope="col" className="px-6 py-3 text-right">Avg. Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.technicianPerformance?.map((tech: any) => (
                      <tr key={tech.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                          {tech.name}
                          <p className="text-xs text-muted-foreground">{tech.email}</p>
                        </th>
                        <td className="px-6 py-4 text-right">{tech.completedJobs}</td>
                        <td className="px-6 py-4 text-right">{formatNaira(tech.totalEarned)}</td>
                        <td className="px-6 py-4 text-right">{parseFloat(tech.averageRating).toFixed(1)} ★</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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
