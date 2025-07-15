"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Role } from "@/types";

const allPermissions = {
  jobs: ["create", "read:all", "read:team", "read:assigned", "update", "delete"],
  users: ["create", "read", "update", "delete"],
  roles: ["create", "read", "update", "delete"],
  maintenance: ["create", "read", "update", "delete"],
  tracking: ["read", "start_journey", "end_journey", "log_gps", "checkin"],
  job_types: ["create", "read", "update", "delete"],
  notifications: ["read", "send", "mark_read", "delete", "subscribe"],
  reports: ["read"],
};

interface RoleEditDialogProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: Role) => void;
}

export function RoleEditDialog({ role, isOpen, onClose, onSave }: RoleEditDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<any>({});

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || "");
      setPermissions(role.permissions || {});
    } else {
      setName("");
      setDescription("");
      setPermissions({});
    }
  }, [role]);

  const handlePermissionChange = (group: string, permission: string) => {
    setPermissions((prev: any) => {
      const newPermissions = {
        ...prev,
        [group]: {
          ...prev[group],
          [permission]: !prev[group]?.[permission],
        },
      };
      return newPermissions;
    });
  };

  const handleSave = () => {
    onSave({
      id: role?.id || "",
      name,
      description,
      permissions,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{role ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            {role ? "Edit the details of this role." : "Create a new role and assign permissions."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Permissions</h3>
            <div className="space-y-4">
              {Object.entries(allPermissions).map(([group, perms]) => (
                <div key={group}>
                  <h4 className="font-medium capitalize">{group}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map((perm) => (
                      <div key={perm} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${group}-${perm}`}
                          checked={permissions[group]?.[perm] || false}
                          onCheckedChange={() => handlePermissionChange(group, perm)}
                        />
                        <label
                          htmlFor={`${group}-${perm}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {perm}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
