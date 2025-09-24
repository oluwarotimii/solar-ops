"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  User,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckSquare,
  RotateCcw,
  Eye,
  EyeOff,
  Archive,
} from "lucide-react"
import { formatDate } from "@/lib/date-utils"
import CreateJobDialog from "@/components/create-job-dialog"
import EditJobDialog from "@/components/edit-job-dialog"
import ViewJobDialog from "@/components/view-job-dialog"
import { useToast } from "@/components/ui/use-toast";
import { MobileTableCard } from "@/components/mobile-table-card";
import { BottomSheet } from "@/components/bottom-sheet";
import { usePermissions } from "@/contexts/permission-context";

// ... (interfaces and color constants remain the same)
interface UserJobAssignment {
  userId: string
  role: "lead" | "assistant" | "specialist"
  firstName: string
  lastName: string
  completedAt: string | null
}

interface Job {
  id: string
  title: string
  description: string
  jobType: { name: string; color: string }
  status: "assigned" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  locationAddress: string
  scheduledDate?: string | Date | null
  jobValue: number
  estimatedDuration?: number
  users?: UserJobAssignment[]
  isArchived?: boolean
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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedJobForSheet, setSelectedJobForSheet] = useState<Job | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [stats, setStats] = useState({ totalJobsValue: 0, completedJobsValue: 0 });
  const [showTotalValue, setShowTotalValue] = useState(false);
  const [showCompletedValue, setShowCompletedValue] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [jobsPerPage] = useState(12);
  const { toast } = useToast();
  const { user, hasPermission } = usePermissions();

  const fetchJobs = async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/jobs?page=${page}&limit=12`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch jobs.")
      }
      const data = await response.json()
      // Handle both paginated (admin) and non-paginated (technician) responses
      const jobsData = Array.isArray(data) ? data : data.jobs || []
      setJobs(jobsData)
      // Save pagination data if needed
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching jobs.")
    } finally {
      setLoading(false)
    }
  }

  const fetchJobTypes = async () => {
    try {
      const response = await fetch("/api/job-types")
      if (!response.ok) throw new Error("Failed to fetch job types.")
      const data = await response.json()
      setJobTypes(data)
    } catch (error) {
      console.error("Failed to fetch job types:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats.");
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  useEffect(() => {
    fetchJobs(currentPage);
    fetchJobTypes();
    fetchStats();
  }, [currentPage]);

  const handleJobCreated = () => {
    fetchJobs()
    fetchStats()
    setShowCreateDialog(false)
  }
  const handleJobUpdated = () => {
    fetchJobs()
    fetchStats()
    setShowEditDialog(false)
    setSelectedJob(null)
  }

  const handleJobDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return
    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" })
      if (!response.ok) throw new Error((await response.json()).error || "Failed to delete job.")
      toast({ title: "Success", description: "Job deleted successfully." })
      fetchJobs()
      fetchStats()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleMarkComplete = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, { method: "PATCH" })
      if (!response.ok) throw new Error((await response.json()).error || "Failed to mark as complete.")
      toast({ title: "Success", description: "Your work has been marked as complete." })
      fetchJobs()
      fetchStats()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleReopenJob = async (jobId: string) => {
    if (
      !confirm("Are you sure you want to re-open this job? This will reset the completion status for all technicians.")
    )
      return
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "assigned" }),
      })
      if (!response.ok) throw new Error((await response.json()).error || "Failed to re-open job.")
      toast({ title: "Success", description: "Job has been re-opened." })
      fetchJobs()
      fetchStats()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleArchiveJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to archive this job? This will hide it from the main jobs list.")) return
    try {
      const response = await fetch(`/api/jobs/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })
      if (!response.ok) throw new Error((await response.json()).error || "Failed to archive job.")
      toast({ title: "Success", description: "Job has been archived." })
      fetchJobs()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleJobCardClick = (job: Job) => {
    setSelectedJobForSheet(job)
    setShowBottomSheet(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in_progress":
        return "bg-blue-100 text-blue-800"
      case "assigned":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-blue-100 text-blue-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredJobs = (jobs || []).filter(
    (job) =>
      (job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.locationAddress.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "all" || job.status === statusFilter) &&
      (typeFilter === "all" || job.jobType.name === typeFilter),
  )

  const totalJobsValue = (jobs || []).reduce((acc, job) => acc + job.jobValue, 0)

  const isUserAssigned = selectedJobForSheet?.technicians?.some((t) => t.technicianId === user?.id)
  const technicianInfo = selectedJobForSheet?.technicians?.find((t) => t.technicianId === user?.id)
  const hasCompleted = !!technicianInfo?.completedAt

  return (
    <>
      {/* Header and Filters remain the same */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Jobs</h1>
            <p className="text-muted-foreground">Manage and track all field operations</p>
          </div>
          {hasPermission('jobs:create') && (
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
          )}
        </div>

        {/* <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobs.filter((j) => j.status === "completed").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">All-Time Job Value</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowTotalValue(!showTotalValue)}>
                {showTotalValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showTotalValue ? `₦${Number(stats.totalJobsValue).toLocaleString()}` : "••••••••"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Job Value</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowCompletedValue(!showCompletedValue)}>
                {showCompletedValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showCompletedValue ? `₦${Number(stats.completedJobsValue).toLocaleString()}` : "••••••••"}
              </div>
            </CardContent>
          </Card>
        </div> */}

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
                <SelectTrigger className="w-full sm:w-[180px]">
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

        <Card>
          <CardHeader>
            <CardTitle>Jobs ({filteredJobs.length})</CardTitle>
            <CardDescription>All field operation jobs and their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="hidden md:table-header-group">
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className="flex flex-col items-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Loading jobs...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-red-500">
                          <AlertCircle className="h-6 w-6 mx-auto" />
                          <p className="mt-2">Error: {error}</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredJobs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No jobs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredJobs.map((job) => {
                        const isUserAdmin = user?.role?.isAdmin
                        const isUserAssigned = job.technicians?.some((u) => u.technicianId === user?.id)
                        const userInfo = job.technicians?.find((u) => u.technicianId === user?.id)
                        const hasCompleted = !!userInfo?.completedAt

                        return (
                          <tr
                            key={job.id}
                            className="md:table-row block mb-4 md:mb-0 border-b last:border-b-0 md:border-none rounded-lg md:rounded-none p-4 md:p-0 shadow-md md:shadow-none"
                            onClick={() => {
                              setSelectedJob(job)
                              setShowViewDialog(true)
                            }}
                          >
                            <td className="md:table-cell py-2 font-medium" data-label="Job">
                              <div className="font-medium">{job.title}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.locationAddress}
                              </div>
                            </td>
                            <td className="md:table-cell py-2" data-label="Status">
                              <Badge>{job.status}</Badge>
                            </td>
                            <td className="md:table-cell py-2" data-label="Priority">
                              <Badge variant="outline">{job.priority}</Badge>
                            </td>
                            <td className="md:table-cell py-2" data-label="Scheduled">
                              {job.scheduledDate ? formatDate(job.scheduledDate) : "Not set"}
                            </td>
                            <td className="md:table-cell py-2 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-2 mt-2 md:mt-0">
                                {hasPermission('jobs:update') && job.status !== "completed" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedJob(job)
                                      setShowEditDialog(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                  </Button>
                                )}
                                {hasPermission('jobs:update') && job.status === "completed" && (
                                  <Button variant="outline" size="sm" onClick={() => handleReopenJob(job.id)}>
                                    <RotateCcw className="h-4 w-4 mr-2" /> Re-open
                                  </Button>
                                )}
                                {hasPermission('jobs:archive') && job.status === "completed" && !job.isArchived && (
                                  <Button variant="outline" size="sm" onClick={() => handleArchiveJob(job.id)}>
                                    <Archive className="h-4 w-4 mr-2" /> Archive
                                  </Button>
                                )}
                                {hasPermission('jobs:delete') && (
                                  <Button variant="destructive" size="sm" onClick={() => handleJobDelete(job.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                                {isUserAssigned && !hasPermission('jobs:update') && (
                                  <Button
                                    variant={hasCompleted ? "secondary" : "default"}
                                    size="sm"
                                    onClick={() => handleMarkComplete(job.id)}
                                    disabled={hasCompleted || job.status === "completed"}
                                  >
                                    <CheckSquare className="h-4 w-4 mr-2" />
                                    {hasCompleted ? "Completed" : "Mark as Complete"}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-4">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={jobs.length < jobsPerPage}
                  variant="outline"
                >
                  Next
                </Button>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading jobs...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">
                    <p className="text-sm">Error: {error}</p>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No jobs found.</p>
                  </div>
                ) : (
                  filteredJobs.map((job) => {
                    const isUserAdmin = user?.role?.isAdmin
                    const isUserAssigned = job.users?.some((u) => u.userId === user?.id)
                    const userInfo = job.users?.find((u) => u.userId === user?.id)
                    const hasCompleted = !!userInfo?.completedAt

                    return (
                      <MobileTableCard
                        key={job.id}
                        title={job.title}
                        subtitle={job.locationAddress}
                        status={job.status}
                        statusColor={getStatusColor(job.status)}
                        badges={[
                          { label: job.priority, variant: "outline" },
                          { label: job.jobType.name, variant: "secondary" },
                        ]}
                        onClick={() => handleJobCardClick(job)}
                        onMarkComplete={() => handleMarkComplete(job.id)}
                        showMarkComplete={isUserAssigned && !hasCompleted && job.status !== "completed"}
                      >
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>₦{job.jobValue.toLocaleString()}</span>
                          {job.scheduledDate && (
                            <>
                              <span>•</span>
                              <span>{formatDate(job.scheduledDate)}</span>
                            </>
                          )}
                        </div>
                        {job.users && job.users.length > 0 && (
                          <div className="mt-2 text-xs">
                            <span className="text-muted-foreground">Assigned: </span>
                            <span>{job.users.map((u) => `${u.firstName} ${u.lastName}`).join(", ")}</span>
                          </div>
                        )}
                      </MobileTableCard>
                    )
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title={selectedJobForSheet?.title || "Job Details"}
        actions={
          selectedJobForSheet && (
            <div className="flex gap-2">
              {hasPermission('jobs:update') && selectedJobForSheet.status !== "completed" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedJob(selectedJobForSheet)
                    setShowEditDialog(true)
                    setShowBottomSheet(false)
                  }}
                >
                  Edit Job
                </Button>
              )}
              {isUserAssigned && !hasCompleted && selectedJobForSheet.status !== "completed" && (
                <Button
                  size="sm"
                  onClick={() => {
                    handleMarkComplete(selectedJobForSheet.id)
                    setShowBottomSheet(false)
                  }}
                >
                  Mark as Complete
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => {
                  setSelectedJob(selectedJobForSheet)
                  setShowViewDialog(true)
                  setShowBottomSheet(false)
                }}
              >
                View Details
              </Button>
            </div>
          )
        }
      >
        {selectedJobForSheet && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Description</h3>
              <p className="text-sm mt-1">{selectedJobForSheet.description}</p>
            </div>

            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Location</h3>
              <p className="text-sm mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {selectedJobForSheet.locationAddress}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Value</h3>
                <p className="text-sm mt-1 font-medium">₦{selectedJobForSheet.jobValue.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Priority</h3>
                <Badge className={`mt-1 ${getPriorityColor(selectedJobForSheet.priority)}`}>
                  {selectedJobForSheet.priority}
                </Badge>
              </div>
            </div>

            {selectedJobForSheet.scheduledDate && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Scheduled Date</h3>
                <p className="text-sm mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(selectedJobForSheet.scheduledDate)}
                </p>
              </div>
            )}

            {selectedJobForSheet.users && selectedJobForSheet.users.length > 0 && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Assigned Users</h3>
                <div className="mt-2 space-y-2">
                  {selectedJobForSheet.users.map((user) => (
                    <div key={user.userId} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                      {user.completedAt && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                          Completed
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* View Job Dialog */}
      {selectedJob && (
        <Dialog
          open={showViewDialog}
          onOpenChange={(open) => {
            if (!open) setSelectedJob(null)
            setShowViewDialog(open)
          }}
        >
          <DialogContent className="max-w-2xl">
            <ViewJobDialog
              job={selectedJob}
              currentUser={user}
              onEdit={() => {
                setShowViewDialog(false)
                setShowEditDialog(true)
              }}
            />
          </DialogContent>
        </Dialog>
      )
      }

      {/* Edit Job Dialog */}
      {selectedJob && (
        <Dialog
          open={showEditDialog}
          onOpenChange={(open) => {
            if (!open) setSelectedJob(null)
            setShowEditDialog(open)
          }}
        >
          <DialogContent className="max-w-2xl">
            <EditJobDialog job={selectedJob} onJobUpdated={handleJobUpdated} currentUser={user} />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}