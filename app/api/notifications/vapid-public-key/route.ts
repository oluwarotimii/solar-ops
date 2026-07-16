import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
