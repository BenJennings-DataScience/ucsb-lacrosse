import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'auth_token';
const AUTH_VALUE = 'ucsb_lacrosse_authenticated';
const PASSWORD = 'cockroach';
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const password = body.get('password');
  const from = body.get('from') as string | null;

  if (password !== PASSWORD) {
    const loginUrl = new URL('/login', request.url);
    if (from) loginUrl.searchParams.set('from', from);
    loginUrl.searchParams.set('error', '1');
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const redirectTo = from && from.startsWith('/') ? from : '/';
  const response = NextResponse.redirect(new URL(redirectTo, request.url), { status: 303 });

  response.cookies.set(AUTH_COOKIE, AUTH_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: THIRTY_DAYS,
    path: '/',
  });

  return response;
}
