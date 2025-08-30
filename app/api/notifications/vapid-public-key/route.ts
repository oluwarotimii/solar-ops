import { NextResponse } from 'next/server';

export async function GET() {
  if (!process.env.VAPID_PUBLIC_KEY) {
    console.error('VAPID_PUBLIC_KEY is not set in environment variables.');
    return NextResponse.json({ error: 'VAPID public key not configured.' }, { status: 500 });
  }

  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
}
