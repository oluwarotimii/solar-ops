"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, MapPin, Calendar, User, Eye, Edit, Trash2 } from "lucide-react"
import CreateJobDialog from "@/components/create-job-dialog"

const statusColors = {
  assigned: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

// Demo jobs data
const demoJobs = [
  {
    id: "1",
    title: "Solar Panel Installation - Residential",
    description: "Install 20 solar panels on residential rooftop",
    jobType: { name: "Solar Installation", color: "#10B981" },
    assignedUser: { firstName: "Mike", lastName: "Johnson" },
    status: "assigned" as const,
    priority: "high" as const,
    locationAddress: "123 Sunny Street, Phoenix, AZ 85001",
    scheduledDate: "2024-01-15",
    jobValue: 2500.0,
    estimatedDuration: 480,
  },
  {
    id: "2",
    title: "Quarterly Maintenance Check",
    description: "Routine quarterly maintenance and performance check",
    jobType: { name: "Maintenance Check", color: "#F59E0B" },
    assignedUser: { firstName: "David", lastName: "Smith" },
    status: "in_progress" as const,
    priority: "medium" as const,
    locationAddress: "456 Solar Avenue, Tempe, AZ 85281",
    scheduledDate: "2024-01-12",
    jobValue: 300.0,
    estimatedDuration: 120,
  },
  {
    id: "3",
    title: "Emergency Inverter Repair",
    description: "Inverter failure - system completely down",
    jobType: { name: "Emergency Call", color: "#DC2626" },
    assignedUser: { firstName: "Lisa", lastName: "Wilson" },
    status: "assigned" as const,
    priority: "urgent" as const,
    locationAddress: "789 Desert Road, Scottsdale, AZ 85250",
    scheduledDate: "2024-01-13",
    jobValue: 450.0,
    estimatedDuration: 180,
  },
  {
    id: "4",
    title: "System Inspection - Commercial",
    description: "Annual inspection of commercial solar installation",
    jobType: { name: "System Inspection", color: "#3B82F6" },
    assignedUser: { firstName: "Robert", lastName: "Brown" },
    status: "completed" as const,
    priority: "medium" as const,
    locationAddress: "321 Business Park Drive, Mesa, AZ 85201",
    scheduledDate: "2024-01-10",
    jobValue: 800.0,
    estimatedDuration: 240,
  },
]

export default function JobsPage() {
  const [jobs, setJobs] = useState(demoJobs)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.locationAddress.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    const matchesType = typeFilter === "all" || job.jobType.name === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const handleJobCreated = (newJob: any) => {
    setJobs([...jobs, { ...newJob, id: Date.now().toString() }])
    setShowCreateDialog(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">Manage and track all field operations</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <CreateJobDialog onJobCreated={handleJobCreated} />
          </DialogContent>
        </Dialog>
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
                  placeholder="Search jobs..."
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
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Solar Installation">Solar Installation</SelectItem>
                <SelectItem value="Maintenance Check">Maintenance Check</SelectItem>
                <SelectItem value="Emergency Call">Emergency Call</SelectItem>
                <SelectItem value="System Inspection">System Inspection</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs ({filteredJobs.length})</CardTitle>
          <CardDescription>All field operation jobs and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{job.title}</p>
                        {job.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{job.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: job.jobType.color + "20",
                          color: job.jobType.color,
                        }}
                      >
                        {job.jobType.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.assignedUser ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>
                            {job.assignedUser.firstName} {job.assignedUser.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[job.status]}>{job.status.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[job.priority]} variant="outline">
                        {job.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 max-w-[200px]">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{job.locationAddress}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.scheduledDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(job.scheduledDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${job.jobValue.toFixed(2)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No jobs found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
