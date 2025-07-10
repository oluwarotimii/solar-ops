import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, verifyPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log(`[Auth Debug] Login attempt for email: ${email}`);

    if (!email || !password) {
      console.log(`[Auth Debug] Missing email or password.`);
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      console.log(`[Auth Debug] User not found in DB for email: ${email}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (user.status === "pending") {
      console.log(`[Auth Debug] Account pending approval for email: ${email}`);
      return NextResponse.json({ error: "Account pending approval" }, { status: 401 })
    }

    if (user.status !== "active") {
      console.log(`[Auth Debug] Account inactive for email: ${email}, status: ${user.status}`);
      return NextResponse.json({ error: "Account is inactive" }, { status: 401 })
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      console.log(`[Auth Debug] Invalid password for email: ${email}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = generateToken(user.id)

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user

    console.log(`[Auth Debug] Login successful for email: ${email}`);
    return NextResponse.json({
      token,
      user: safeUser,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
