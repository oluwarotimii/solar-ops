"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Download, Calendar, DollarSign, Users, Target } from "lucide-react"

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("30")
  const [reportType, setReportType] = useState("overview")

  // Demo data
  const overviewStats = {
    totalRevenue: 45750,
    totalJobs: 24,
    completedJobs: 18,
    avgJobValue: 1906.25,
    technicianUtilization: 85,
    customerSatisfaction: 4.7,
  }

  const jobTypeStats = [
    { type: "Solar Installation", count: 8, revenue: 20000, avgDuration: 480 },
    { type: "Maintenance Check", count: 6, revenue: 1800, avgDuration: 120 },
    { type: "Repair Service", count: 4, revenue: 1400, avgDuration: 180 },
    { type: "System Inspection", count: 4, revenue: 3200, avgDuration: 240 },
    { type: "Emergency Call", count: 2, revenue: 900, avgDuration: 150 },
  ]

  const technicianPerformance = [
    { name: "Mike Johnson", jobs: 6, revenue: 7500, rating: 4.8, efficiency: 92 },
    { name: "David Smith", jobs: 5, revenue: 4200, rating: 4.6, efficiency: 88 },
    { name: "Lisa Wilson", jobs: 4, revenue: 5800, rating: 4.9, efficiency: 95 },
    { name: "Robert Brown", jobs: 3, revenue: 3600, rating: 4.7, efficiency: 85 },
  ]

  const monthlyTrends = [
    { month: "Oct", jobs: 18, revenue: 32500 },
    { month: "Nov", jobs: 22, revenue: 38200 },
    { month: "Dec", jobs: 20, revenue: 35800 },
    { month: "Jan", jobs: 24, revenue: 45750 },
  ]

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

      <Tabs defaultValue="overview">
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
                    <p className="text-2xl font-bold">${overviewStats.totalRevenue.toLocaleString()}</p>
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
                    <p className="text-2xl font-bold">{overviewStats.totalJobs}</p>
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
                    <p className="text-2xl font-bold">{overviewStats.completedJobs}</p>
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
                    <p className="text-2xl font-bold">${overviewStats.avgJobValue.toFixed(0)}</p>
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
                    <p className="text-2xl font-bold">{overviewStats.technicianUtilization}%</p>
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
                    <p className="text-2xl font-bold">{overviewStats.customerSatisfaction}</p>
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
                    {overviewStats.completedJobs}/{overviewStats.totalJobs}
                  </span>
                </div>
                <Progress value={(overviewStats.completedJobs / overviewStats.totalJobs) * 100} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {((overviewStats.completedJobs / overviewStats.totalJobs) * 100).toFixed(1)}% completion rate
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
                {jobTypeStats.map((jobType, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{jobType.type}</h3>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{jobType.count} jobs</span>
                        <span>${jobType.revenue.toLocaleString()} revenue</span>
                        <span>{jobType.avgDuration} min avg</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{jobType.count} jobs</Badge>
                    </div>
                  </div>
                ))}
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
                {technicianPerformance.map((tech, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{tech.name}</h3>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{tech.jobs} jobs completed</span>
                        <span>${tech.revenue.toLocaleString()} earned</span>
                        <span>{tech.rating}★ rating</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{tech.efficiency}% efficiency</div>
                      <Progress value={tech.efficiency} className="w-20 h-2 mt-1" />
                    </div>
                  </div>
                ))}
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
                {monthlyTrends.map((month, index) => (
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
                      <div className="font-medium">${month.revenue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
