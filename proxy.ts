import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'auth_token';
const AUTH_VALUE = 'ucsb_lacrosse_authenticated';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and login API through
  if (pathname === '/login' || pathname === '/api/login') {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (token !== AUTH_VALUE) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
