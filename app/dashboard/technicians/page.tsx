"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Phone, Mail, MapPin, Clock, TrendingUp, User, Eye } from "lucide-react"

interface Technician {
  id: string
  name: string
  email: string
  phone: string
  status: "active" | "idle" | "offline"
  currentJob?: {
    id: string
    title: string
    status: string
  }
  stats: {
    totalJobs: number
    completedJobs: number
    avgRating: number
    totalEarned: number
  }
  lastSeen: string
}

// Demo technicians data
const demoTechnicians: Technician[] = [
  {
    id: "1",
    name: "Mike Johnson",
    email: "tech1@demo.com",
    phone: "+1-555-0101",
    status: "active",
    currentJob: {
      id: "1",
      title: "Solar Panel Installation - Residential",
      status: "in_progress",
    },
    stats: {
      totalJobs: 45,
      completedJobs: 42,
      avgRating: 4.8,
      totalEarned: 18750.0,
    },
    lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "David Smith",
    email: "tech2@demo.com",
    phone: "+1-555-0102",
    status: "active",
    currentJob: {
      id: "2",
      title: "Quarterly Maintenance Check",
      status: "in_progress",
    },
    stats: {
      totalJobs: 38,
      completedJobs: 36,
      avgRating: 4.6,
      totalEarned: 15200.0,
    },
    lastSeen: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "Lisa Wilson",
    email: "tech3@demo.com",
    phone: "+1-555-0103",
    status: "idle",
    stats: {
      totalJobs: 52,
      completedJobs: 50,
      avgRating: 4.9,
      totalEarned: 22100.0,
    },
    lastSeen: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    name: "Robert Brown",
    email: "tech4@demo.com",
    phone: "+1-555-0104",
    status: "offline",
    stats: {
      totalJobs: 29,
      completedJobs: 28,
      avgRating: 4.7,
      totalEarned: 12800.0,
    },
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
]

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>(demoTechnicians)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredTechnicians = technicians.filter((tech) => {
    const matchesSearch =
      tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tech.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || tech.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "idle":
        return "bg-yellow-100 text-yellow-800"
      case "offline":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatLastSeen = (timestamp: string) => {
    const now = new Date()
    const lastSeen = new Date(timestamp)
    const diffMs = now.getTime() - lastSeen.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMins < 60) {
      return `${diffMins} minutes ago`
    } else {
      return `${diffHours} hours ago`
    }
  }

  // Calculate summary stats
  const totalTechnicians = technicians.length
  const activeTechnicians = technicians.filter((t) => t.status === "active").length
  const avgCompletionRate =
    technicians.reduce((sum, tech) => sum + (tech.stats.completedJobs / tech.stats.totalJobs) * 100, 0) /
    technicians.length
  const totalEarned = technicians.reduce((sum, tech) => sum + tech.stats.totalEarned, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Technicians</h1>
          <p className="text-muted-foreground">Manage and monitor field technicians</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Technicians</p>
                <p className="text-2xl font-bold">{totalTechnicians}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-full">
                <User className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Active Now</p>
                <p className="text-2xl font-bold">{activeTechnicians}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Avg Completion</p>
                <p className="text-2xl font-bold">{avgCompletionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Earned</p>
                <p className="text-2xl font-bold">${totalEarned.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search technicians..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Technicians Table */}
      <Card>
        <CardHeader>
          <CardTitle>Technicians ({filteredTechnicians.length})</CardTitle>
          <CardDescription>All registered technicians and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technician</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Job</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTechnicians.map((tech) => (
                  <TableRow key={tech.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(tech.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{tech.name}</p>
                          <p className="text-sm text-muted-foreground">{tech.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(tech.status)}>{tech.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {tech.currentJob ? (
                        <div>
                          <p className="font-medium text-sm">{tech.currentJob.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {tech.currentJob.status.replace("_", " ")}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No active job</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          <span>{tech.phone}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{tech.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="font-medium">{tech.stats.completedJobs}</span>
                          <span className="text-muted-foreground">/{tech.stats.totalJobs} jobs</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">${tech.stats.totalEarned.toLocaleString()}</span>
                          <span className="text-muted-foreground"> earned</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{formatLastSeen(tech.lastSeen)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTechnicians.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No technicians found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
