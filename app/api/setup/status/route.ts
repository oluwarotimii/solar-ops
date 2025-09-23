import { NextRequest } from 'next/server';
import { isSetupComplete } from '@/lib/setup-check';

export async function GET(request: NextRequest) {
  try {
    // For new database setup, always allow access to setup
    return Response.json({ setupComplete: false });
    
    // const setupComplete = await isSetupComplete();
    // return Response.json({ setupComplete });
  } catch (error) {
    console.error('Error checking setup status:', error);
    return Response.json({ setupComplete: false });
  }
}