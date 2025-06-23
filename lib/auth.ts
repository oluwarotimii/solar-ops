import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sql, toCamelCase } from "./db"
import type { User } from "@/types"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
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
    const result = await sql`
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
    const result = await sql`
      SELECT u.*, r.name as role_name, r.description as role_description, 
             r.is_admin as role_is_admin, r.permissions as role_permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ${email}
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
    console.error("Error getting user by email:", error)
    return null
  }
}

export function hasPermission(user: User, permission: string): boolean {
  if (!user.role) return false
  if (user.role.isAdmin) return true

  const permissions = user.role.permissions
  if (permissions.all) return true

  return permissions[permission] === true
}

export function canAccessJob(user: User, job: any): boolean {
  if (!user.role) return false
  if (user.role.isAdmin) return true

  const permissions = user.role.permissions
  if (permissions.jobs === true) return true
  if (permissions.jobs === "assigned_only" && job.assignedTo === user.id) return true

  return false
}
