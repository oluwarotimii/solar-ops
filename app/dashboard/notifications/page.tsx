"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Bell, Search, Plus, Eye, Trash2, Send, AlertTriangle, CheckCircle, Info, User } from "lucide-react"
import CreateNotificationDialog from "@/components/create-notification-dialog"

interface Notification {
  id: string
  title: string
  message: string
  type: "job_assignment" | "maintenance_reminder" | "admin_message" | "general"
  recipient: {
    id: string
    name: string
    email: string
  }
  sender?: {
    id: string
    name: string
  }
  relatedJob?: {
    id: string
    title: string
  }
  readAt?: string
  createdAt: string
}

// Demo notifications data
const demoNotifications: Notification[] = [
  {
    id: "1",
    title: "New Job Assignment",
    message: "You have been assigned a new emergency repair job in Scottsdale.",
    type: "job_assignment",
    recipient: { id: "3", name: "Lisa Wilson", email: "tech3@demo.com" },
    sender: { id: "admin", name: "Admin User" },
    relatedJob: { id: "3", title: "Emergency Inverter Repair" },
    createdAt: "2024-01-12T10:30:00Z",
  },
  {
    id: "2",
    title: "Maintenance Task Overdue",
    message: "Your quarterly inverter check at Site B is now overdue.",
    type: "maintenance_reminder",
    recipient: { id: "2", name: "David Smith", email: "tech2@demo.com" },
    sender: { id: "admin", name: "Admin User" },
    readAt: "2024-01-12T11:15:00Z",
    createdAt: "2024-01-12T09:00:00Z",
  },
  {
    id: "3",
    title: "Job Completion Confirmed",
    message: "Your solar installation job has been marked as completed. Great work!",
    type: "general",
    recipient: { id: "1", name: "Mike Johnson", email: "tech1@demo.com" },
    sender: { id: "supervisor", name: "Sarah Supervisor" },
    relatedJob: { id: "1", title: "Solar Panel Installation - Residential" },
    readAt: "2024-01-11T16:45:00Z",
    createdAt: "2024-01-11T16:30:00Z",
  },
  {
    id: "4",
    title: "System Maintenance Scheduled",
    message: "System maintenance is scheduled for tonight from 11 PM to 1 AM.",
    type: "admin_message",
    recipient: { id: "all", name: "All Users", email: "all@demo.com" },
    sender: { id: "admin", name: "Admin User" },
    createdAt: "2024-01-11T14:00:00Z",
  },
  {
    id: "5",
    title: "Performance Bonus Earned",
    message: "Congratulations! You've earned a performance bonus for completing 5 jobs this week.",
    type: "general",
    recipient: { id: "4", name: "Robert Brown", email: "tech4@demo.com" },
    sender: { id: "admin", name: "Admin User" },
    readAt: "2024-01-10T18:20:00Z",
    createdAt: "2024-01-10T18:00:00Z",
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(demoNotifications)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.recipient.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || notification.type === typeFilter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "read" && notification.readAt) ||
      (statusFilter === "unread" && !notification.readAt)

    return matchesSearch && matchesType && matchesStatus
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "job_assignment":
        return <User className="h-4 w-4" />
      case "maintenance_reminder":
        return <AlertTriangle className="h-4 w-4" />
      case "admin_message":
        return <Info className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "job_assignment":
        return "bg-blue-100 text-blue-800"
      case "maintenance_reminder":
        return "bg-orange-100 text-orange-800"
      case "admin_message":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleNotificationCreated = (newNotification: any) => {
    setNotifications([{ ...newNotification, id: Date.now().toString() }, ...notifications])
    setShowCreateDialog(false)
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, readAt: new Date().toISOString() } : notif)),
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  // Calculate stats
  const totalNotifications = notifications.length
  const unreadCount = notifications.filter((n) => !n.readAt).length
  const todayCount = notifications.filter((n) => {
    const today = new Date().toDateString()
    return new Date(n.createdAt).toDateString() === today
  }).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Manage system notifications and messages</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <CreateNotificationDialog onNotificationCreated={handleNotificationCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{totalNotifications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Today</p>
                <p className="text-2xl font-bold">{todayCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-full">
                <Send className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Sent</p>
                <p className="text-2xl font-bold">{notifications.filter((n) => n.sender).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="job_assignment">Job Assignment</SelectItem>
                <SelectItem value="maintenance_reminder">Maintenance</SelectItem>
                <SelectItem value="admin_message">Admin Message</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications ({filteredNotifications.length})</CardTitle>
          <CardDescription>All system notifications and messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg ${!notification.readAt ? "bg-blue-50 border-blue-200" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{notification.title}</h3>
                        {!notification.readAt && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-xs ${getTypeColor(notification.type)}`}>
                          {notification.type.replace("_", " ")}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>To: {notification.recipient.name}</span>
                        {notification.sender && <span>From: {notification.sender.name}</span>}
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                        {notification.readAt && <span>Read: {new Date(notification.readAt).toLocaleString()}</span>}
                      </div>

                      {notification.relatedJob && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            Job: {notification.relatedJob.title}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {!notification.readAt && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
