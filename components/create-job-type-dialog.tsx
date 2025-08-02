"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface CreateJobTypeDialogProps {
  onJobTypeCreated: (jobType: any) => void
}

export default function CreateJobTypeDialog({ onJobTypeCreated }: CreateJobTypeDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#10B981",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.name) {
      setError("Please fill in all required fields")
      setLoading(false)
      return
    }

    try {
      const newJobType = {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        createdAt: new Date().toISOString(),
      }

      setTimeout(() => {
        onJobTypeCreated(newJobType)
        setLoading(false)
      }, 1000)
    } catch (error) {
      setError("Failed to create job type")
      setLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Job Type</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Job Type Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
            placeholder="e.g., Solar Panel Cleaning"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            rows={3}
            placeholder="Brief description of this job type"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
              className="w-16 h-10"
            />
            <Input
              value={formData.color}
              onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
              placeholder="#10B981"
              className="flex-1"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Job Type
          </Button>
        </div>
      </form>
    </>
  )
}