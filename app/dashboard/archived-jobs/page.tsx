"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Archive, MapPin, Calendar, User, RotateCcw } from "lucide-react"
import { formatDate } from "@/lib/date-utils"
import ViewJobDialog from "@/components/view-job-dialog"
import { useToast } from "@/components/ui/use-toast"
import { MonetaryValue } from "@/components/ui/monetary-value"
import MobileTableCard from "@/components/mobile-table-card"
import BottomSheet from "@/components/bottom-sheet"

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
  archivedAt?: string
}

export default function ArchivedJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedJobForSheet, setSelectedJobForSheet] = useState<Job | null>(null)
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)
  const [jobsPerPage] = useState(12)
  const { toast } = useToast()

  const fetchArchivedJobs = async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/jobs/archived?page=${page}&limit=${jobsPerPage}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch archived jobs.")
      }
      const data = await response.json()
      setJobs(data.jobs)
      setTotalJobs(data.total)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching archived jobs.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }
    fetchArchivedJobs(currentPage)
  }, [currentPage])

  const handleReopenJob = async (jobId: string) => {
    if (
      !confirm("Are you sure you want to re-open this archived job? This will unarchive it and reset the completion status for all technicians.")
    )
      return
    try {
      const response = await fetch(`/api/jobs/archived`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })
      if (!response.ok) throw new Error((await response.json()).error || "Failed to re-open job.")
      toast({ title: "Success", description: "Job has been re-opened and unarchived." })
      fetchArchivedJobs(currentPage)
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
        return "bg-yellow-100 text-yellow-800"
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800"
      case "medium":
        return "bg-blue-100 text-blue-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "urgent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Archived Jobs</h1>
          <p className="text-muted-foreground">Completed jobs that have been archived</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Archived Jobs ({totalJobs})</CardTitle>
          <CardDescription>All completed jobs that have been archived for organization.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading archived jobs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p className="text-sm">Error: {error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No archived jobs</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Completed jobs will appear here once they are automatically archived.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Archived Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => {
                      const isUserAdmin = currentUser?.role?.isAdmin

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
                          <td className="md:table-cell py-2" data-label="Archived Date">
                            {job.archivedAt ? formatDate(job.archivedAt) : "Not set"}
                          </td>
                          <td className="md:table-cell py-2 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2 mt-2 md:mt-0">
                              {isUserAdmin && (
                                <Button variant="outline" size="sm" onClick={(e) => {
                                  e.stopPropagation();
                                  handleReopenJob(job.id);
                                }}>
                                  <RotateCcw className="h-4 w-4 mr-2" /> Re-open
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {jobs.map((job) => {
                  const isUserAdmin = currentUser?.role?.isAdmin

                  return (
                    <MobileTableCard
                      key={job.id}
                      title={job.title}
                      subtitle={job.locationAddress}
                      status={job.status}
                      statusColor={getStatusColor(job.status)}
                      badges={[
                        { label: job.priority, variant: "outline" },
                        { label: job.archivedAt ? formatDate(job.archivedAt) : "Not archived", variant: "secondary" },
                      ]}
                      onClick={() => handleJobCardClick(job)}
                    />
                  )
                })}
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
                  Page {currentPage} of {Math.ceil(totalJobs / jobsPerPage)}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * jobsPerPage >= totalJobs}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bottom Sheet for Mobile */}
      <BottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title={selectedJobForSheet?.title || "Job Details"}
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
                <MonetaryValue value={selectedJobForSheet.jobValue} className="text-sm mt-1 font-medium" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Priority</h3>
                <Badge className={cn("mt-1", getPriorityColor(selectedJobForSheet.priority))}>
                  {selectedJobForSheet.priority}
                </Badge>
              </div>
            </div>

            {selectedJobForSheet.archivedAt && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Archived Date</h3>
                <p className="text-sm mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(selectedJobForSheet.archivedAt)}
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
              currentUser={currentUser}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}