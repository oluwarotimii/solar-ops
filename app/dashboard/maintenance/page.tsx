"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Plus, Search, MapPin, CalendarIcon, User, Clock, RefreshCw, AlertTriangle, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import type { MaintenanceTemplate, MaintenanceOccurrence, User as UserType } from "@/types"
import { formatDate } from "@/lib/date-utils"
import CreateMaintenanceDialog from "@/components/create-maintenance-dialog"
import EditMaintenanceTemplateDialog from "@/components/edit-maintenance-template-dialog"
import MaintenanceOccurrenceDetails from "@/components/maintenance-occurrence-details"
import MobileTableCard from "@/components/mobile-table-card"
import BottomSheet from "@/components/bottom-sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePermissions } from "@/contexts/permission-context";

export const dynamic = 'force-dynamic';

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
  const isMobile = useIsMobile();
  const { user, hasPermission, isLoading: permissionsLoading } = usePermissions();
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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalOccurrences, setTotalOccurrences] = useState(0)
  const [occurrencesPerPage] = useState(12)

  useEffect(() => {
    if (!permissionsLoading && user) {
      fetchData(user, currentPage);
      if (hasPermission('users:read')) {
        fetchUsers();
      }
    }
  }, [user, currentPage, hasPermission, permissionsLoading]);

  const fetchData = async (user: UserType | null, page = 1) => {
    setLoading(true)
    try {
      const [templatesRes, occurrencesRes] = await Promise.all([
        fetch("/api/maintenance/templates", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
        fetch(`/api/maintenance/occurrences?page=${page}&limit=${occurrencesPerPage}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      ]);

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data);
      }

      if (occurrencesRes.ok) {
        const data = await occurrencesRes.json();
        let occurrencesData = data.occurrences;
        if (user && !hasPermission(user, 'maintenance:read:all')) {
          occurrencesData = occurrencesData.filter(occ => occ.assignedTo === user.id);
        }
        setOccurrences(occurrencesData);
        setTotalOccurrences(data.total || 0);

        const occurrencesByDate: Record<string, MaintenanceOccurrence[]> = {}
        occurrencesData.forEach((occ: MaintenanceOccurrence) => {
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
    fetchData(user, currentPage)
    setShowCreateDialog(false)
  }

  const handleEditTemplate = (template: MaintenanceTemplate) => {
    setEditingTemplate(template);
    setShowEditDialog(true);
  };

  const handleTemplateUpdated = () => {
    setShowEditDialog(false);
    fetchData(user, currentPage);
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
        fetchData(user);
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

  const handleOccurrenceUpdate = async (occurrenceId: string, dataToUpdate: Partial<MaintenanceOccurrence>) => {
    try {
      const response = await fetch(`/api/maintenance/occurrences/${occurrenceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(dataToUpdate),
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

        // If status is changed, close the sheet. Otherwise, just update the data inside.
        if (dataToUpdate.status) {
          setIsDetailsOpen(false);
        } else {
          setSelectedOccurrence(updatedOccurrence);
        }

      } else {
        console.error("Failed to update occurrence status");
      }
    } catch (error) {
      console.error("Error updating occurrence status:", error);
    }
  };

  const handleOccurrenceClick = (occurrence: MaintenanceOccurrence) => {
    setSelectedOccurrence(occurrence)
    setIsDetailsOpen(true)
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

  const DetailsContent = selectedOccurrence ? (
    <MaintenanceOccurrenceDetails 
      occurrence={selectedOccurrence} 
      users={users} 
      onUpdate={handleOccurrenceUpdate} 
      currentUser={user}
    />
  ) : null;

  if (user && !hasPermission('maintenance:read:all') && occurrences.length === 0 && !loading && !hasPermission('maintenance:create')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold">No Maintenance Jobs</h1>
        <p className="text-muted-foreground">You have not been assigned any maintenance jobs.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground">Manage maintenance templates and scheduled jobs</p>
        </div>
        {hasPermission('maintenance:create') && (
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
        )}

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
          {hasPermission('maintenance:read:all') && <TabsTrigger value="templates">Templates</TabsTrigger>}
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        {hasPermission('maintenance:read:all') && (
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
        )}

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
              <div className="hidden md:block">
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
                          <TableCell><Badge className={statusColors[occ.status]}>{occ.status ? occ.status.replace("_", " ") : ''}</Badge></TableCell>
                          <TableCell><Badge className={priorityColors[occ.priority]} variant="outline">{occ.priority}</Badge></TableCell>
                          <TableCell>{formatDate(occ.scheduledDate)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden space-y-3">
                {filteredOccurrences.map(occ => (
                  <MobileTableCard
                    key={occ.id}
                    title={occ.template?.title || ''}
                    subtitle={occ.template?.siteLocation || ''}
                    status={occ.status}
                    statusColor={statusColors[occ.status]}
                    badges={[
                      { label: occ.priority, variant: "outline" },
                      { label: formatDate(occ.scheduledDate), variant: "secondary" },
                    ]}
                    onClick={() => handleOccurrenceClick(occ)}
                  />
                ))}
              </div>
              
              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-4">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {Math.ceil(totalOccurrences / occurrencesPerPage)}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * occurrencesPerPage >= totalOccurrences}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
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

      {isMobile ? (
        <BottomSheet
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={selectedOccurrence?.template?.title || "Job Details"}
        >
          <div className="p-4">{DetailsContent}</div>
        </BottomSheet>
      ) : (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedOccurrence?.template?.title || "Job Details"}</DialogTitle>
            </DialogHeader>
            {DetailsContent}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
