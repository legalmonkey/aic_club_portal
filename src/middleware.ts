import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: any) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || 'aic-portal-super-secret-key-32-chars-minimum-vit' });
  const { pathname } = req.nextUrl;

  // Allow auth APIs, static assets, and login pages
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login' ||
    pathname === '/login/error'
  ) {
    return NextResponse.next();
  }

  // Not authenticated -> redirect to login
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = (token.role as string) || 'member';

  // First-time member onboarding check:
  // If role is member and has not yet selected a department, force onboarding
  const isMemberWithoutDept = role === 'member' && (!token.departmentId || token.isOnboarded === false);
  if (isMemberWithoutDept && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  // If already onboarded member visits /onboarding, send to dashboard
  if (!isMemberWithoutDept && pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/member/dashboard', req.url));
  }

  // Super admin routes
  if (pathname.startsWith('/admin') && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/member/dashboard', req.url));
  }

  // Lead routes
  if (pathname.startsWith('/lead') && role !== 'lead' && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/member/dashboard', req.url));
  }

  // Board routes
  if (pathname.startsWith('/board') && role !== 'board' && role !== 'super_admin' && role !== 'lead') {
    return NextResponse.redirect(new URL('/member/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/member/:path*',
    '/lead/:path*',
    '/board/:path*',
    '/admin/:path*',
    '/onboarding/:path*',
  ],
};
