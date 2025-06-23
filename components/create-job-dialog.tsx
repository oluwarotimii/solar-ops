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

const jobTypes = [
  { id: "1", name: "Solar Installation", color: "#10B981", defaultPercentage: 60 },
  { id: "2", name: "Maintenance Check", color: "#F59E0B", defaultPercentage: 70 },
  { id: "3", name: "Repair Service", color: "#EF4444", defaultPercentage: 65 },
  { id: "4", name: "System Inspection", color: "#3B82F6", defaultPercentage: 55 },
  { id: "5", name: "Emergency Call", color: "#DC2626", defaultPercentage: 70 },
]

const technicians = [
  { id: "1", firstName: "Emeka", lastName: "Okafor" },
  { id: "2", firstName: "Adebayo", lastName: "Adeyemi" },
  { id: "3", firstName: "Fatima", lastName: "Ibrahim" },
  { id: "4", firstName: "Chinedu", lastName: "Okwu" },
]

interface JobTechnician {
  technicianId: string
  sharePercentage: number
  role: "lead" | "assistant" | "specialist"
}

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
  }, [formData.jobTypeId])

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

    const totalShare = getTotalShare()
    if (totalShare !== 100) {
      setError(`Total share percentage must equal 100% (currently ${totalShare}%)`)
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
      const selectedJobType = jobTypes.find((jt) => jt.id === formData.jobTypeId)

      // Build technicians array with full details
      const technicianDetails = assignedTechnicians.map((tech) => {
        const techInfo = technicians.find((t) => t.id === tech.technicianId)
        return {
          ...tech,
          technician: techInfo,
        }
      })

      const newJob = {
        ...formData,
        jobType: selectedJobType,
        technicians: technicianDetails,
        status: "assigned" as const,
        jobValue: Number.parseFloat(formData.jobValue) || 0,
        estimatedDuration: Number.parseInt(formData.estimatedDuration) || 0,
        totalTechnicianShare: totalShare,
      }

      setTimeout(() => {
        onJobCreated(newJob)
        setLoading(false)
      }, 1000)
    } catch (error) {
      setError("Failed to create job")
      setLoading(false)
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
                  Total Share: {getTotalShare()}%
                  {getTotalShare() !== 100 && <span className="text-red-500 ml-2">(Must equal 100%)</span>}
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
          <Button type="submit" disabled={loading || getTotalShare() !== 100}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Job
          </Button>
        </div>
      </form>
    </>
  )
}
