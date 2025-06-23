import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, verifyPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (user.status === "pending") {
      return NextResponse.json({ error: "Account pending approval" }, { status: 401 })
    }

    if (user.status !== "active") {
      return NextResponse.json({ error: "Account is inactive" }, { status: 401 })
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = generateToken(user.id)

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user

    return NextResponse.json({
      token,
      user: safeUser,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
