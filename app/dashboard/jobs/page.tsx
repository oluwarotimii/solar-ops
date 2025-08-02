"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, MapPin, Calendar, User, Eye, Edit, Trash2, Loader2, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/date-utils";
import CreateJobDialog from "@/components/create-job-dialog";
import EditJobDialog from "@/components/edit-job-dialog";

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

interface Job {
  id: string
  title: string
  description: string
  jobType: { name: string; color: string }
  assignedUser?: { firstName: string; lastName: string }
  status: "assigned" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  locationAddress: string
  scheduledDate?: string | Date | null
  jobValue: number
  estimatedDuration: number
  technicians?: Array<{ technicianId: string; role: "lead" | "assistant" | "specialist"; firstName: string; lastName: string; }>
}

interface JobType {
  id: string
  name: string
  color: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobTypes, setJobTypes] = useState<JobType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/jobs")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch jobs.")
      }

      const data = await response.json()
      console.log("Fetched jobs data:", data);
      setJobs(data)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching jobs.")
    } finally {
      setLoading(false)
    }
  }

  const fetchJobTypes = async () => {
    try {
      const response = await fetch("/api/job-types")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch job types.")
      }

      const data = await response.json()
      setJobTypes(data)
    } catch (error) {
      console.error("Failed to fetch job types:", error)
    }
  }

  useEffect(() => {
    fetchJobs()
    fetchJobTypes()
  }, [])

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.locationAddress.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    const matchesType = typeFilter === "all" || job.jobType.name === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const handleJobCreated = async () => {
    fetchJobs() // Refresh the list after creation
    setShowCreateDialog(false)
  }

  const handleJobUpdated = async () => {
    fetchJobs(); // Refresh the list after update
    setShowEditDialog(false);
    setSelectedJob(null);
  }

  const handleJobDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete job.");
      }

      fetchJobs(); // Refresh the list after deletion
    } catch (err: any) {
      setError(err.message || "Error deleting job.");
    }
  };

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
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
                {jobTypes.map((type) => (
                  <SelectItem key={type.id} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
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
                  <TableHead>Value</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Scheduled</TableHead>
                  
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto" />
                      <p className="text-muted-foreground mt-2">Loading jobs...</p>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-red-600">
                      <AlertCircle className="h-6 w-6 mx-auto" />
                      <p className="mt-2">Error: {error}</p>
                    </TableCell>
                  </TableRow>
                ) : filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No jobs found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => (
                    <TableRow key={job.id} onClick={async () => {
                      try {
                        const response = await fetch(`/api/jobs/${job.id}`);
                        if (!response.ok) {
                          throw new Error('Failed to fetch job details');
                        }
                        const fullJobDetails = await response.json();
                        setSelectedJob(fullJobDetails);
                        setShowEditDialog(true); // Open dialog after fetching
                      } catch (err) {
                        console.error(err);
                        setError("Failed to load job details for editing.");
                      }
                    }} className="cursor-pointer">
                      <TableCell>
                        <div>
                          <p className="font-medium">{job.title}</p>
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
                        <span className="font-bold text-green-600">{formatNaira(job.jobValue)}</span>
                      </TableCell>
                      <TableCell>
                        {job.technicians && job.technicians.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {job.technicians.map((tech, techIndex) => (
                              <div key={techIndex} className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>
                                  {tech.firstName} {tech.lastName} ({tech.role})
                                </span>
                              </div>
                            ))}
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
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{job.locationAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {console.log("Scheduled Date:", job.scheduledDate)}
                        {job.scheduledDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(job.scheduledDate)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not scheduled</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation(); // Prevent row click from firing
                            handleJobDelete(job.id);
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
    {selectedJob && (
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          setSelectedJob(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <EditJobDialog job={selectedJob} onJobUpdated={handleJobUpdated} />
        </DialogContent>
      </Dialog>
    )}
    </>
  )
}
