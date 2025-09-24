"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";
import type { MaintenanceOccurrence, User } from "@/types";
import { Loader2 } from "lucide-react";

interface MaintenanceOccurrenceDetailsProps {
  occurrence: MaintenanceOccurrence;
  users: User[];
  onUpdate: (id: string, data: Partial<MaintenanceOccurrence>) => Promise<void>;
  currentUser: User | null;
}

export default function MaintenanceOccurrenceDetails({ occurrence, users, onUpdate, currentUser }: MaintenanceOccurrenceDetailsProps) {
  const [assignedTo, setAssignedTo] = useState(occurrence.assignedTo || "");
  const [status, setStatus] = useState(occurrence.status || "scheduled");
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = currentUser?.role?.isAdmin;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(occurrence.id, { assignedTo, status });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    setIsSaving(true);
    try {
      await onUpdate(occurrence.id, { status: "completed" });
    } finally {
      setIsSaving(false);
    }
  };

  const isCurrentMonth = () => {
    const today = new Date();
    const scheduledDate = new Date(occurrence.scheduledDate);
    return scheduledDate.getMonth() === today.getMonth() && scheduledDate.getFullYear() === today.getFullYear();
  };

  const canComplete = isCurrentMonth() && occurrence.status !== 'completed';
  console.log("MaintenanceOccurrenceDetails - canComplete:", canComplete, "occurrence.status:", occurrence.status);

  const statusColors = {
    scheduled: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    missed: "bg-red-100 text-red-800",
  }

  return (
    <div className="p-4 space-y-4">
      <fieldset disabled={isSaving} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{occurrence.template?.title}</CardTitle>
            <CardDescription>{occurrence.template?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Scheduled Date</p>
              <p>{formatDate(occurrence.scheduledDate)}</p>
            </div>
            {isAdmin ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="missed">Missed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned Technician</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <div>
                  <p className="font-medium">Status</p>
                  <Badge className={statusColors[occurrence.status]}>{occurrence.status.replace("_", " ")}</Badge>
                </div>
                <div>
                  <p className="font-medium">Assigned To</p>
                  <p>{occurrence.assignedUser?.firstName} {occurrence.assignedUser?.lastName}</p>
                </div>
              </>
            )}
            <Button onClick={handleMarkComplete} disabled={!canComplete || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark as Completed
            </Button>
            {!isCurrentMonth() && occurrence.status !== 'completed' && (
              <p className="text-sm text-red-500">This task cannot be completed until the scheduled month.</p>
            )}
          </CardContent>
        </Card>
      </fieldset>
    </div>
  );
}