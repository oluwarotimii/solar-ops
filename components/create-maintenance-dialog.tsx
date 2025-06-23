"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import type { User } from "@/types"

interface CreateMaintenanceDialogProps {
  technicians: User[]
  onTaskCreated: () => void
}

export default function CreateMaintenanceDialog({ technicians, onTaskCreated }: CreateMaintenanceDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    siteLocation: "",
    assignedTo: "",
    priority: "medium",
    scheduledDate: "",
    isRecurring: false,
    recurrenceType: "monthly",
    recurrenceInterval: "1",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const payload = {
        ...formData,
        recurrenceType: formData.isRecurring ? formData.recurrenceType : null,
        recurrenceInterval: formData.isRecurring ? Number(formData.recurrenceInterval) : null,
        assignedTo: formData.assignedTo || null,
      }

      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onTaskCreated()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create maintenance task")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Maintenance Task</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Task Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
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

        <div className="space-y-2">
          <Label htmlFor="siteLocation">Site Location *</Label>
          <Input
            id="siteLocation"
            value={formData.siteLocation}
            onChange={(e) => setFormData((prev) => ({ ...prev, siteLocation: e.target.value }))}
            required
            placeholder="123 Main St, City, State ZIP"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign Technician</Label>
            <Select
              value={formData.assignedTo}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, assignedTo: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.firstName} {tech.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Scheduled Date *</Label>
          <Input
            id="scheduledDate"
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))}
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isRecurring"
            checked={formData.isRecurring}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isRecurring: !!checked }))}
          />
          <Label htmlFor="isRecurring">This is a recurring task</Label>
        </div>

        {formData.isRecurring && (
          <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-muted">
            <div className="space-y-2">
              <Label htmlFor="recurrenceType">Recurrence Type</Label>
              <Select
                value={formData.recurrenceType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, recurrenceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrenceInterval">Every</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="recurrenceInterval"
                  type="number"
                  min="1"
                  value={formData.recurrenceInterval}
                  onChange={(e) => setFormData((prev) => ({ ...prev, recurrenceInterval: e.target.value }))}
                  className="w-20"
                />
                <span>
                  {formData.recurrenceType}
                  {Number(formData.recurrenceInterval) > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Task
          </Button>
        </div>
      </form>
    </>
  )
}
