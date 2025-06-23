import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    // Get default technician role
    const technicianRole = await sql`
      SELECT id FROM roles WHERE name = 'Technician'
    `

    if (technicianRole.length === 0) {
      return NextResponse.json({ error: "System error: Default role not found" }, { status: 500 })
    }

    const hashedPassword = await hashPassword(password)

    const result = await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, status)
      VALUES (${email}, ${hashedPassword}, ${firstName}, ${lastName}, ${phone || null}, ${technicianRole[0].id}, 'pending')
      RETURNING id
    `

    return NextResponse.json({
      message: "Registration successful. Awaiting approval.",
      userId: result[0].id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
