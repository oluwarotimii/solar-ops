import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, verifyPassword, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log(`[Auth Debug] Login attempt for email: ${email}`);
    console.log(`[Auth Debug] Received password length: ${password.length}`);

    if (!email || !password) {
      console.log(`[Auth Debug] Missing email or password.`);
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    console.log(`[Auth Debug] User found: ${user ? user.email : 'none'}`);
    if (!user) {
      console.log(`[Auth Debug] User not found in DB for email: ${email}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (user.status !== "active") {
      console.log(`[Auth Debug] Account not active for email: ${email}, status: ${user.status}`);
      return NextResponse.json({ error: "Account pending approval or inactive" }, { status: 401 })
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash)
    console.log(`[Auth Debug] Password verification result: ${isValidPassword}`);
    if (!isValidPassword) {
      console.log(`[Auth Debug] Invalid password for email: ${email}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = generateToken(user.id)
    console.log(`[Auth Debug] Token generated for user ID: ${user.id}`);

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user

    console.log(`[Auth Debug] Login successful for email: ${email}`);

    const response = NextResponse.json({
      user: safeUser,
      email: user.email, // Include user's email in the response
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    console.log(`[Auth Debug] Response cookies set and sending response.`);
    return response;
  }
  catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
