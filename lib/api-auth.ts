import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getUserById } from "./auth";
import { User } from "@/types";

export async function authenticateApiRequest(request: NextRequest): Promise<{ user: User | null; response?: NextResponse }> {
  let token = request.cookies.get('token')?.value;

  // If token is not in cookies, check Authorization header (for mobile/API clients)
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  try {
    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const user = await getUserById(decodedToken.userId);
    if (!user) {
      return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    return { user };
  } catch (error) {
    console.error("API authentication error:", error);
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
}
