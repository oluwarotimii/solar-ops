"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Users, Search, UserCheck, UserX, Shield, Mail, Phone, Clock } from "lucide-react"
import type { User, Role } from "@/types"

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  deactivated: "bg-gray-100 text-gray-800",
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", {});

      if (response.ok) {
        const data = await response.json()
        console.log('[Frontend] Users data received after refresh:', data);
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
      const response = await fetch("/api/roles", {});

      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    }
  }

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        console.log('[Frontend] User status updated successfully. Refreshing users...');
        fetchUsers() // Refresh the list
      } else {
        const errorData = await response.json();
        console.error('[Frontend] Failed to update user status:', errorData);
      }
    } catch (error) {
      console.error("Failed to update user status:", error)
    }
  }

  const updateUserRole = async (userId: string, roleId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roleId }),
      })

      if (response.ok) {
        fetchUsers() // Refresh the list
      }
    } catch (error) {
      console.error("Failed to update user role:", error)
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesRole = roleFilter === "all" || user.roleId === roleFilter

    return matchesSearch && matchesStatus && matchesRole
  })

  const pendingUsers = users.filter((user) => user.status === "pending")
  console.log('[Frontend] Current users array:', users);
  console.log('[Frontend] Filtered pending users:', pendingUsers);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">User Management</h1>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Clock className="h-5 w-5" />
              Pending Approvals ({pendingUsers.length})
            </CardTitle>
            <CardDescription>New user registrations awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateUserStatus(user.id, "active")}>
                      <UserCheck className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <UserX className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject User Registration?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the user registration for {user.firstName} {user.lastName}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => updateUserStatus(user.id, "deactivated")}>
                            Reject
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                  placeholder="Search users..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="deactivated">Deactivated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
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
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>All registered users and their account details</CardDescription>
        </CardHeader>
        <CardContent>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.phone ? (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{user.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <Select value={user.roleId} onValueChange={(value) => updateUserRole(user.id, value)}>
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[user.status]}>{user.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user.status === "active" && (
                          <Button variant="outline" size="sm" onClick={() => updateUserStatus(user.id, "suspended")}>
                            Suspend
                          </Button>
                        )}
                        {user.status === "suspended" && (
                          <Button variant="outline" size="sm" onClick={() => updateUserStatus(user.id, "active")}>
                            Activate
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Deactivate
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate User Account?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will deactivate the account for {user.firstName} {user.lastName}. They will no
                                longer be able to access the system.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => updateUserStatus(user.id, "deactivated")}>
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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
