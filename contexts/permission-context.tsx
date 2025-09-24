"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/types';

interface PermissionContextType {
  user: User | null;
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd fetch the current user from your API
    // For this example, we'll simulate it.
    const fetchCurrentUser = async () => {
      setIsLoading(true);
      try {
        // This endpoint should be created to fetch the current logged-in user
        const response = await fetch('/api/users/me'); 
        if (response.ok) {
          const currentUser = await response.json();
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

      const hasPermission = (permission: string): boolean => {
      console.log("Checking permission:", permission, "for user role permissions:", user?.role?.permissions);
      if (isLoading || !user || !user.role || !user.role.permissions) {      return false;
    }

    // Add this check
    if (typeof permission !== 'string') {
      console.error("hasPermission called with non-string permission:", permission);
      return false;
    }

    // Super Admins with 'all: true' have all permissions
    if (user.role.permissions.all === true) {
      return true;
    }

    const keys = permission.split(':');
    let current: any = user.role.permissions;

    for (const key of keys) {
      if (current === undefined) {
        return false;
      }
      if (typeof current === 'object' && current !== null) {
        current = current[key];
      } else {
        return false;
      }
    }
    
    return current === true;
  };

  return (
    <PermissionContext.Provider value={{ user, hasPermission, isLoading }}>
      {children}
    </PermissionContext.Provider>
  );
}
