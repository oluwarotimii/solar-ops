# Database Initialization and Super Admin Creation System

## Project Overview
- This is a SolarOps platform, a Next.js-based application for solar operations management
- Technology stack used: Next.js 14, TypeScript, PostgreSQL (via Neon serverless), Tailwind CSS, Radix UI components
- Database system and connection method: PostgreSQL using Neon serverless database with `@neondatabase/serverless` driver

## File Structure
- `/app/api/setup/init/route.ts` - Database initialization API route
- `/app/api/setup/status/route.ts` - Setup status check API route  
- `/app/api/setup/user/route.ts` - Super admin user creation API route
- `/app/setup/page.tsx` - Setup wizard UI component
- `/lib/db.ts` - Database connection utilities
- `/lib/setup-check.ts` - Setup completion checking function
- `/lib/auth.ts` - Authentication and user management utilities
- `/middleware.ts` - Setup flow protection middleware
- `/hash_password.js` - Utility for password hashing
- `/types/index.ts` - Type definitions for the application

## Complete File Contents

### 1. API Route Files

#### Database Initialization Route (`/app/api/setup/init/route.ts`)
```ts
import { NextRequest } from 'next/server';
import { getDbSql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const sql = getDbSql();
    
    // Create roles table first (no dependencies)
    await sql`
      CREATE TABLE IF NOT EXISTS roles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          is_admin BOOLEAN DEFAULT FALSE,
          permissions JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create users table (depends on roles)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          phone VARCHAR(20),
          role_id UUID REFERENCES roles(id),
          status VARCHAR(20) DEFAULT 'active',
          referral_points INTEGER DEFAULT 0 NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create job_types table (no dependencies)
    await sql`
      CREATE TABLE IF NOT EXISTS job_types (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          base_value DECIMAL(12,2) DEFAULT 0,
          color VARCHAR(7) DEFAULT '#3B82F6',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create jobs table (depends on job_types and users)
    await sql`
      CREATE TABLE IF NOT EXISTS jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          job_type_id UUID REFERENCES job_types(id),
          created_by UUID REFERENCES users(id),
          status VARCHAR(20) DEFAULT 'assigned',
          priority VARCHAR(10) DEFAULT 'medium',
          location_address TEXT NOT NULL,
          location_lat DECIMAL(10, 8),
          location_lng DECIMAL(11, 8),
          scheduled_date DATE,
          scheduled_time TIME,
          job_value DECIMAL(12,2) DEFAULT 0,
          instructions TEXT,
          completed_at TIMESTAMP WITH TIME ZONE,
          is_archived BOOLEAN DEFAULT FALSE,
          archived_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          referrer_id UUID REFERENCES users(id) ON DELETE SET NULL
      )
    `;
    
    // Create job_technicians table (many-to-many relationship)
    await sql`
      CREATE TABLE IF NOT EXISTS job_technicians (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
          technician_id UUID REFERENCES users(id),
          role VARCHAR(20) DEFAULT 'assistant',
          rating DECIMAL(3,2),
          feedback TEXT,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create GPS tracking logs
    await sql`
      CREATE TABLE IF NOT EXISTS gps_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          job_id UUID REFERENCES jobs(id),
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          accuracy DECIMAL(8, 2),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          journey_type VARCHAR(20) DEFAULT 'active'
      )
    `;
    
    // Create check-in/check-out logs
    await sql`
      CREATE TABLE IF NOT EXISTS checkin_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          job_id UUID REFERENCES jobs(id),
          type VARCHAR(10) NOT NULL,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          notes TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create job media table
    await sql`
      CREATE TABLE IF NOT EXISTS job_media (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id UUID REFERENCES jobs(id),
          uploaded_by UUID REFERENCES users(id),
          file_name VARCHAR(255) NOT NULL,
          file_type VARCHAR(50) NOT NULL,
          file_size INTEGER,
          storage_path TEXT NOT NULL,
          caption TEXT,
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create maintenance templates (the rule)
    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          site_location TEXT,
          job_value DECIMAL(12,2) DEFAULT 0,
          assigned_to UUID REFERENCES users(id),
          created_by UUID REFERENCES users(id),
          recurrence_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, yearly
          recurrence_interval INTEGER DEFAULT 1,
          day_of_week INTEGER, -- For weekly recurrence (0-6, Sunday-Saturday)
          day_of_month INTEGER, -- For monthly recurrence (1-31)
          month_of_year INTEGER, -- For yearly recurrence (1-12)
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create maintenance occurrences (the actual jobs)
    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_occurrences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          template_id UUID REFERENCES maintenance_templates(id) ON DELETE CASCADE,
          scheduled_date DATE NOT NULL,
          assigned_to UUID REFERENCES users(id),
          status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, missed
          priority VARCHAR(10) DEFAULT 'medium',
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create accrued values table
    await sql`
      CREATE TABLE IF NOT EXISTS accrued_values (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          job_id UUID REFERENCES jobs(id),
          maintenance_occurrence_id UUID REFERENCES maintenance_occurrences(id),
          job_value DECIMAL(12,2) NOT NULL,
          earned_amount DECIMAL(12,2) NOT NULL,
          rating DECIMAL(3,2),
          month INTEGER NOT NULL,
          year INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE (job_id, user_id),
          UNIQUE (maintenance_occurrence_id, user_id)
      )
    `;
    
    // Create notifications table
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          recipient_id UUID REFERENCES users(id),
          sender_id UUID REFERENCES users(id),
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'general',
          related_job_id UUID REFERENCES jobs(id),
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create system settings table
    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT NOT NULL,
          description TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create push notification subscriptions table
    await sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL,
          p256dh_key TEXT NOT NULL,
          auth_key TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, endpoint)
      )
    `;
    
    // Create audit trail table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          action VARCHAR(255) NOT NULL,
          target_type VARCHAR(100),
          target_id UUID,
          details JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create time_entries table
    await sql`
      CREATE TABLE IF NOT EXISTS time_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          clock_out TIMESTAMP WITH TIME ZONE,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    
    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_job_technicians_job_id ON job_technicians(job_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_job_technicians_technician_id ON job_technicians(technician_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gps_logs_user_id ON gps_logs(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_gps_logs_timestamp ON gps_logs(timestamp)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_maintenance_templates_assigned_to ON maintenance_templates(assigned_to)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_maintenance_occurrences_template_id ON maintenance_occurrences(template_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_maintenance_occurrences_assigned_to ON maintenance_occurrences(assigned_to)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_maintenance_occurrences_scheduled_date ON maintenance_occurrences(scheduled_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_maintenance_occurrences_status ON maintenance_occurrences(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_accrued_values_user_id ON accrued_values(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_accrued_values_month_year ON accrued_values(month, year)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id)`;
    
    // Insert default roles
    await sql`
      INSERT INTO roles (name, description, is_admin, permissions) 
      VALUES 
        ('Super Admin', 'Full system access', true, '{"all": true}'),
        ('User', 'Default role for new users', false, '{"job_types:read": true}'),
        ('Technician', 'Technician role with job-specific permissions', false, '{"jobs:create": true, "jobs:read": true, "jobs:update": true, "maintenance:create": true, "maintenance:read": true, "maintenance:update": true, "job_types:read": true}')
      ON CONFLICT (name) DO NOTHING
    `;
    
    return Response.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return Response.json({ message: 'Failed to initialize database', error: error.message }, { status: 500 });
  }
}
```

#### Setup Status Check Route (`/app/api/setup/status/route.ts`)
```ts
import { NextRequest, NextResponse } from 'next/server';
import { isSetupComplete } from '@/lib/setup-check';

export async function GET(request: NextRequest) {
  try {
    const setupComplete = await isSetupComplete();

    // Return the actual setup status
    return NextResponse.json({ setupComplete });
  } catch (error) {
    console.error('Error checking setup status:', error);

    // In case of error, assume setup is not complete
    return NextResponse.json({ setupComplete: false });
  }
}
```

#### Super Admin Creation Route (`/app/api/setup/user/route.ts`)
```ts
import { NextRequest } from 'next/server';
import { getDbSql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password } = body;
    
    // Validate input
    if (!name || !email || !phone || !password) {
      return Response.json({ message: 'All fields are required' }, { status: 400 });
    }
    
    const sql = getDbSql();
    
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;
    
    if (existingUser.length > 0) {
      return Response.json({ message: 'User with this email already exists' }, { status: 400 });
    }
    
    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Get Super Admin role ID
    const roleResult = await sql`
      SELECT id FROM roles WHERE name = 'Super Admin'
    `;
    
    if (roleResult.length === 0) {
      return Response.json({ message: 'Super Admin role not found' }, { status: 500 });
    }
    
    const roleId = roleResult[0].id;
    
    // Insert user
    await sql`
      INSERT INTO users (first_name, last_name, email, phone, password_hash, role_id)
      VALUES (${firstName}, ${lastName}, ${email}, ${phone}, ${hashedPassword}, ${roleId})
    `;
    
    return Response.json({ message: 'Super Admin user created successfully' });
  } catch (error) {
    console.error('User creation error:', error);
    return Response.json({ message: 'Failed to create user', error: error.message }, { status: 500 });
  }
}
```

### 2. Database Connection Utilities

#### Database Connection (`/lib/db.ts`)
```ts
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL);

export { sql };

export function getDbSql() {
  if (!process.env.DATABASE_URL) {
    console.error("[DB Debug] DATABASE_URL environment variable is not set!");
    throw new Error("DATABASE_URL environment variable is required");
  }
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    console.log("[DB Debug] Database connection successfully created");
    return sql;
  } catch (error) {
    console.error("[DB Debug] Failed to create database connection:", error);
    throw new Error("Failed to initialize database connection");
  }
}

// Helper function to convert snake_case to camelCase
export function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== "object" || obj instanceof Date) return obj;

  const camelObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelObj[camelKey] = toCamelCase(value);
  }
  return camelObj;
}

// Helper function to convert camelCase to snake_case
export function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== "object") return obj;

  const snakeObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    snakeObj[snakeKey] = toSnakeCase(value);
  }
  return snakeObj;
}
```

### 3. SQL Schema Files

The schema is defined inline within the database initialization API route file (`/app/api/setup/init/route.ts`) rather than in separate SQL files. It creates the following tables:

1. `roles` - User roles with permissions
2. `users` - User accounts with role associations
3. `job_types` - Types of jobs
4. `jobs` - Job records with location and status
5. `job_technicians` - Junction table for job-technician relationships
6. `gps_logs` - GPS tracking logs
7. `checkin_logs` - Check-in/check-out logs
8. `job_media` - Media files associated with jobs
9. `maintenance_templates` - Maintenance template records
10. `maintenance_occurrences` - Actual maintenance occurrences
11. `accrued_values` - Accrued value tracking
12. `notifications` - System notifications
13. `system_settings` - System-wide settings
14. `push_subscriptions` - Web push notification subscriptions
15. `audit_logs` - Audit trail table
16. `time_entries` - Time tracking entries

### 4. User/Authentication Logic

#### Authentication Utilities (`/lib/auth.ts`)
```ts
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { toCamelCase, getDbSql } from "./db"
import type { User } from "@/types"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  console.log(`[Auth Debug] Verifying password...`);
  const isValid = await bcrypt.compare(password, hashedPassword);
  console.log(`[Auth Debug] Password verification result: ${isValid}`);
  return isValid;
}

export function generateToken(userId: string): string {
  console.log(`[Auth Debug] Generating token for userId: ${userId}`);
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
  console.log(`[Auth Debug] Token generated (first 10 chars): ${token.substring(0, 10)}...`);
  return token;
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await getDbSql()`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${id} AND u.status = 'active'
    `

    if (result.length === 0) return null

    const user = toCamelCase(result[0])
    if (user.roleName) {
      user.role = {
        id: user.roleId,
        name: user.roleName,
        description: user.roleDescription,
        isAdmin: user.roleIsAdmin,
        permissions: typeof user.rolePermissions === 'string' ? JSON.parse(user.rolePermissions) : user.rolePermissions,
      }
    }

    return user
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
  try {
    console.log(`[Auth Debug] Attempting to get user by email: ${email}`);
    const result = await getDbSql()`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ${email}
    `

    if (result.length === 0) {
      console.log(`[Auth Debug] User with email ${email} not found.`);
      return null;
    }

    const user = toCamelCase(result[0]);
    console.log(`[Auth Debug] User found: ${user.email}, Status: ${user.status}`);
    if (user.roleName) {
      user.role = {
        id: user.roleId,
        name: user.roleName,
        description: user.roleDescription,
        isAdmin: user.roleIsAdmin,
        permissions: user.rolePermissions,
      };
    }

    return user;
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
}

export function hasPermission(user: User, permission: string): boolean {
  if (!user.role || !user.role.permissions) {
    return false;
  }

  // Super Admins with 'all: true' have all permissions
  if (user.role.permissions.all === true) {
    return true;
  }

  const keys = permission.split(':');
  let current = user.role.permissions;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    // Check for a direct match (e.g., 'dashboard:stats:read')
    const remainingKey = keys.slice(i).join(':');
    if (current[remainingKey] === true) {
      return true;
    }

    if (current[key] === undefined) {
      return false; // No further path
    }

    if (typeof current[key] === 'boolean') {
      return current[key];
    }

    current = current[key];
  }

  return false;
}
```

#### Password Hashing Utility (`/hash_password.js`)
```js
const bcrypt = require('bcryptjs');

const password = 'admin123';
const saltRounds = 12; // Use the same salt rounds as in your project

bcrypt.hash(password, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    console.log('Hashed password for "admin123":');
    console.log(hash);
});
```

### 5. Frontend Components

#### Setup Wizard UI Component (`/app/setup/page.tsx`)
```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  // Check if setup is already complete
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch("/api/setup/status");
        const data = await response.json();
        
        // Always show setup page for new database setup
        setIsLoading(false);
        // if (data.setupComplete) {
        //   router.push("/login");
        // } else {
        //   setIsLoading(false);
        // }
      } catch (error) {
        console.error("Error checking setup status:", error);
        setIsLoading(false);
      }
    };

    checkSetupStatus();
  }, [router]);

  const handleInitializeDb = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch("/api/setup/init", {
        method: "POST",
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Database tables created successfully!",
        });
        setDbInitialized(true);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to initialize database",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize database",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingUser(true);
    try {
      const response = await fetch("/api/setup/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Super Admin user created successfully!",
        });
        // Redirect to login page
        router.push("/login");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>SolarOps Setup</CardTitle>
          <CardDescription>Initialize your SolarOps platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!dbInitialized ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Welcome to SolarOps! To get started, you need to initialize the database tables.
              </p>
              <Button 
                onClick={handleInitializeDb} 
                disabled={isInitializing}
                className="w-full"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Initialize Database"
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <Button type="submit" disabled={isCreatingUser} className="w-full">
                {isCreatingUser ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  "Create Super Admin"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          {dbInitialized && (
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Database initialized successfully
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            This setup page should only be accessible once during initial installation.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### 6. Supporting Utilities

#### Setup Check Utility (`/lib/setup-check.ts`)
```ts
import { getDbSql } from './db';

export async function isSetupComplete() {
  try {
    const sql = getDbSql();
    // Check if the users table exists and has at least one user
    const result = await sql`
      SELECT COUNT(*) as count FROM users
    `;
    
    return parseInt(result[0].count) > 0;
  } catch (error) {
    // If there's an error (e.g., table doesn't exist), setup is not complete
    return false;
  }
}
```

#### API Authentication Utility (`/lib/api-auth.ts`)
```ts
import { NextRequest } from 'next/server';
import { verifyToken, getUserById } from './auth';
import type { User } from '@/types';

export async function authenticateApiRequest(request: NextRequest): Promise<{
  user: User | null;
  response: Response | null;
}> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return { user: null, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  
  const tokenData = verifyToken(token);
  
  if (!tokenData) {
    return { user: null, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  
  const user = await getUserById(tokenData.userId);
  
  if (!user) {
    return { user: null, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  
  return { user, response: null };
}
```

## Technical Implementation Details

### Database Connection Method
- Uses the `@neondatabase/serverless` package for PostgreSQL connection
- Connects to the database using the `DATABASE_URL` environment variable
- Creates a new database client instance for each request (suitable for serverless environments)
- Includes error handling for missing configuration variables
- Contains logging for debugging connection issues

### SQL Execution Process
- Uses template literals with the Neon SQL client for executing SQL statements
- All database operations use the `getDbSql()` function that returns a configured database client
- Uses `CREATE TABLE IF NOT EXISTS` to prevent errors on repeated calls
- Comprehensive try-catch blocks for error handling
- Detailed error logging for debugging

### Initialization Checks
- The system checks if setup is complete by counting existing users in the database
- Uses the `isSetupComplete()` function in `/lib/setup-check.ts` which queries `SELECT COUNT(*) FROM users`
- Returns false if there's an error (e.g., table doesn't exist), indicating setup is not complete
- Middleware protects the application until setup is complete

### Super Admin Creation
- Validates input data (name, email, phone, password)
- Checks if user already exists to prevent duplicates
- Splits full name into first and last name
- Hashes password using bcrypt with 10 salt rounds
- Assigns the user to the 'Super Admin' role by looking up the role ID
- Inserts the user into the database with all required information

### Security Measures
- Password hashing using bcrypt with salt rounds
- Input validation to ensure all required fields are provided
- SQL injection prevention through template literals that automatically parameterize values
- Role-based access control with permission checking
- JWT tokens for authentication
- Middleware protection to enforce setup completion before accessing other parts of the application

## Complete Workflow

### Step-by-Step Process
1. **Pre-initialization checks**: Middleware checks if setup is already complete
2. **Database connection establishment**: Uses getDbSql() to create connection with DATABASE_URL
3. **Schema creation**: Executes SQL commands to create tables in dependency order
4. **Default data insertion**: Inserts default roles including Super Admin, User, and Technician
5. **Super admin creation**: Creates the first admin user with role assignment
6. **Post-initialization verification**: Checks if setup is complete via setup status API
7. **Error handling and recovery**: Comprehensive error handling with try-catch blocks and detailed logging

## Error Handling
- All API routes have comprehensive try-catch blocks
- Database errors are caught and returned as 500 responses
- Input validation errors return 400 responses
- Duplicate user errors return 400 responses
- Missing role errors return 500 responses
- Connection errors are caught and converted to appropriate exceptions
- Logging is included for debugging purposes

## Dependencies and Packages
- `@neondatabase/serverless`: PostgreSQL serverless driver
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT token generation and verification
- `next`: Next.js framework
- `react` and `react-dom`: React framework
- UI components from Radix UI and custom components
- Tailwind CSS for styling

## Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT token generation (at least 32 characters)
- These are typically configured in a `.env.local` file

## Testing and Verification
- Setup status API endpoint (`/api/setup/status`) returns JSON indicating if setup is complete
- The middleware automatically redirects based on setup status
- UI components show appropriate messages based on setup progress
- The setup check function verifies if at least one user exists in the system