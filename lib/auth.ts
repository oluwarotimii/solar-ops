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
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    console.log(`[Auth Debug] Token verified successfully for userId: ${decoded.userId}`);
    return decoded;
  } catch (error) {
    console.error(`[Auth Debug] Token verification failed:`, error);
    return null;
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
        permissions: user.rolePermissions,
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

  // Check for the specific permission
  const permissionParts = permission.split(':');
  let currentPermission = user.role.permissions;

  for (const part of permissionParts) {
    if (currentPermission[part] === undefined) {
      return false;
    }
    if (typeof currentPermission[part] === 'boolean') {
      return currentPermission[part];
    }
    currentPermission = currentPermission[part];
  }

  return false;
}
