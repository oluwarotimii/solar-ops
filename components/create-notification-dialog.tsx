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
import { Loader2 } from "lucide-react"

const recipients = [
  { id: "all", name: "All Users", email: "all@demo.com" },
  { id: "1", name: "Mike Johnson", email: "tech1@demo.com" },
  { id: "2", name: "David Smith", email: "tech2@demo.com" },
  { id: "3", name: "Lisa Wilson", email: "tech3@demo.com" },
  { id: "4", name: "Robert Brown", email: "tech4@demo.com" },
]

interface CreateNotificationDialogProps {
  onNotificationCreated: (notification: any) => void
}

export default function CreateNotificationDialog({ onNotificationCreated }: CreateNotificationDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "general",
    recipientId: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.title || !formData.message || !formData.recipientId) {
      setError("Please fill in all required fields")
      setLoading(false)
      return
    }

    try {
      const selectedRecipient = recipients.find((r) => r.id === formData.recipientId)

      const newNotification = {
        ...formData,
        recipient: selectedRecipient,
        sender: { id: "admin", name: "Admin User" },
        createdAt: new Date().toISOString(),
      }

      setTimeout(() => {
        onNotificationCreated(newNotification)
        setLoading(false)
      }, 1000)
    } catch (error) {
      setError("Failed to send notification")
      setLoading(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Send Notification</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            required
            placeholder="Notification title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message *</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
            required
            rows={4}
            placeholder="Notification message"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="job_assignment">Job Assignment</SelectItem>
                <SelectItem value="maintenance_reminder">Maintenance Reminder</SelectItem>
                <SelectItem value="admin_message">Admin Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientId">Recipient *</Label>
            <Select
              value={formData.recipientId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, recipientId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {recipients.map((recipient) => (
                  <SelectItem key={recipient.id} value={recipient.id}>
                    {recipient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Notification
          </Button>
        </div>
      </form>
    </>
  )
}
