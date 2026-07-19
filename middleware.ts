import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = [
  '/dashboard',
  '/workspace',
  '/sustainability/dashboard',
  '/sustainability/marketplace',
  '/sustainability/portfolio',
  '/sustainability/impact',
  '/sustainability/reports',
  '/sustainability/notifications',
  '/sustainability/settings',
  '/verifier/dashboard',
  '/projects',
  '/verification-center',
  '/admin',
];

const PUBLIC = [
  '/login',
  '/register',
  '/sustainability/login',
  '/sustainability/register',
  '/verifier/login',
  '/verifier/register',
  '/pending-approval',
  '/_next',
  '/favicon',
  '/api/public',
];

function getLoginRedirect(pathname: string, baseUrl: string) {
  if (pathname.startsWith('/sustainability')) return new URL('/sustainability/login', baseUrl);
  if (pathname.startsWith('/verifier') || pathname.startsWith('/projects') || pathname.startsWith('/verification-center'))
    return new URL('/verifier/login', baseUrl);
  return new URL('/login', baseUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  let user: { user_metadata?: Record<string, unknown> } | null = null;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // getUser() failed (token expired, network error, etc.) — fall back to session cookie check
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        user = session.user as { user_metadata?: Record<string, unknown> };
      }
    } else {
      user = data.user;
    }
  } catch {
    // getUser() threw (network failure, timeout) — fall back to session cookie check
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        user = session.user as { user_metadata?: Record<string, unknown> };
      }
    } catch {
      // getSession() also failed — treat as unauthenticated
    }
  }

  if (!user) {
    return NextResponse.redirect(getLoginRedirect(pathname, request.url));
  }

  const role = user.user_metadata?.role as string | undefined;

  if (pathname.startsWith('/admin') && role && role !== 'admin') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (pathname.startsWith('/dashboard') && role && !['project_owner', 'verifier', 'sustainability_partner', 'admin'].includes(role)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if ((pathname.startsWith('/verifier') || pathname.startsWith('/projects')) && role && role !== 'verifier') {
    return NextResponse.redirect(new URL('/verifier/login', request.url));
  }
  if (pathname.startsWith('/sustainability/dashboard') && role && role !== 'sustainability_partner') {
    return NextResponse.redirect(new URL('/sustainability/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};
