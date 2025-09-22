import { NextResponse } from 'next/server';
import { isSetupComplete } from '@/lib/setup-check';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes and static assets
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return NextResponse.next();
  }
  
  // Check if setup is complete
  const setupComplete = await isSetupComplete();
  
  // If setup is complete and user is trying to access setup page, redirect to login
  if (setupComplete && pathname === '/setup') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If setup is not complete and user is trying to access other pages, redirect to setup
  if (!setupComplete && pathname !== '/setup' && pathname !== '/') {
    return NextResponse.redirect(new URL('/setup', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};