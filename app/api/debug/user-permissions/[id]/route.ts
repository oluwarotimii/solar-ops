import { type NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/auth";
import { authenticateApiRequest } from "@/lib/api-auth";

// This is a temporary debug endpoint to check a user's permissions.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authenticate the request to ensure only logged-in users can access it.
    const { user, response } = await authenticateApiRequest(request);
    if (response) return response;

    // For simplicity, allowing any authenticated user to check permissions.
    // In a real scenario, you might want to restrict this to admins.
    if (!user) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const targetUser = await getUserById(id);

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      userId: targetUser.id,
      role: targetUser.role?.name,
      permissions: targetUser.role?.permissions,
    });

  } catch (error) {
    console.error("Debug permissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
