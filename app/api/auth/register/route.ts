import { type NextRequest, NextResponse } from "next/server"
import { getDbSql } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  firstName: z.string().min(2, "First name is required").max(100),
  lastName: z.string().min(2, "Last name is required").max(100),
  phone: z.string().regex(/^\+234\d{10}$/, "Invalid phone number. Please use the format +234 followed by 10 digits (e.g., +2348012345678)."),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { email, password, firstName, lastName, phone } = validation.data;

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

    // Get default user role
    const userRole = await db`
      SELECT id FROM roles WHERE name = 'User'
    `;
    console.log(`[Register Debug] User role found:`, userRole);

    if (userRole.length === 0) {
      console.log(`[Register Debug] Default role 'User' not found.`);
      return NextResponse.json({ error: "System error: Default role not found" }, { status: 500 })
    }

    const hashedPassword = await hashPassword(password);

    // Create the new user
    const result = await db`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id, status)
      VALUES (${email}, ${hashedPassword}, ${firstName}, ${lastName}, ${phone || null}, ${userRole[0].id}, 'pending')
      RETURNING id, email, first_name, last_name, status
    `;

    return NextResponse.json({
      message: "Registration successful. Awaiting approval.",
      userId: result[0].id,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
