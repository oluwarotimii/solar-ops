
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";
import type { MaintenanceOccurrence, User } from "@/types";

interface MaintenanceOccurrenceDetailsProps {
  occurrence: MaintenanceOccurrence;
  users: User[];
  onUpdate: (id: string, data: Partial<MaintenanceOccurrence>) => void;
}

export default function MaintenanceOccurrenceDetails({ occurrence, users, onUpdate }: MaintenanceOccurrenceDetailsProps) {
  const [assignedTo, setAssignedTo] = useState(occurrence.assignedTo || "");
  const [status, setStatus] = useState(occurrence.status || "scheduled");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    onUpdate(occurrence.id, { assignedTo, status });
    setIsSaving(false);
  };

  const statusColors = {
    scheduled: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    missed: "bg-red-100 text-red-800",
  }

  return (
    <div className="p-4 space-y-4">
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
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
