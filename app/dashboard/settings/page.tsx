"use client"

import { useState } from "react"
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
import { Settings, Bell, Shield, Database, Save, Plus, Trash2, Edit, Building } from "lucide-react"
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("company")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showCreateJobType, setShowCreateJobType] = useState(false)

  // Company Settings
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: "Solar Field Operations Nigeria",
    address: "123 Herbert Macaulay Way, Yaba, Lagos State, Nigeria",
    phone: "+234-801-SOLAR-1",
    email: "info@solarfieldops.ng",
    website: "https://solarfieldops.ng",
    logo: "",
    timezone: "Africa/Lagos",
    currency: "NGN",
  })

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    jobAssignments: true,
    maintenanceReminders: true,
    systemAlerts: true,
    weeklyReports: false,
  })

  // System Settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    autoAssignJobs: false,
    requireGPSCheckin: true,
    allowOfflineMode: true,
    dataRetentionDays: 365,
    maxJobsPerTechnician: 5,
    defaultJobShare: 60,
  })

  // Job Types Management
  const [jobTypes, setJobTypes] = useState([
    { id: "1", name: "Solar Installation", baseValue: 500000, defaultPercentage: 60, color: "#10B981" },
    { id: "2", name: "Maintenance Check", baseValue: 75000, defaultPercentage: 70, color: "#F59E0B" },
    { id: "3", name: "Repair Service", baseValue: 150000, defaultPercentage: 65, color: "#EF4444" },
    { id: "4", name: "System Inspection", baseValue: 100000, defaultPercentage: 55, color: "#3B82F6" },
    { id: "5", name: "Emergency Call", baseValue: 200000, defaultPercentage: 70, color: "#DC2626" },
  ])

  const handleSave = async () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 1000)
  }

  const handleJobTypeCreated = (newJobType: any) => {
    setJobTypes([...jobTypes, { ...newJobType, id: Date.now().toString() }])
    setShowCreateJobType(false)
  }

  const removeJobType = (id: string) => {
    setJobTypes(jobTypes.filter((jt) => jt.id !== id))
  }

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your system configuration and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {saved && (
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
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings((prev) => ({ ...prev, website: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={companySettings.address}
                  onChange={(e) => setCompanySettings((prev) => ({ ...prev, address: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+234-XXX-XXX-XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={companySettings.timezone}
                    onValueChange={(value) => setCompanySettings((prev) => ({ ...prev, timezone: value }))}
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
                    value={companySettings.currency}
                    onValueChange={(value) => setCompanySettings((prev) => ({ ...prev, currency: value }))}
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
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, smsNotifications: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, pushNotifications: checked }))
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
                      checked={notificationSettings.jobAssignments}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, jobAssignments: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Maintenance Reminders</Label>
                    <Switch
                      checked={notificationSettings.maintenanceReminders}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, maintenanceReminders: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>System Alerts</Label>
                    <Switch
                      checked={notificationSettings.systemAlerts}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, systemAlerts: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Weekly Reports</Label>
                    <Switch
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({ ...prev, weeklyReports: checked }))
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
                      checked={systemSettings.autoAssignJobs}
                      onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, autoAssignJobs: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require GPS Check-in</Label>
                      <p className="text-sm text-muted-foreground">Require GPS verification for job site check-ins</p>
                    </div>
                    <Switch
                      checked={systemSettings.requireGPSCheckin}
                      onCheckedChange={(checked) =>
                        setSystemSettings((prev) => ({ ...prev, requireGPSCheckin: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Offline Mode</Label>
                      <p className="text-sm text-muted-foreground">Allow technicians to work offline</p>
                    </div>
                    <Switch
                      checked={systemSettings.allowOfflineMode}
                      onCheckedChange={(checked) =>
                        setSystemSettings((prev) => ({ ...prev, allowOfflineMode: checked }))
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
                      value={systemSettings.dataRetentionDays}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          dataRetentionDays: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxJobs">Max Jobs per Technician</Label>
                    <Input
                      id="maxJobs"
                      type="number"
                      value={systemSettings.maxJobsPerTechnician}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          maxJobsPerTechnician: Number(e.target.value),
                        }))
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
                    value={systemSettings.defaultJobShare}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        defaultJobShare: Number(e.target.value),
                      }))
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
                {jobTypes.map((jobType) => (
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
                ))}
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
