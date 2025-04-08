import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define public paths that don't require authentication
const publicPaths = ['/auth/login', '/auth/signup'];

// Define help desk paths
const helpdeskPaths = ['/helpdesk/dashboard'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // If we're at the root path, check if user is authenticated and redirect to app content
  if (pathname === '/') {
    const token = request.cookies.get('token')?.value;
    
    // If user has a valid token, let them access the home page
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret);
        return NextResponse.next();
      } catch (error) {
        // Token is invalid, continue with normal logic
      }
    }
    // If no token or invalid token, it's fine to show the landing page
    return NextResponse.next();
  }

  // Allow access to public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for help desk paths
  if (helpdeskPaths.some(path => pathname.startsWith(path))) {
    const helpdeskToken = request.cookies.get('helpdesk_token')?.value;

    if (!helpdeskToken) {
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(helpdeskToken, secret);

      if (payload.role !== 'helpdesk') {
        const loginUrl = new URL('/auth/login', request.url);
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    } catch (error) {
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Regular user authentication check
  const token = request.cookies.get('token')?.value;

  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // If user is authenticated as helpdesk but trying to access regular user routes
    if (payload.role === 'helpdesk') {
      const loginUrl = new URL('/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (error) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
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