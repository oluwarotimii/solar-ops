import { NextRequest, NextResponse } from 'next/server';
import { isSetupComplete } from '@/lib/setup-check';

export async function GET(request: NextRequest) {
  try {
    const setupComplete = await isSetupComplete();

    // Return the actual setup status
    return NextResponse.json({ setupComplete });
  } catch (error) {
    console.error('Error checking setup status:', error);

    // In case of error, assume setup is not complete
    return NextResponse.json({ setupComplete: false });
  }
}
