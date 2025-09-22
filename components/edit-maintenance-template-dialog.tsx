"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import type { User, MaintenanceTemplate } from "@/types"

interface EditMaintenanceTemplateDialogProps {
  template: MaintenanceTemplate;
  users: User[];
  onTemplateUpdated: () => void;
}

export default function EditMaintenanceTemplateDialog({ template, users, onTemplateUpdated }: EditMaintenanceTemplateDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    siteLocation: "",
    jobValue: "",
    assignedTo: "",
    recurrenceType: "monthly",
    recurrenceInterval: "1",
    dayOfWeek: "1",
    dayOfMonth: "1",
    monthOfYear: "1",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title || "",
        description: template.description || "",
        siteLocation: template.siteLocation || "",
        jobValue: String(template.jobValue || ""),
        assignedTo: template.assignedTo || undefined, // Use undefined instead of empty string
        recurrenceType: template.recurrenceType || "monthly",
        recurrenceInterval: String(template.recurrenceInterval || "1"),
        dayOfWeek: String(template.dayOfWeek !== null && template.dayOfWeek !== undefined ? template.dayOfWeek : "1"),
        dayOfMonth: String(template.dayOfMonth !== null && template.dayOfMonth !== undefined ? template.dayOfMonth : "1"),
        monthOfYear: String(template.monthOfYear !== null && template.monthOfYear !== undefined ? template.monthOfYear : "1"),
        isActive: template.isActive !== undefined ? template.isActive : true,
      });
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        recurrenceInterval: Number(formData.recurrenceInterval),
        jobValue: Number(formData.jobValue) || 0,
        assignedTo: formData.assignedTo || null, // This should work correctly now
        day_of_week: formData.recurrenceType === 'weekly' ? Number(formData.dayOfWeek) : null,
        day_of_month: formData.recurrenceType === 'monthly' ? Number(formData.dayOfMonth) : 
                     formData.recurrenceType === 'yearly' ? Number(formData.dayOfMonth) : null,
        month_of_year: formData.recurrenceType === 'yearly' ? Number(formData.monthOfYear) : null,
      };

      const response = await fetch(`/api/maintenance/templates/${template.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onTemplateUpdated();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update maintenance template");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Maintenance Template</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={loading} className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Template Title *</Label>
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
            <Label htmlFor="siteLocation">Site Location</Label>
            <Input
              id="siteLocation"
              value={formData.siteLocation}
              onChange={(e) => setFormData((prev) => ({ ...prev, siteLocation: e.target.value }))}
              placeholder="123 Main St, City, State ZIP"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobValue">Job Value</Label>
            <Input
              id="jobValue"
              type="number"
              value={formData.jobValue}
              onChange={(e) => setFormData((prev) => ({ ...prev, jobValue: e.target.value }))}
              placeholder="e.g., 75000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Default User</Label>
            <Select
              value={formData.assignedTo}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, assignedTo: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
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

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="recurrenceType">Repeat</Label>
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
                    {
                      formData.recurrenceType === 'daily' ? 'day' :
                      formData.recurrenceType === 'weekly' ? 'week' :
                      formData.recurrenceType === 'monthly' ? 'month' : 'year'
                    }
                    {Number(formData.recurrenceInterval) > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

          {formData.recurrenceType === 'weekly' && (
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <Select
                  value={formData.dayOfWeek}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, dayOfWeek: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          )}

          {formData.recurrenceType === 'monthly' && (
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="dayOfMonth">Day of Month</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dayOfMonth: e.target.value }))}
                  className="w-24"
                />
              </div>
          )}

          {formData.recurrenceType === 'yearly' && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="monthOfYear">Month</Label>
                  <Select
                    value={formData.monthOfYear}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, monthOfYear: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">January</SelectItem>
                      <SelectItem value="2">February</SelectItem>
                      <SelectItem value="3">March</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="5">May</SelectItem>
                      <SelectItem value="6">June</SelectItem>
                      <SelectItem value="7">July</SelectItem>
                      <SelectItem value="8">August</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                      <SelectItem value="10">October</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dayOfMonth">Day of Month</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dayOfMonth: e.target.value }))}
                    className="w-24"
                  />
                </div>
              </div>
          )}

          <div className="flex items-center space-x-2 border-t pt-4">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="isActive">Template is Active</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Template
            </Button>
          </div>
        </fieldset>
      </form>
    </>
  )
}
