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
    baseValue: "",
    defaultPercentage: "60",
    color: "#10B981",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const formatNaira = (amount: string) => {
    const num = Number.parseFloat(amount.replace(/[^\d.]/g, ""))
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

    if (!formData.name || !formData.baseValue || !formData.defaultPercentage) {
      setError("Please fill in all required fields")
      setLoading(false)
      return
    }

    const baseValue = Number.parseFloat(formData.baseValue.replace(/[^\d.]/g, ""))
    const defaultPercentage = Number.parseFloat(formData.defaultPercentage)

    if (isNaN(baseValue) || baseValue <= 0) {
      setError("Please enter a valid base value")
      setLoading(false)
      return
    }

    if (isNaN(defaultPercentage) || defaultPercentage < 0 || defaultPercentage > 100) {
      setError("Please enter a valid percentage (0-100)")
      setLoading(false)
      return
    }

    try {
      const newJobType = {
        name: formData.name,
        description: formData.description,
        baseValue: baseValue,
        defaultPercentage: defaultPercentage,
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="baseValue">Base Value (₦) *</Label>
            <Input
              id="baseValue"
              value={formData.baseValue}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d.]/g, "")
                setFormData((prev) => ({ ...prev, baseValue: value }))
              }}
              required
              placeholder="250000"
            />
            {formData.baseValue && <p className="text-xs text-muted-foreground">{formatNaira(formData.baseValue)}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultPercentage">Default Technician Share (%) *</Label>
            <Input
              id="defaultPercentage"
              type="number"
              min="0"
              max="100"
              value={formData.defaultPercentage}
              onChange={(e) => setFormData((prev) => ({ ...prev, defaultPercentage: e.target.value }))}
              required
              placeholder="60"
            />
          </div>
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
