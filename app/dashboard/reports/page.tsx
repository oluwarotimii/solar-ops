"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Download, Calendar, DollarSign, Users, Target, Loader2, AlertCircle } from "lucide-react"

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("30")
  const [reportType, setReportType] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<any>(null)

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

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

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
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Job Analysis</TabsTrigger>
          <TabsTrigger value="technicians">Technician Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Revenue</p>
                    <p className="text-2xl font-bold">{formatNaira(reportData?.overviewStats?.totalRevenue || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total Jobs</p>
                    <p className="text-2xl font-bold">{reportData?.overviewStats?.totalJobs || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Completed</p>
                    <p className="text-2xl font-bold">{reportData?.overviewStats?.completedJobs || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Avg Value</p>
                    <p className="text-2xl font-bold">{formatNaira(reportData?.overviewStats?.avgJobValue || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium">Utilization</p>
                    <p className="text-2xl font-bold">{reportData?.overviewStats?.technicianUtilization || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Satisfaction</p>
                    <p className="text-2xl font-bold">{reportData?.overviewStats?.customerSatisfaction || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Completion Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Job Completion Rate</CardTitle>
              <CardDescription>Percentage of jobs completed successfully</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Completed Jobs</span>
                  <span>
                    {reportData?.overviewStats?.completedJobs || 0}/{(reportData?.overviewStats?.totalJobs || 0)}
                  </span>
                </div>
                <Progress
                  value={
                    (reportData?.overviewStats?.totalJobs || 0) > 0
                      ? (reportData?.overviewStats?.completedJobs || 0) /
                        (reportData?.overviewStats?.totalJobs || 0) *
                        100
                      : 0
                  }
                  className="h-3"
                />
                <p className="text-sm text-muted-foreground">
                  {
                    ((reportData?.overviewStats?.totalJobs || 0) > 0
                      ? (reportData?.overviewStats?.completedJobs || 0) /
                        (reportData?.overviewStats?.totalJobs || 0) *
                        100
                      : 0
                    ).toFixed(1)
                  }%
                  completion rate
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Type Analysis</CardTitle>
              <CardDescription>Performance breakdown by job type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData?.jobTypeStats?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No job type data available for this period.</p>
                  </div>
                ) : (
                  reportData?.jobTypeStats?.map((jobType: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{jobType.type}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{jobType.count} jobs</span>
                          <span>{formatNaira(jobType.revenue)} revenue</span>
                          <span>{jobType.avgDuration} min avg</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{jobType.count} jobs</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technicians" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technician Performance</CardTitle>
              <CardDescription>Individual technician metrics and ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData?.technicianPerformance?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No technician performance data available for this period.</p>
                  </div>
                ) : (
                  reportData?.technicianPerformance?.map((tech: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{tech.name}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{tech.jobs} jobs completed</span>
                          <span>{formatNaira(tech.revenue)} earned</span>
                          <span>{tech.rating}★ rating</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{tech.efficiency}% efficiency</div>
                        <Progress value={tech.efficiency} className="w-20 h-2 mt-1" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Job volume and revenue trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData?.monthlyTrends?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No monthly trend data available for this period.</p>
                  </div>
                ) : (
                  reportData?.monthlyTrends?.map((month: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{month.month} 2024</h3>
                          <p className="text-sm text-muted-foreground">{month.jobs} jobs completed</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatNaira(month.revenue)}</div>
                        <div className="text-sm text-muted-foreground">revenue</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
