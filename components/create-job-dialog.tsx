"use client"

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

export default function CreateJobDialog({ onJobCreated }: CreateJobDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    jobTypeId: "",
    priority: "medium",
    locationAddress: "",
    locationLat: "",
    locationLng: "",
    scheduledDate: "",
    estimatedDuration: "",
    jobValue: "",
    instructions: "",
  })

  const [assignedTechnicians, setAssignedTechnicians] = useState<JobTechnician[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [jobTypes, setJobTypes] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])

  useEffect(() => {
    const fetchJobTypes = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/job-types", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setJobTypes(data);
        } else {
          console.error("Failed to fetch job types");
        }
      } catch (error) {
        console.error("Error fetching job types:", error);
      }
    };

    const fetchTechnicians = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/users/technicians", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setTechnicians(data);
        } else {
          console.error("Failed to fetch technicians");
        }
      } catch (error) {
        console.error("Error fetching technicians:", error);
      }
    };

    fetchJobTypes();
    fetchTechnicians();
  }, []);

  // Auto-populate technician shares when job type changes
  useEffect(() => {
    if (formData.jobTypeId && assignedTechnicians.length === 0) {
      const selectedJobType = jobTypes.find((jt) => jt.id === formData.jobTypeId)
      if (selectedJobType) {
        // Add one technician with default percentage
        setAssignedTechnicians([
          {
            technicianId: "",
            sharePercentage: selectedJobType.defaultPercentage,
            role: "lead",
          },
        ])
      }
    }
  }, [formData.jobTypeId, jobTypes])

  const addTechnician = () => {
    const selectedJobType = jobTypes.find((jt) => jt.id === formData.jobTypeId)
    const defaultPercentage = selectedJobType?.defaultPercentage || 50
    const currentTotal = getTotalShare()
    const remainingPercentage = Math.max(0, 100 - currentTotal)

    setAssignedTechnicians([
      ...assignedTechnicians,
      {
        technicianId: "",
        sharePercentage: Math.min(defaultPercentage, remainingPercentage),
        role: "assistant",
      },
    ])
  }

  const updateTechnician = (index: number, field: keyof JobTechnician, value: any) => {
    const updated = [...assignedTechnicians]
    updated[index] = { ...updated[index], [field]: value }
    setAssignedTechnicians(updated)
  }

  const removeTechnician = (index: number) => {
    setAssignedTechnicians(assignedTechnicians.filter((_, i) => i !== index))
  }

  const getTotalShare = () => {
    return assignedTechnicians.reduce((sum, tech) => sum + tech.sharePercentage, 0)
  }

  const getAvailableTechnicians = (currentIndex: number) => {
    const selectedIds = assignedTechnicians
      .map((tech, index) => (index !== currentIndex ? tech.technicianId : null))
      .filter(Boolean)
    return technicians.filter((tech) => !selectedIds.includes(tech.id))
  }

  const formatNaira = (amount: string) => {
    const num = Number(amount)
    if (isNaN(num)) return ""
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(num)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (assignedTechnicians.length === 0) {
      setError("Please assign at least one technician")
      setLoading(false)
      return
    }

    // Check for duplicate technicians
    const techIds = assignedTechnicians.map((t) => t.technicianId)
    if (new Set(techIds).size !== techIds.length) {
      setError("Cannot assign the same technician multiple times")
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          assignedTechnicians: assignedTechnicians,
          jobValue: Number.parseFloat(formData.jobValue) || 0,
          estimatedDuration: Number.parseInt(formData.estimatedDuration) || 0,
          totalTechnicianShare: totalShare,
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
      setError("Failed to create job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Job</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic Job Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTypeId">Job Type *</Label>
                <Select
                  value={formData.jobTypeId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, jobTypeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                          {type.name}
                          <Badge variant="outline" className="ml-2">
                            {type.defaultPercentage}%
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobValue">Job Value (₦) *</Label>
                <Input
                  id="jobValue"
                  type="number"
                  value={formData.jobValue}
                  onChange={(e) => setFormData((prev) => ({ ...prev, jobValue: e.target.value }))}
                  placeholder="500000"
                  required
                />
                {formData.jobValue && <p className="text-sm text-muted-foreground">{formatNaira(formData.jobValue)}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationAddress">Location Address *</Label>
              <Input
                id="locationAddress"
                value={formData.locationAddress}
                onChange={(e) => setFormData((prev) => ({ ...prev, locationAddress: e.target.value }))}
                required
                placeholder="123 Herbert Macaulay Way, Lagos"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedDuration">Duration (minutes)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData((prev) => ({ ...prev, estimatedDuration: e.target.value }))}
                  placeholder="240"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technician Assignment */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Assign Technicians</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Total Technician Share: {getTotalShare()}%
                  <span className="ml-4">Company Share: {100 - getTotalShare()}%</span>
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addTechnician}>
                <Plus className="mr-2 h-4 w-4" />
                Add Technician
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedTechnicians.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No technicians assigned yet</p>
                <p className="text-sm">Select a job type first, then add technicians</p>
              </div>
            ) : (
              assignedTechnicians.map((tech, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Technician {index + 1}</h4>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeTechnician(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Technician *</Label>
                      <Select
                        value={tech.technicianId}
                        onValueChange={(value) => updateTechnician(index, "technicianId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select technician" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableTechnicians(index).map((technician) => (
                            <SelectItem key={technician.id} value={technician.id}>
                              {technician.firstName} {technician.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={tech.role} onValueChange={(value) => updateTechnician(index, "role", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lead">Lead Technician</SelectItem>
                          <SelectItem value="assistant">Assistant</SelectItem>
                          <SelectItem value="specialist">Specialist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Share Percentage *</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={tech.sharePercentage}
                      onChange={(e) => updateTechnician(index, "sharePercentage", Number(e.target.value))}
                      placeholder="60"
                    />
                  </div>

                  {tech.technicianId && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {tech.role === "lead" && "👑 "}
                        {technicians.find((t) => t.id === tech.technicianId)?.firstName}{" "}
                        {technicians.find((t) => t.id === tech.technicianId)?.lastName}
                      </Badge>
                      <Badge variant="secondary">{tech.sharePercentage}% share</Badge>
                      {formData.jobValue && (
                        <Badge variant="outline">
                          {formatNaira(((Number(formData.jobValue) * tech.sharePercentage) / 100).toString())}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="space-y-2">
          <Label htmlFor="instructions">Special Instructions</Label>
          <Textarea
            id="instructions"
            value={formData.instructions}
            onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
            rows={3}
            placeholder="Any special instructions for the technicians..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Job
          </Button>
        </div>
      </form>
    </>
  )
}
