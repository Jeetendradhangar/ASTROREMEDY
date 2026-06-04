import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for the presence of HttpOnly cookies set by Django backend
  const hasToken = request.cookies.has('refresh_token') || request.cookies.has('access_token');

  const isProtectedPath = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isAuthPath = pathname === '/login' || pathname === '/register';

  if (isProtectedPath && !hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isAuthPath && hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/register',
  ],
};
