"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Shield, Trash2, Edit } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileTableCard } from "@/components/mobile-table-card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RoleEditDialog } from "@/components/role-edit-dialog"
import type { Role } from "@/types/role" // Declare the Role variable

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles")
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = () => {
    setSelectedRole(null)
    setIsDialogOpen(true)
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setIsDialogOpen(true)
  }

  const handleSaveRole = async (role: Role) => {
    const method = role.id ? "PUT" : "POST"
    const url = role.id ? `/api/roles/${role.id}` : "/api/roles"

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(role),
      })

      if (response.ok) {
        fetchRoles()
      }
    } catch (error) {
      console.error("Failed to save role:", error)
    }

    setIsDialogOpen(false)
  }

  const handleDeleteRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchRoles()
      }
    } catch (error) {
      console.error("Failed to delete role:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold">Role Management</h1>
        </div>
        <div className="animate-pulse space-y-4">
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">Role Management</h1>
          {!isMobile && <p className="text-muted-foreground mt-1">Define user roles and their permissions</p>}
        </div>
        <Button onClick={handleCreateRole} className="flex-shrink-0">
          <PlusCircle className="h-4 w-4" />
          {!isMobile && <span className="ml-2">Create Role</span>}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Roles ({roles.length})</CardTitle>
          {!isMobile && <CardDescription>All defined roles in the system</CardDescription>}
        </CardHeader>
        <CardContent className="pt-0">
          {isMobile ? (
            <div className="space-y-3">
              {roles.map((role) => (
                <MobileTableCard
                  key={role.id}
                  title={role.name}
                  subtitle={role.description}
                  badges={[{ label: "0 users", variant: "secondary" }]}
                  onEdit={() => handleEditRole(role)}
                  onDelete={() => {
                    setRoleToDelete(role)
                    setDeleteDialogOpen(true)
                  }}
                  onClick={() => handleEditRole(role)}
                >
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <Shield className="h-3 w-3" />
                    <span>System Role</span>
                  </div>
                </MobileTableCard>
              ))}
            </div>
          ) : (
            /* Desktop table view */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span>{role.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>0</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditRole(role)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRoleToDelete(role)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the role "{roleToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (roleToDelete) {
                  handleDeleteRole(roleToDelete.id)
                  setDeleteDialogOpen(false)
                  setRoleToDelete(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RoleEditDialog
        role={selectedRole}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveRole}
      />
    </div>
  )
}
