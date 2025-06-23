"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Star } from "lucide-react"

const technicians = [
  { id: "1", name: "Emeka Okafor", email: "tech1@demo.com" },
  { id: "2", name: "Adebayo Adeyemi", email: "tech2@demo.com" },
  { id: "3", name: "Fatima Ibrahim", email: "tech3@demo.com" },
  { id: "4", name: "Chinedu Okwu", email: "tech4@demo.com" },
]

const jobs = [
  { id: "1", title: "Solar Panel Installation - Residential Lagos", type: "Solar Installation", value: 750000 },
  { id: "2", title: "Quarterly Maintenance Check - Abuja", type: "Maintenance Check", value: 85000 },
  { id: "3", title: "Emergency Inverter Repair - Port Harcourt", type: "Emergency Call", value: 180000 },
  { id: "4", title: "System Inspection - Commercial", type: "System Inspection", value: 120000 },
]

interface AddAccruedValueDialogProps {
  onValueAdded: (value: any) => void
}

export default function AddAccruedValueDialog({ onValueAdded }: AddAccruedValueDialogProps) {
  const [formData, setFormData] = useState({
    technicianId: "",
    jobId: "",
    sharePercentage: "",
    rating: "5",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const selectedTechnician = technicians.find((t) => t.id === formData.technicianId)
      const selectedJob = jobs.find((j) => j.id === formData.jobId)

      if (!selectedTechnician || !selectedJob) {
        setError("Please select both technician and job")
        setLoading(false)
        return
      }

      const sharePercentage = Number(formData.sharePercentage)
      const jobValue = selectedJob.value
      const earnedAmount = (jobValue * sharePercentage) / 100

      const newValue = {
        technician: selectedTechnician,
        job: selectedJob,
        sharePercentage,
        jobValue,
        earnedAmount,
        rating: Number(formData.rating),
        month: formData.month,
        year: formData.year,
        createdAt: new Date().toISOString(),
      }

      setTimeout(() => {
        onValueAdded(newValue)
        setLoading(false)
      }, 1000)
    } catch (error) {
      setError("Failed to add accrued value")
      setLoading(false)
    }
  }

  const selectedJob = jobs.find((j) => j.id === formData.jobId)
  const calculatedEarning =
    selectedJob && formData.sharePercentage ? (selectedJob.value * Number(formData.sharePercentage)) / 100 : 0

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Accrued Value</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="technicianId">Technician *</Label>
            <Select
              value={formData.technicianId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, technicianId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobId">Job *</Label>
            <Select
              value={formData.jobId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, jobId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedJob && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Job Value: {formatNaira(selectedJob.value)}</p>
            <p className="text-sm text-muted-foreground">{selectedJob.type}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sharePercentage">Share Percentage *</Label>
            <Input
              id="sharePercentage"
              type="number"
              min="0"
              max="100"
              value={formData.sharePercentage}
              onChange={(e) => setFormData((prev) => ({ ...prev, sharePercentage: e.target.value }))}
              placeholder="60"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Calculated Earning</Label>
            <div className="p-2 bg-green-50 rounded border">
              <span className="font-bold text-green-700">{formatNaira(calculatedEarning)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rating">Performance Rating</Label>
          <Select
            value={formData.rating}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, rating: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span>Excellent (5.0)</span>
                </div>
              </SelectItem>
              <SelectItem value="4">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <Star className="h-4 w-4 text-gray-300" />
                  </div>
                  <span>Good (4.0)</span>
                </div>
              </SelectItem>
              <SelectItem value="3">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    {[4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 text-gray-300" />
                    ))}
                  </div>
                  <span>Average (3.0)</span>
                </div>
              </SelectItem>
              <SelectItem value="2">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    {[3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 text-gray-300" />
                    ))}
                  </div>
                  <span>Below Average (2.0)</span>
                </div>
              </SelectItem>
              <SelectItem value="1">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {[2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 text-gray-300" />
                    ))}
                  </div>
                  <span>Poor (1.0)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="month">Month</Label>
            <Select
              value={formData.month.toString()}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, month: Number(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December",
                ].map((month, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select
              value={formData.year.toString()}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, year: Number(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Accrued Value
          </Button>
        </div>
      </form>
    </>
  )
}
