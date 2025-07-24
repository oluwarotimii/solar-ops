import { useState, useEffect } from "react";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { User, Role } from "@/types";

interface EditUserDialogProps {
  user: User;
  roles: Role[];
  onUserUpdated: () => void;
}

export default function EditUserDialog({ user, roles, onUserUpdated }: EditUserDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || "",
    roleId: user.roleId,
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
        method: "PATCH",
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
        description: `New password for ${user.firstName} ${user.lastName} generated.`, // Consider more secure delivery in production
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
      onUserUpdated();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogTitle>Edit User</DialogTitle>
      <DialogDescription>Make changes to the user's profile here. Click save when you're done.</DialogDescription>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="firstName" className="text-right">First Name</Label>
          <Input id="firstName" value={formData.firstName} onChange={handleChange} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="lastName" className="text-right">Last Name</Label>
          <Input id="lastName" value={formData.lastName} onChange={handleChange} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">Email</Label>
          <Input id="email" type="email" value={formData.email} onChange={handleChange} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="phone" className="text-right">Phone</Label>
          <Input id="phone" value={formData.phone} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="roleId" className="text-right">Role</Label>
          <Select value={formData.roleId} onValueChange={(value) => handleSelectChange(value, "roleId")}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a role" />
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
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="newPassword" className="text-right">New Password</Label>
          <div className="col-span-3 flex items-center space-x-2">
            <Input
              id="newPassword"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-grow"
              placeholder="Click 'Reset' to generate a new password"
              readOnly // Make it read-only as it will be populated by the reset function
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
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
