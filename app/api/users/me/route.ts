import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await authenticateApiRequest(request);
    if (response) {
      return response; // Handles cases where user is not authenticated
    }
    
    // The user object from authenticateApiRequest contains all necessary details
    // including role and permissions.
    return NextResponse.json(user);

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
