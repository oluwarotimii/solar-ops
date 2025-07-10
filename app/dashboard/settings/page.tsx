"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Settings, Bell, Shield, Database, Save, Plus, Trash2, Edit, Building, Loader2, AlertCircle } from "lucide-react"
import CreateJobTypeDialog from "@/components/create-job-type-dialog"

interface CompanySettings {
  name: string
  address: string
  phone: string
  email: string
  website: string
  logo: string
  timezone: string
  currency: string
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  jobAssignments: boolean
  maintenanceReminders: boolean
  systemAlerts: boolean
  weeklyReports: boolean
}

interface SystemSettings {
  autoAssignJobs: boolean
  requireGPSCheckin: boolean
  allowOfflineMode: boolean
  dataRetentionDays: number
  maxJobsPerTechnician: number
  defaultJobShare: number
}

interface JobType {
  id: string
  name: string
  baseValue: number
  defaultPercentage: number
  color: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company")
  const [loadingPage, setLoadingPage] = useState(true)
  const [loadingSave, setLoadingSave] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateJobType, setShowCreateJobType] = useState(false)

  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [jobTypes, setJobTypes] = useState<JobType[]>([])

  const fetchSettings = async () => {
    setLoadingPage(true)
    setError(null)
    try {
      const systemSettingsResponse = await fetch("/api/settings")
      if (!systemSettingsResponse.ok) {
        const errorData = await systemSettingsResponse.json()
        throw new Error(errorData.error || "Failed to fetch system settings.")
      }
      const systemSettingsData = await systemSettingsResponse.json()
      // Map fetched data to respective states
      setCompanySettings({
        name: systemSettingsData.companyName || "",
        address: systemSettingsData.companyAddress || "",
        phone: systemSettingsData.companyPhone || "",
        email: systemSettingsData.companyEmail || "",
        website: systemSettingsData.companyWebsite || "",
        logo: systemSettingsData.companyLogo || "",
        timezone: systemSettingsData.timezone || "",
        currency: systemSettingsData.currency || "",
      })
      setSystemSettings({
        autoAssignJobs: systemSettingsData.autoAssignJobs || false,
        requireGPSCheckin: systemSettingsData.requireGpsCheckin || false,
        allowOfflineMode: systemSettingsData.allowOfflineMode || false,
        dataRetentionDays: systemSettingsData.dataRetentionDays || 0,
        maxJobsPerTechnician: systemSettingsData.maxJobsPerTechnician || 0,
        defaultJobShare: systemSettingsData.defaultJobShare || 0,
      })
      // Assuming notification settings are also part of system settings or user settings
      setNotificationSettings({
        emailNotifications: systemSettingsData.emailNotifications || false,
        smsNotifications: systemSettingsData.smsNotifications || false,
        pushNotifications: systemSettingsData.pushNotifications || false,
        jobAssignments: systemSettingsData.jobAssignments || false,
        maintenanceReminders: systemSettingsData.maintenanceReminders || false,
        systemAlerts: systemSettingsData.systemAlerts || false,
        weeklyReports: systemSettingsData.weeklyReports || false,
      })

      // Fetch Job Types
      const jobTypesResponse = await fetch("/api/job-types")
      if (!jobTypesResponse.ok) {
        const errorData = await jobTypesResponse.json()
        throw new Error(errorData.error || "Failed to fetch job types.")
      }
      const jobTypesData = await jobTypesResponse.json()
      setJobTypes(jobTypesData)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching settings.")
    } finally {
      setLoadingPage(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setLoadingSave(true)
    setError(null)
    try {
      // Prepare data for saving (combine all settings into one payload if API supports it)
      const payload = {
        ...companySettings,
        ...notificationSettings,
        ...systemSettings,
      }

      const response = await fetch("/api/settings", {
        method: "PUT", // Or PATCH
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save settings.")
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while saving settings.")
    } finally {
      setLoadingSave(false)
    }
  }

  const handleJobTypeCreated = async (newJobType: any) => {
    try {
      const response = await fetch("/api/job-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newJobType),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create job type.")
      }

      setShowCreateJobType(false)
      fetchSettings() // Re-fetch all settings to update job types list
    } catch (err: any) {
      setError(err.message || "Error creating job type.")
    }
  }

  const removeJobType = async (id: string) => {
    try {
      const response = await fetch(`/api/job-types/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete job type.")
      }

      fetchSettings() // Re-fetch all settings to update job types list
    } catch (err: any) {
      setError(err.message || "Error deleting job type.")
    }
  }

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loadingPage) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="ml-2 text-lg">Loading settings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-600">
        <AlertCircle className="h-8 w-8 mr-2" />
        <p className="text-lg">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your system configuration and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={loadingSave}>
          <Save className="mr-2 h-4 w-4" />
          {loadingSave ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {saveSuccess && (
        <Alert>
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="job-types" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Job Types
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Update your company details and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companySettings?.name || ""}
                    onChange={(e) => setCompanySettings((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={companySettings?.website || ""}
                    onChange={(e) => setCompanySettings((prev) => (prev ? { ...prev, website: e.target.value } : null))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={companySettings?.address || ""}
                  onChange={(e) => setCompanySettings((prev) => (prev ? { ...prev, address: e.target.value } : null))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={companySettings?.phone || ""}
                    onChange={(e) => setCompanySettings((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                    placeholder="+234-XXX-XXX-XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companySettings?.email || ""}
                    onChange={(e) => setCompanySettings((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={companySettings?.timezone || ""}
                    onValueChange={(value) => setCompanySettings((prev) => (prev ? { ...prev, timezone: value } : null))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                      <SelectItem value="Africa/Abuja">Africa/Abuja (WAT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={companySettings?.currency || ""}
                    onValueChange={(value) => setCompanySettings((prev) => (prev ? { ...prev, currency: value } : null))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Notification Channels</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationSettings?.emailNotifications || false}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => (prev ? { ...prev, emailNotifications: checked } : null))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      checked={notificationSettings?.smsNotifications || false}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => (prev ? { ...prev, smsNotifications: checked } : null))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                    </div>
                    <Switch
                      checked={notificationSettings?.pushNotifications || false}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => (prev ? { ...prev, pushNotifications: checked } : null))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Job Assignments</Label>
                    <Switch
                      checked={notificationSettings?.jobAssignments || false}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => (prev ? { ...prev, jobAssignments: checked } : null))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Maintenance Reminders</Label>
                    <Switch
                      checked={notificationSettings?.maintenanceReminders || false}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => (prev ? { ...prev, maintenanceReminders: checked } : null))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>System Alerts</Label>
                    <Switch
                      checked={notificationSettings?.systemAlerts || false}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => (prev ? { ...prev, systemAlerts: checked } : null))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Weekly Reports</Label>
                    <Switch
                      checked={notificationSettings?.weeklyReports || false}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => (prev ? { ...prev, weeklyReports: checked } : null))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Configure system behavior and defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Job Management</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-assign Jobs</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically assign jobs to available technicians
                      </p>
                    </div>
                    <Switch
                      checked={systemSettings?.autoAssignJobs || false}
                      onCheckedChange={(checked) =>
                        setSystemSettings((prev) => (prev ? { ...prev, autoAssignJobs: checked } : null))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require GPS Check-in</Label>
                      <p className="text-sm text-muted-foreground">Require GPS verification for job site check-ins</p>
                    </div>
                    <Switch
                      checked={systemSettings?.requireGPSCheckin || false}
                      onCheckedChange={(checked) =>
                        setSystemSettings((prev) => (prev ? { ...prev, requireGPSCheckin: checked } : null))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Offline Mode</Label>
                      <p className="text-sm text-muted-foreground">Allow technicians to work offline</p>
                    </div>
                    <Switch
                      checked={systemSettings?.allowOfflineMode || false}
                      onCheckedChange={(checked) =>
                        setSystemSettings((prev) => (prev ? { ...prev, allowOfflineMode: checked } : null))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">System Limits</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataRetention">Data Retention (days)</Label>
                    <Input
                      id="dataRetention"
                      type="number"
                      value={systemSettings?.dataRetentionDays || 0}
                      onChange={(e) =>
                        setSystemSettings((prev) =>
                          prev ? { ...prev, dataRetentionDays: Number(e.target.value) } : null,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxJobs">Max Jobs per Technician</Label>
                    <Input
                      id="maxJobs"
                      type="number"
                      value={systemSettings?.maxJobsPerTechnician || 0}
                      onChange={(e) =>
                        setSystemSettings((prev) =>
                          prev ? { ...prev, maxJobsPerTechnician: Number(e.target.value) } : null,
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultShare">Default Technician Share (%)</Label>
                  <Input
                    id="defaultShare"
                    type="number"
                    min="0"
                    max="100"
                    value={systemSettings?.defaultJobShare || 0}
                    onChange={(e) =>
                      setSystemSettings((prev) =>
                        prev ? { ...prev, defaultJobShare: Number(e.target.value) } : null,
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Types */}
        <TabsContent value="job-types" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Job Types Management</CardTitle>
                  <CardDescription>Manage job types, their default values and technician percentages</CardDescription>
                </div>
                <Dialog open={showCreateJobType} onOpenChange={setShowCreateJobType}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Job Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <CreateJobTypeDialog onJobTypeCreated={handleJobTypeCreated} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Job Types */}
              <div className="space-y-3">
                {jobTypes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No job types found.</p>
                    <p className="text-sm">Add a new job type to get started.</p>
                  </div>
                ) : (
                  jobTypes.map((jobType) => (
                    <div key={jobType.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: jobType.color }} />
                        <div>
                          <p className="font-medium">{jobType.name}</p>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Base value: {formatNaira(jobType.baseValue)}</span>
                            <span>Default share: {jobType.defaultPercentage}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => removeJobType(jobType.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Security settings are managed by system administrators. Contact support for changes.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                  </div>
                  <Badge variant="outline">30 minutes</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Password Policy</Label>
                    <p className="text-sm text-muted-foreground">Minimum security requirements</p>
                  </div>
                  <Badge variant="outline">Strong</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
