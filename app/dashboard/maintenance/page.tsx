"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Plus, Search, MapPin, CalendarIcon, User, Clock, RefreshCw, AlertTriangle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import type { MaintenanceTemplate, MaintenanceOccurrence, User as UserType } from "@/types"
import { formatDate } from "@/lib/date-utils"
import CreateMaintenanceDialog from "@/components/create-maintenance-dialog"
import EditMaintenanceTemplateDialog from "@/components/edit-maintenance-template-dialog"
import MobileTableCard from "@/components/mobile-table-card"
import BottomSheet from "@/components/bottom-sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  missed: "bg-red-100 text-red-800",
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-red-100 text-red-800",
}

export default function MaintenancePage() {
  const [templates, setTemplates] = useState<MaintenanceTemplate[]>([])
  const [occurrences, setOccurrences] = useState<MaintenanceOccurrence[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MaintenanceTemplate | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState<MaintenanceTemplate | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [calendarOccurrences, setCalendarOccurrences] = useState<Record<string, MaintenanceOccurrence[]>>({})
  const [selectedOccurrence, setSelectedOccurrence] = useState<MaintenanceOccurrence | null>(null)
  const [showBottomSheet, setShowBottomSheet] = useState(false)

  useEffect(() => {
    fetchData()
    fetchUsers()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [templatesRes, occurrencesRes] = await Promise.all([
        fetch("/api/maintenance/templates", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
        fetch("/api/maintenance/occurrences", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      ]);

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data);
      }

      if (occurrencesRes.ok) {
        const data = await occurrencesRes.json();
        setOccurrences(data);

        const occurrencesByDate: Record<string, MaintenanceOccurrence[]> = {}
        data.forEach((occ: MaintenanceOccurrence) => {
          const dateKey = occ.scheduledDate.split("T")[0]
          if (!occurrencesByDate[dateKey]) {
            occurrencesByDate[dateKey] = []
          }
          occurrencesByDate[dateKey].push(occ)
        })
        setCalendarOccurrences(occurrencesByDate)
      }

    } catch (error) {
      console.error("Failed to fetch maintenance data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users/all", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const handleTemplateCreated = () => {
    fetchData()
    setShowCreateDialog(false)
  }

  const handleEditTemplate = (template: MaintenanceTemplate) => {
    setEditingTemplate(template);
    setShowEditDialog(true);
  };

  const handleTemplateUpdated = () => {
    setShowEditDialog(false);
    fetchData();
  };

  const handleDeleteTemplate = (template: MaintenanceTemplate) => {
    setDeletingTemplate(template);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingTemplate) return;

    try {
      const response = await fetch(`/api/maintenance/templates/${deletingTemplate.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        fetchData();
      } else {
        console.error("Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
    } finally {
      setShowDeleteDialog(false);
      setDeletingTemplate(null);
    }
  };

  const handleStatusUpdate = async (occurrenceId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/maintenance/occurrences/${occurrenceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedOccurrence = await response.json();
        setOccurrences(prev => 
          prev.map(occ => occ.id === occurrenceId ? { ...occ, ...updatedOccurrence } : occ)
        );
        
        const dateKey = updatedOccurrence.scheduledDate.split("T")[0];
        setCalendarOccurrences(prev => ({
          ...prev,
          [dateKey]: prev[dateKey]?.map(occ => occ.id === occurrenceId ? { ...occ, ...updatedOccurrence } : occ)
        }));

        setShowBottomSheet(false);
      } else {
        console.error("Failed to update occurrence status");
      }
    } catch (error) {
      console.error("Error updating occurrence status:", error);
    }
  };

  const handleOccurrenceClick = (occurrence: MaintenanceOccurrence) => {
    setSelectedOccurrence(occurrence)
    setShowBottomSheet(true)
  }

  const filteredOccurrences = occurrences.filter((occ) => {
    const matchesSearch =
      (occ.template?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      occ.template?.siteLocation?.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || occ.status === statusFilter
    const matchesPriority = priorityFilter === "all" || occ.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const selectedDateOccurrences = selectedDate ? calendarOccurrences[selectedDate.toISOString().split("T")[0]] || [] : []

  if (loading) {
    return <div>Loading...</div> // Replace with a proper skeleton loader
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground">Manage maintenance templates and scheduled jobs</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <CreateMaintenanceDialog users={users} onTemplateCreated={handleTemplateCreated} />
          </DialogContent>
        </Dialog>

        {editingTemplate && (
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-2xl">
              <EditMaintenanceTemplateDialog
                template={editingTemplate}
                users={users}
                onTemplateUpdated={handleTemplateUpdated}
              />
            </DialogContent>
          </Dialog>
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the template "{deletingTemplate?.title}" and all of its scheduled occurrences. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>

      <Tabs defaultValue="occurrences">
        <TabsList>
          <TabsTrigger value="occurrences">Scheduled Jobs</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Templates</CardTitle>
              <CardDescription>Reusable templates for recurring maintenance jobs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Default Technician</TableHead>
                    <TableHead>Recurrence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map(template => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.title}</TableCell>
                      <TableCell>{template.siteLocation}</TableCell>
                      <TableCell>{template.assignedUser ? `${template.assignedUser.firstName} ${template.assignedUser.lastName}` : 'Unassigned'}</TableCell>
                      <TableCell>{`Every ${template.recurrenceInterval} ${template.recurrenceType === 'daily' ? 'day' : template.recurrenceType === 'weekly' ? 'week' : template.recurrenceType === 'monthly' ? 'month' : 'year'}${template.recurrenceInterval > 1 ? 's' : ''}`}</TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? 'default' : 'outline'}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteTemplate(template)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occurrences" className="space-y-4">
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
                      placeholder="Search by title or location..."
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
                    <SelectItem value="missed">Missed</SelectItem>
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

          <Card>
            <CardHeader>
              <CardTitle>Scheduled Jobs ({filteredOccurrences.length})</CardTitle>
              <CardDescription>All upcoming and past maintenance jobs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOccurrences.map(occ => {
                    return (
                      <TableRow key={occ.id} onClick={() => handleOccurrenceClick(occ)} className="cursor-pointer">
                        <TableCell>
                          <div className="font-medium">{occ.template?.title}</div>
                          <div className="text-sm text-muted-foreground">{occ.template?.siteLocation}</div>
                        </TableCell>
                        <TableCell>{occ.assignedUser ? `${occ.assignedUser.firstName} ${occ.assignedUser.lastName}` : 'Unassigned'}</TableCell>
                        <TableCell><Badge className={statusColors[occ.status]}>{occ.status.replace("_", " ")}</Badge></TableCell>
                        <TableCell><Badge className={priorityColors[occ.priority]} variant="outline">{occ.priority}</Badge></TableCell>
                        <TableCell>{formatDate(occ.scheduledDate)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
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
                    modifiers={{ hasTasks: Object.keys(calendarOccurrences).map(date => new Date(date)) }}
                    modifiersClassNames={{ hasTasks: "bg-blue-50 font-medium" }}
                  />
                </div>
                <div>
                  <h3 className="font-medium mb-4">
                    {selectedDate ? formatDate(selectedDate.toISOString()) : "Select a date"}
                  </h3>
                  {selectedDateOccurrences.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateOccurrences.map(occ => {
                        const template = templates.find(t => t.id === occ.templateId);
                        return (
                          <div key={occ.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{template?.title}</p>
                                <p className="text-sm text-muted-foreground">{template?.siteLocation}</p>
                              </div>
                              <Badge className={statusColors[occ.status]}>{occ.status}</Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-lg">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No jobs scheduled for this date</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title={selectedOccurrence?.template?.title || "Job Details"}
      >
        {selectedOccurrence && (
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedOccurrence.template?.siteLocation}</h3>
                <p className="text-sm text-muted-foreground">Scheduled for {formatDate(selectedOccurrence.scheduledDate)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Assigned Technician</p>
                  <p>{selectedOccurrence.assignedUser ? `${selectedOccurrence.assignedUser.firstName} ${selectedOccurrence.assignedUser.lastName}` : 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Priority</p>
                  <Badge className={priorityColors[selectedOccurrence.priority]} variant="outline">{selectedOccurrence.priority}</Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">
                  {selectedOccurrence.template?.description || "No description provided."}
                </p>
              </div>

              <div>
                <label htmlFor="status-update" className="text-sm font-medium">Update Status</label>
                <Select
                  defaultValue={selectedOccurrence.status}
                  onValueChange={(newStatus) => handleStatusUpdate(selectedOccurrence.id, newStatus)}
                >
                  <SelectTrigger id="status-update">
                    <SelectValue placeholder="Change status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
