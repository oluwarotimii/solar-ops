'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, MapPin, Calendar, User, Edit, Trash2, Loader2, AlertCircle, CheckSquare, RotateCcw } from "lucide-react"
import { formatDate } from "@/lib/date-utils";
import CreateJobDialog from "@/components/create-job-dialog";
import EditJobDialog from "@/components/edit-job-dialog";
import ViewJobDialog from "@/components/view-job-dialog";
import { useToast } from "@/components/ui/use-toast"

// ... (interfaces and color constants remain the same)
interface Technician {
  technicianId: string;
  role: "lead" | "assistant" | "specialist";
  firstName: string;
  lastName: string;
  completedAt: string | null;
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
  estimatedDuration: number
  technicians?: Technician[]
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
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { toast } = useToast();

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
      if (!response.ok) throw new Error("Failed to fetch job types.")
      const data = await response.json()
      setJobTypes(data)
    } catch (error) {
      console.error("Failed to fetch job types:", error)
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    }
    fetchJobs()
    fetchJobTypes()
  }, [])

  const handleJobCreated = () => { fetchJobs(); setShowCreateDialog(false); };
  const handleJobUpdated = () => { fetchJobs(); setShowEditDialog(false); setSelectedJob(null); };

  const handleJobDelete = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to delete job.");
      toast({ title: "Success", description: "Job deleted successfully." });
      fetchJobs();
    } catch (err: any) { setError(err.message); }
  };

  const handleMarkComplete = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, { method: "PATCH" });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to mark as complete.");
      toast({ title: "Success", description: "Your work has been marked as complete." });
      fetchJobs();
    } catch (err: any) { setError(err.message); }
  };

  const handleReopenJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to re-open this job? This will reset the completion status for all technicians.")) return;
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "assigned" }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to re-open job.");
      toast({ title: "Success", description: "Job has been re-opened." });
      fetchJobs();
    } catch (err: any) { setError(err.message); }
  }

  const filteredJobs = jobs.filter(job => 
    (job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.locationAddress.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === "all" || job.status === statusFilter) &&
    (typeFilter === "all" || job.jobType.name === typeFilter)
  );

  return (
    <>
      {/* Header and Filters remain the same */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Jobs</h1>
            <p className="text-muted-foreground">Manage and track all field operations</p>
          </div>
          {currentUser?.role?.isAdmin && (
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

        <Card>
          <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search jobs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter by type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {jobTypes.map((type) => (<SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>))}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Technicians</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : error ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-red-500"><AlertCircle className="h-6 w-6 mx-auto" /><p className="mt-2">Error: {error}</p></TableCell></TableRow>
                  ) : filteredJobs.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">No jobs found.</TableCell></TableRow>
                  ) : (
                    filteredJobs.map((job) => {
                      const isUserAdmin = currentUser?.role?.isAdmin;
                      const isUserAssigned = job.technicians?.some(t => t.technicianId === currentUser?.id);
                      const technicianInfo = job.technicians?.find(t => t.technicianId === currentUser?.id);
                      const hasCompleted = !!technicianInfo?.completedAt;

                      return (
                        <TableRow 
                          key={job.id}
                          onClick={() => { setSelectedJob(job); setShowViewDialog(true); }}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell>
                            <div className="font-medium">{job.title}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{job.locationAddress}</div>
                          </TableCell>
                          <TableCell>
                            {job.technicians?.map(tech => (
                              <div key={tech.technicianId} className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4" />
                                <span>{tech.firstName} {tech.lastName}</span>
                                {tech.completedAt && <Badge variant="outline" className="bg-green-100 text-green-800">Done</Badge>}
                              </div>
                            ))}
                          </TableCell>
                          <TableCell><Badge>{job.status}</Badge></TableCell>
                          <TableCell><Badge variant="outline">{job.priority}</Badge></TableCell>
                          <TableCell>{job.scheduledDate ? formatDate(job.scheduledDate) : "Not set"}</TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              {isUserAdmin && job.status !== 'completed' && (
                                <Button variant="outline" size="sm" onClick={() => { setSelectedJob(job); setShowEditDialog(true); }}>
                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                </Button>
                              )}
                              {isUserAdmin && job.status === 'completed' && (
                                <Button variant="outline" size="sm" onClick={() => handleReopenJob(job.id)}>
                                  <RotateCcw className="h-4 w-4 mr-2" /> Re-open
                                </Button>
                              )}
                              {isUserAdmin && (
                                <Button variant="destructive" size="sm" onClick={() => handleJobDelete(job.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              {isUserAssigned && !isUserAdmin && (
                                <Button 
                                  variant={hasCompleted ? "secondary" : "default"}
                                  size="sm" 
                                  onClick={() => handleMarkComplete(job.id)}
                                  disabled={hasCompleted || job.status === 'completed'}
                                >
                                  <CheckSquare className="h-4 w-4 mr-2" />
                                  {hasCompleted ? "Completed" : "Mark as Complete"}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* View Job Dialog */}
      {selectedJob && (
        <Dialog open={showViewDialog} onOpenChange={(open) => { if (!open) setSelectedJob(null); setShowViewDialog(open); }}>
          <DialogContent className="max-w-2xl">
            <ViewJobDialog job={selectedJob} currentUser={currentUser} onEdit={() => { setShowViewDialog(false); setShowEditDialog(true); }} />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Job Dialog */}
      {selectedJob && (
        <Dialog open={showEditDialog} onOpenChange={(open) => { if (!open) setSelectedJob(null); setShowEditDialog(open); }}>
          <DialogContent className="max-w-2xl">
            <EditJobDialog job={selectedJob} onJobUpdated={handleJobUpdated} currentUser={currentUser} />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
