"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Plus, Search, MapPin, CalendarIcon, User, Clock, RefreshCw, AlertTriangle } from "lucide-react"
import type { MaintenanceTask, User as UserType } from "@/types"
import CreateMaintenanceDialog from "@/components/create-maintenance-dialog"

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-red-100 text-red-800",
}

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [technicians, setTechnicians] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [calendarTasks, setCalendarTasks] = useState<Record<string, MaintenanceTask[]>>({})

  useEffect(() => {
    fetchTasks()
    fetchTechnicians()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/maintenance", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTasks(data)

        // Group tasks by date for calendar view
        const tasksByDate: Record<string, MaintenanceTask[]> = {}
        data.forEach((task: MaintenanceTask) => {
          const dateKey = task.scheduledDate.split("T")[0]
          if (!tasksByDate[dateKey]) {
            tasksByDate[dateKey] = []
          }
          tasksByDate[dateKey].push(task)
        })
        setCalendarTasks(tasksByDate)
      }
    } catch (error) {
      console.error("Failed to fetch maintenance tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const response = await fetch("/api/users/technicians", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTechnicians(data)
      }
    } catch (error) {
      console.error("Failed to fetch technicians:", error)
    }
  }

  const handleTaskCreated = () => {
    fetchTasks()
    setShowCreateDialog(false)
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.siteLocation.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const selectedDateTasks = selectedDate ? calendarTasks[selectedDate.toISOString().split("T")[0]] || [] : []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Maintenance</h1>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground">Schedule and track maintenance tasks</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <CreateMaintenanceDialog technicians={technicians} onTaskCreated={handleTaskCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Overdue Tasks Alert */}
      {tasks.filter((task) => task.status === "overdue").length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Overdue Tasks ({tasks.filter((task) => task.status === "overdue").length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tasks
                .filter((task) => task.status === "overdue")
                .map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.siteLocation}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors.overdue}>Overdue</Badge>
                      <span className="text-sm text-red-600">{new Date(task.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
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
                      placeholder="Search tasks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Table */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Tasks ({filteredTasks.length})</CardTitle>
              <CardDescription>All scheduled maintenance tasks and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Technician</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Scheduled Date</TableHead>
                      <TableHead>Recurrence</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.assignedUser ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>
                                {task.assignedUser.firstName} {task.assignedUser.lastName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[task.status]}>{task.status.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={priorityColors[task.priority]} variant="outline">
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 max-w-[200px]">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{task.siteLocation}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(task.scheduledDate).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.recurrenceType ? (
                            <span>
                              Every {task.recurrenceInterval} {task.recurrenceType}
                              {task.recurrenceInterval > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">One-time</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {task.status === "scheduled" && (
                              <Button variant="outline" size="sm">
                                Start
                              </Button>
                            )}
                            {task.status === "in_progress" && (
                              <Button variant="outline" size="sm">
                                Complete
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredTasks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No maintenance tasks found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Calendar</CardTitle>
              <CardDescription>View scheduled maintenance by date</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    modifiers={{
                      hasTasks: (date) => {
                        const dateKey = date.toISOString().split("T")[0]
                        return !!calendarTasks[dateKey]
                      },
                      hasOverdue: (date) => {
                        const dateKey = date.toISOString().split("T")[0]
                        const tasks = calendarTasks[dateKey] || []
                        return tasks.some((task) => task.status === "overdue")
                      },
                    }}
                    modifiersClassNames={{
                      hasTasks: "bg-blue-50 font-medium",
                      hasOverdue: "bg-red-50 font-bold text-red-600",
                    }}
                  />
                </div>

                <div>
                  <h3 className="font-medium mb-4">
                    {selectedDate
                      ? selectedDate.toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Select a date"}
                  </h3>

                  {selectedDateTasks.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateTasks.map((task) => (
                        <div key={task.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-muted-foreground">{task.siteLocation}</p>
                            </div>
                            <Badge className={statusColors[task.status]}>{task.status}</Badge>
                          </div>
                          {task.assignedUser && (
                            <div className="flex items-center gap-1 mt-2 text-sm">
                              <User className="h-3 w-3" />
                              <span>
                                {task.assignedUser.firstName} {task.assignedUser.lastName}
                              </span>
                            </div>
                          )}
                          {task.recurrenceType && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <RefreshCw className="h-3 w-3" />
                              <span>
                                Repeats every {task.recurrenceInterval} {task.recurrenceType}
                                {task.recurrenceInterval > 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-lg">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No tasks scheduled for this date</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
