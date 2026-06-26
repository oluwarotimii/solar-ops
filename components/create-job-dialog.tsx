'use client'

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2, User } from "lucide-react"

interface CreateJobDialogProps {
  onJobCreated: (job: any) => void
}

// Add a unique client-side ID for stable keying
interface JobUser {
  clientId: number;
  userId: string;
  role: "lead" | "assistant" | "specialist";
}

export default function CreateJobDialog({ onJobCreated }: CreateJobDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    jobTypeId: "",
    priority: "medium",
    locationAddress: "",
    scheduledDate: "",
    scheduledTime: "",
    estimatedDuration: "",
    jobValue: "",
    instructions: "",
    referrerId: "",
  })

  const [assignedUsers, setAssignedUsers] = useState<JobUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [jobTypes, setJobTypes] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    const fetchJobTypes = async () => {
      try {
        const response = await fetch("/api/job-types");
        if (response.ok) setJobTypes(await response.json());
      } catch (error) {
        console.error("Error fetching job types:", error);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users/all");
        if (response.ok) setUsers(await response.json());
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchJobTypes();
    fetchUsers();
  }, []);

  const addUser = () => {
    setAssignedUsers(prev => [
      ...prev,
      {
        clientId: Date.now(), // Use a simple unique ID
        userId: "",
        role: "assistant",
      },
    ])
  }

  const updateUser = (clientId: number, field: keyof Omit<JobUser, 'clientId'>, value: any) => {
    setAssignedUsers(prev => 
      prev.map(user => 
        user.clientId === clientId ? { ...user, [field]: value } : user
      )
    );
  }

  const removeUser = (clientId: number) => {
    setAssignedUsers(prev => prev.filter(user => user.clientId !== clientId));
  }

  const getAvailableUsers = (currentClientId: number) => {
    const selectedIds = assignedUsers
      .map(user => (user.clientId !== currentClientId ? user.userId : null))
      .filter(Boolean)
    return users.filter(user => !selectedIds.includes(user.id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (assignedUsers.some(t => !t.userId)) {
      setError("Please select a user for each role.");
      setLoading(false);
      return;
    }
    const userIds = assignedUsers.map(t => t.userId);
    if (new Set(userIds).size !== userIds.length) {
      setError("Cannot assign the same user multiple times.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          referrerId: formData.referrerId === "none" ? null : (formData.referrerId || null),
          // Strip clientId before sending to backend
          assignedUsers: assignedUsers.map(({ clientId, ...rest }) => rest),
          estimatedDuration: Number.parseInt(formData.estimatedDuration) || 0,
        }),
      });

      if (response.ok) {
        const newJob = await response.json();
        onJobCreated(newJob);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create job");
      }
    } catch (error) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DialogHeader><DialogTitle>Create New Job</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-4">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        
        <Card>
          <CardHeader><CardTitle className="text-lg">Job Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Solar Panel Installation" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTypeId">Job Type *</Label>
                <Select value={formData.jobTypeId} onValueChange={(value) => setFormData({ ...formData, jobTypeId: value })} required>
                  <SelectTrigger><SelectValue placeholder="Select job type" /></SelectTrigger>
                  <SelectContent>
                    {jobTypes.map(jt => <SelectItem key={jt.id} value={jt.id}>{jt.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Briefly describe the job" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationAddress">Location / Address *</Label>
                <Input id="locationAddress" value={formData.locationAddress} onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })} placeholder="e.g., 123 Main St, Anytown, USA" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="referrerId">Referred By</Label>
                <Select value={formData.referrerId} onValueChange={(value) => setFormData({ ...formData, referrerId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select referrer (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                <Input id="scheduledDate" type="date" value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Scheduled Time</Label>
                <Input id="scheduledTime" type="time" value={formData.scheduledTime} onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })} />
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="estimatedDuration">Estimated Duration (hours)</Label>
                <Input id="estimatedDuration" type="number" value={formData.estimatedDuration} onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })} placeholder="e.g., 4" />
              </div> */}
              <div className="space-y-2">
                <Label htmlFor="jobValue">Job Value ($)</Label>
                <Input id="jobValue" type="number" value={formData.jobValue} onChange={(e) => setFormData({ ...formData, jobValue: parseFloat(e.target.value) || 0 })} placeholder="e.g., 1500.00" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="instructions">Special Instructions</Label>
                <Textarea id="instructions" value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} placeholder="e.g., Key is under the mat" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Assign Users</CardTitle>
              <Button type="button" variant="outline" onClick={addUser}><Plus className="mr-2 h-4 w-4" />Add</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedUsers.map((user, index) => (
              <div key={user.clientId} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">User Slot {index + 1}</h4>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeUser(user.clientId)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>User *</Label>
                    <Select value={user.userId} onValueChange={(value) => updateUser(user.clientId, "userId", value)}>
                      <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                      <SelectContent>
                        {getAvailableUsers(user.clientId).map(u => <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={user.role} onValueChange={(value) => updateUser(user.clientId, "role", value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="assistant">Assistant</SelectItem>
                        <SelectItem value="specialist">Specialist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Job...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Job
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  )
}
