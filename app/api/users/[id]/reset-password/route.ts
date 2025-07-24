import { type NextRequest, NextResponse } from "next/server";
import { getDbSql, sql } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import crypto from "crypto";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Generate a random password (e.g., 12 characters long)
    const newPassword = crypto.randomBytes(6).toString("hex"); // 6 bytes = 12 hex chars

    const hashedPassword = await hashPassword(newPassword);

    const db = getDbSql();
    const result = await db`
      UPDATE users
      SET password_hash = ${hashedPassword}
      WHERE id = ${id}
      RETURNING id;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Password reset successfully",
      newPassword: newPassword, // IMPORTANT: In a real application, you would typically email this to the user or use a secure one-time link. Returning it directly is for admin convenience/testing.
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}