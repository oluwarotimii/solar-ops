"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Users, Search, UserCheck, Phone, Clock, Edit } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileTableCard } from "@/components/mobile-table-card"
import type { User, Role } from "@/types"
import EditUserDialog from "@/components/edit-user-dialog"

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  active: "bg-green-100 text-green-800 border-green-200",
  suspended: "bg-red-100 text-red-800 border-red-200",
  deactivated: "bg-gray-100 text-gray-800 border-gray-200",
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", {})

      if (response.ok) {
        const data = await response.json()
        console.log("[Frontend] Users data received after refresh:", data)
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles", {})

      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    }
  }

  const filteredUsers = users.filter((user) => {
    if (!user) return false // Ensure user is not undefined or null
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesRole = roleFilter === "all" || user.roleId === roleFilter

    return matchesSearch && matchesStatus && matchesRole
  })

  const pendingUsers = users.filter((user) => user && user.status === "pending")
  console.log("[Frontend] Current users array:", users)
  console.log("[Frontend] Filtered pending users:", pendingUsers)

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 max-w-full overflow-hidden">
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">User Management</h1>
          {!isMobile && <p className="text-muted-foreground mt-1">Manage user accounts, roles, and permissions</p>}
        </div>
      </div>

      {selectedUser && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <EditUserDialog
              user={selectedUser}
              roles={roles}
              onUserUpdated={(updatedUser) => {
                setSelectedUser(updatedUser)
                setUsers((prevUsers) => prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
                fetchUsers()
                setShowEditDialog(false)
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800 text-lg">
              <Clock className="h-5 w-5" />
              Pending Approvals ({pendingUsers.length})
            </CardTitle>
            {!isMobile && <CardDescription>New user registrations awaiting approval</CardDescription>}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user)
                      setShowEditDialog(true)
                    }}
                    className="ml-3 flex-shrink-0"
                  >
                    {isMobile ? (
                      <UserCheck className="h-4 w-4" />
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Review
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="deactivated">Deactivated</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table/Cards */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Users ({filteredUsers.length})</CardTitle>
          {!isMobile && <CardDescription>All registered users and their account details</CardDescription>}
        </CardHeader>
        <CardContent className="pt-0">
          {isMobile ? (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <MobileTableCard
                  key={user.id}
                  title={`${user.firstName} ${user.lastName}`}
                  subtitle={user.email}
                  status={user.status}
                  statusColor={statusColors[user.status]}
                  badges={[
                    { label: user.role?.name || "No Role", variant: "outline" },
                    { label: new Date(user.createdAt).toLocaleDateString(), variant: "secondary" },
                  ]}
                  onEdit={() => {
                    setSelectedUser(user)
                    setShowEditDialog(true)
                  }}
                  onClick={() => {
                    setSelectedUser(user)
                    setShowEditDialog(true)
                  }}
                >
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <Phone className="h-3 w-3" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </MobileTableCard>
              ))}
            </div>
          ) : (
            /* Desktop table view */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {user.firstName} {user.lastName}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>{user.role?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[user.status]}>{user.status}</Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowEditDialog(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
