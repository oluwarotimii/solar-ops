import { type NextRequest, NextResponse } from "next/server"
import { getDbSql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    const db = getDbSql();
    console.log(`[Register Debug] Attempting to register user: ${email}`);

    // Check if user already exists
    const existingUser = await db`
      SELECT id FROM users WHERE email = ${email}
    `
    console.log(`[Register Debug] Existing user check for ${email}:`, existingUser);

    if (existingUser.length > 0) {
      console.log(`[Register Debug] User already exists: ${email}`);
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Get default technician role
    const technicianRole = await db`
      SELECT id FROM roles WHERE name = 'Technician'
    `
    console.log(`[Register Debug] Technician role found:`, technicianRole);

    if (technicianRole.length === 0) {
      console.log(`[Register Debug] Default role 'Technician' not found.`);
      return NextResponse.json({ error: "System error: Default role not found" }, { status: 500 })
    }

    const hashedPassword = await hashPassword(password)
    console.log(`[Register Debug] Hashed password for ${email}`);

    const result = await db`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, status)
      VALUES (${email}, ${hashedPassword}, ${firstName}, ${lastName}, ${phone || null}, ${technicianRole[0].id}, 'pending')
      RETURNING id
    `
    console.log(`[Register Debug] User inserted, returned ID:`, result[0].id);

    return NextResponse.json({
      message: "Registration successful. Awaiting approval.",
      userId: result[0].id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
