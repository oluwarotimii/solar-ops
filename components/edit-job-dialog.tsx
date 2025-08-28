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

interface EditJobDialogProps {
  job: any;
  onJobUpdated: (job: any) => void;
  currentUser: any;
}

interface JobTechnician {
  clientId: number;
  technicianId: string;
  role: "lead" | "assistant" | "specialist";
}

export default function EditJobDialog({ job, onJobUpdated, currentUser }: EditJobDialogProps) {
  const [formData, setFormData] = useState({
    title: job.title || "",
    description: job.description || "",
    jobTypeId: job.jobType?.id || "",
    priority: job.priority || "medium",
    locationAddress: job.locationAddress || "",
    scheduledDate: job.scheduledDate ? new Date(job.scheduledDate).toISOString().split('T')[0] : "",
    scheduledTime: job.scheduledTime ? String(job.scheduledTime) : "",
    estimatedDuration: job.estimatedDuration || "",
    jobValue: job.jobValue || "",
    instructions: job.instructions || "",
  });

  const [assignedTechnicians, setAssignedTechnicians] = useState<JobTechnician[]>(
    job.technicians?.map((t: any) => ({ ...t, clientId: Math.random() })) || []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobTypes, setJobTypes] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);

  useEffect(() => {
    const fetchJobTypes = async () => {
      try {
        const response = await fetch("/api/job-types");
        if (response.ok) setJobTypes(await response.json());
      } catch (error) { console.error("Error fetching job types:", error); }
    };
    const fetchTechnicians = async () => {
      try {
        const response = await fetch("/api/users/technicians");
        if (response.ok) setTechnicians(await response.json());
      } catch (error) { console.error("Error fetching technicians:", error); }
    };
    fetchJobTypes();
    fetchTechnicians();
  }, []);

  const addTechnician = () => {
    setAssignedTechnicians(prev => [
      ...prev,
      { clientId: Date.now(), technicianId: "", role: "assistant" },
    ]);
  };

  const updateTechnician = (clientId: number, field: keyof Omit<JobTechnician, 'clientId'>, value: any) => {
    setAssignedTechnicians(prev =>
      prev.map(tech => (tech.clientId === clientId ? { ...tech, [field]: value } : tech))
    );
  };

  const removeTechnician = (clientId: number) => {
    setAssignedTechnicians(prev => prev.filter(tech => tech.clientId !== clientId));
  };

  const getAvailableTechnicians = (currentTechnicianId: string) => {
    const allSelectedIds = assignedTechnicians.map(tech => tech.technicianId);
    return technicians.filter(tech => tech.id === currentTechnicianId || !allSelectedIds.includes(tech.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (assignedTechnicians.some(t => !t.technicianId)) {
      setError("Please select a technician for each role.");
      setLoading(false);
      return;
    }
    const techIds = assignedTechnicians.map(t => t.technicianId);
    if (new Set(techIds).size !== techIds.length) {
      setError("Cannot assign the same technician multiple times.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          assignedTechnicians: assignedTechnicians.map(({ clientId, ...rest }) => rest),
          jobValue: Number.parseFloat(String(formData.jobValue)) || 0,
          estimatedDuration: Number.parseInt(String(formData.estimatedDuration)) || 0,
        }),
      });

      if (response.ok) {
        onJobUpdated(await response.json());
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update job");
      }
    } catch (error) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogHeader><DialogTitle>Edit Job</DialogTitle></DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto p-4">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        
        <Card>
          <CardHeader><CardTitle className="text-lg">Job Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTypeId">Job Type *</Label>
                <Select value={formData.jobTypeId} onValueChange={(value) => setFormData(prev => ({ ...prev, jobTypeId: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select job type" /></SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationAddress">Location Address *</Label>
              <Input id="locationAddress" value={formData.locationAddress} onChange={(e) => setFormData(prev => ({ ...prev, locationAddress: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input id="scheduledDate" type="date" value={formData.scheduledDate} onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledTime">Scheduled Time</Label>
                <Input id="scheduledTime" type="time" value={formData.scheduledTime} onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))} />
              </div>
            </div>
             {/* <div className="space-y-2">
              <Label htmlFor="estimatedDuration">Duration (minutes)</Label>
              <Input id="estimatedDuration" type="number" value={formData.estimatedDuration} onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))} />
            </div> */}
            <div className="space-y-2">
              <Label htmlFor="jobValue">Job Value (NGN)</Label>
              <Input id="jobValue" type="number" value={formData.jobValue} onChange={(e) => setFormData(prev => ({ ...prev, jobValue: e.target.value }))} readOnly={!currentUser?.role?.isAdmin} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Assign Technicians</CardTitle>
              <Button type="button" variant="outline" onClick={addTechnician}><Plus className="mr-2 h-4 w-4" />Add</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedTechnicians.map((tech, index) => (
              <div key={tech.clientId} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Technician Slot {index + 1}</h4>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeTechnician(tech.clientId)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Technician *</Label>
                    <Select value={tech.technicianId} onValueChange={(value) => updateTechnician(tech.clientId, "technicianId", value)}>
                      <SelectTrigger><SelectValue placeholder="Select technician" /></SelectTrigger>
                      <SelectContent>
                        {getAvailableTechnicians(tech.technicianId).map(t => <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={tech.role} onValueChange={(value) => updateTechnician(tech.clientId, "role", value)}>
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
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
          </Button>
        </div>
      </form>
    </>
  );
}