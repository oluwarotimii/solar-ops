import { useState, useEffect } from "react";
import { DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { User, Role } from "@/types";

interface EditUserDialogProps {
  user: User;
  roles: Role[];
  onUserUpdated: (updatedUser: User) => void;
}

export default function EditUserDialog({ user, roles, onUserUpdated }: EditUserDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || "",
    roleId: user.roleId,
    status: user.status,
  });
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      roleId: user.roleId,
      status: user.status,
    });
    setNewPassword("");
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reset password.");
      }

      const data = await response.json();
      setNewPassword(data.newPassword);
      toast({
        title: "Password Reset",
        description: `New password for ${user.firstName} ${user.lastName} generated.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while resetting the password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        roleId: formData.roleId,
        status: formData.status,
      };

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user.");
      }

      toast({
        title: "User Updated",
        description: `User ${formData.firstName} ${formData.lastName} has been updated.`,
      });
      onUserUpdated({ ...user, ...payload });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while updating the user.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'deactivated') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${newStatus === 'active' ? 'activate' : 'deactivate'} user.`);
      }

      toast({
        title: "User Status Updated",
        description: `User ${user.firstName} ${user.lastName} has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
      });
      setFormData((prev) => ({ ...prev, status: newStatus }));
      onUserUpdated({ ...user, status: newStatus });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while updating user status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogTitle>Edit User</DialogTitle>
      <DialogDescription>Make changes to the user's profile here. Click save when you're done.</DialogDescription>
      <ScrollArea className="h-[400px] w-full">
        <div className="grid gap-4 py-4 px-2">
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="firstName" className="text-left sm:text-right">First Name</Label>
            <Input id="firstName" value={formData.firstName} onChange={handleChange} className="col-span-1 sm:col-span-3" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="lastName" className="text-left sm:text-right">Last Name</Label>
            <Input id="lastName" value={formData.lastName} onChange={handleChange} className="col-span-1 sm:col-span-3" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-left sm:text-right">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={handleChange} className="col-span-1 sm:col-span-3" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-left sm:text-right">Phone</Label>
            <Input id="phone" value={formData.phone} onChange={handleChange} className="col-span-1 sm:col-span-3" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="roleId" className="text-left sm:text-right">Role</Label>
            <Select value={String(formData.roleId)} onValueChange={(value) => handleSelectChange(value, "roleId")}>
              <SelectTrigger className="col-span-1 sm:col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="newPassword" className="text-left sm:text-right">New Password</Label>
            <div className="col-span-1 sm:col-span-3 flex items-center space-x-2">
              <Input
                id="newPassword"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-grow"
                placeholder="Click 'Reset' to generate a new password"
                readOnly
              />
              <Button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset"}
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
      <DialogFooter>
        <div className="flex flex-col sm:flex-row gap-2">
          {user.status === 'active' ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={loading} className="w-full sm:w-auto">
                  Deactivate User
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will deactivate the user '{user.firstName} {user.lastName}'. They will no longer be able to log in.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleStatusChange('deactivated')} disabled={loading}>
                    {loading ? "Deactivating..." : "Deactivate"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" disabled={loading} className="w-full sm:w-auto">
                  Activate User
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to activate this user?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will activate the user '{user.firstName} {user.lastName}'. They will be able to log in again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleStatusChange('active')} disabled={loading}>
                    {loading ? "Activating..." : "Activate"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
