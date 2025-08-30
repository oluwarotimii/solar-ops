import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNaira } from "@/lib/utils";
import { formatDate } from "@/lib/date-utils";
import { MapPin, Calendar, User, Clock, DollarSign, FileText } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description?: string;
  jobType: { name: string; color: string };
  technicians?: Array<{ technicianId: string; firstName: string; lastName: string; role: string; }>;
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  locationAddress: string;
  scheduledDate?: string | Date | null;
  
  estimatedDuration?: number;
  instructions?: string;
  completedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ViewJobDialogProps {
  job: Job;
}

const statusColors = {
  assigned: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export default function ViewJobDialog({ job }: ViewJobDialogProps) {
  return (
    <div className="max-h-[80vh] overflow-y-auto p-4">
      <DialogHeader className="mb-4">
        <DialogTitle className="text-2xl font-bold">{job.title}</DialogTitle>
        <DialogDescription>{job.description || "No description provided."}</DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Job Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Job Type</p>
              <Badge
                variant="outline"
                style={{
                  backgroundColor: job.jobType.color + "20",
                  color: job.jobType.color,
                }}
              >
                {job.jobType.name}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={statusColors[job.status]}>{job.status.replace("_", " ")}</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Priority</p>
              <Badge className={priorityColors[job.priority]} variant="outline">
                {job.priority}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Job Value</p>
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatNaira(job.jobValue)}</span>
              </div>
            </div>

            <div className="space-y-2 col-span-full">
              <p className="text-sm text-muted-foreground">Location</p>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{job.locationAddress}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling & Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scheduling & Assignment</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Scheduled Date</p>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{job.scheduledDate ? formatDate(job.scheduledDate) : "Not scheduled"}</span>
              </div>
            </div>

            {/* <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Estimated Duration</p>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{job.estimatedDuration ? `${job.estimatedDuration} minutes` : "N/A"}</span>
              </div>
            </div> */}

            <div className="space-y-2 col-span-full">
              <p className="text-sm text-muted-foreground">Assigned Technicians</p>
              {job.technicians && job.technicians.length > 0 ? (
                job.technicians.map(tech => (
                  <div key={tech.technicianId} className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{tech.firstName} {tech.lastName}</span>
                    {tech.role === 'lead' && <Badge variant="secondary">Lead</Badge>}
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Unassigned</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        {job.instructions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                <p className="text-sm text-muted-foreground">{job.instructions}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timestamps</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Created At</p>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(job.createdAt)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formatDate(job.updatedAt)}</span>
              </div>
            </div>
            {job.completedAt && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Completed At</p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(job.completedAt)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
