"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Users, Search, UserCheck, Phone, Clock, Edit, Star, Briefcase, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileTableCard } from "@/components/mobile-table-card";
import type { User, Role } from "@/types";
import EditUserDialog from "@/components/edit-user-dialog";
import { usePermissions } from "@/contexts/permission-context";

const statusColors: { [key: string]: string } = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  active: "bg-green-100 text-green-800 border-green-200",
  suspended: "bg-red-100 text-red-800 border-red-200",
  deactivated: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const isMobile = useIsMobile();
  const { hasPermission } = usePermissions();

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users", {});

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles", {});

      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!user) return false;
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesRole = roleFilter === "all" || user.roleId === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const pendingUsers = users.filter((user) => user && user.status === "pending");

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;

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
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 max-w-full overflow-hidden">
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">User Management</h1>
          {!isMobile && <p className="text-muted-foreground mt-1">Manage user accounts, roles, and permissions</p>}
        </div>
        {hasPermission("users:create") && (
          <Button onClick={() => {
            setSelectedUser(null); // Ensure we are creating a new user
            setShowEditDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        )}
      </div>

      {showEditDialog && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <EditUserDialog
              user={selectedUser} // This will be null for creating a new user
              roles={roles}
              onUserUpdated={(updatedUser) => {
                if (selectedUser) {
                  // Update existing user
                  setUsers((prevUsers) => prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
                } else {
                  // Add new user
                  setUsers((prevUsers) => [...prevUsers, updatedUser]);
                }
                fetchUsers(); // Refetch to be safe
                setShowEditDialog(false);
                setSelectedUser(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
          </CardContent>
        </Card>
      </div>

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
                  {hasPermission("users:update") && (
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
                  )}
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
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{user.firstName} {user.lastName}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge className={statusColors[user.status]}>{user.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Role</p>
                      <p className="font-medium">{user.role?.name || "No Role"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Jobs</p>
                      <p className="font-medium">{user.stats?.totalJobs || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Completed</p>
                      <p className="font-medium">{user.stats?.completedJobs || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg. Rating</p>
                      <p className="font-medium">{user.stats?.avgRating?.toFixed(1) || 'N/A'}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedUser(user)
                      setShowEditDialog(true)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit User
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            /* Desktop table view */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Jobs</TableHead>
                    <TableHead>Completed</TableHead>
                    {/* <TableHead>Avg. Rating</TableHead> */}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </TableCell>
                      <TableCell>{user.role?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[user.status]}>{user.status}</Badge>
                      </TableCell>
                      <TableCell>{user.stats?.totalJobs || 0}</TableCell>
                      <TableCell>{user.stats?.completedJobs || 0}</TableCell>
                      {/* <TableCell>{user.stats?.avgRating?.toFixed(1) || 'N/A'}</TableCell> */}
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
