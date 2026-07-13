import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Routes that need login
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

// Routes always public — skip middleware entirely
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes immediately — zero overhead
  if (PUBLIC.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Only process protected routes
  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Create response to pass cookies through
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Create SSR Supabase client — reads from cookies, no DB call
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates JWT from cookie — NO database round trip
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to correct login panel based on path
    if (pathname.startsWith('/sustainability')) {
      return NextResponse.redirect(new URL('/sustainability/login', request.url));
    }
    if (pathname.startsWith('/verifier') || pathname.startsWith('/projects') || pathname.startsWith('/verification-center')) {
      return NextResponse.redirect(new URL('/verifier/login', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role from JWT metadata — still no DB call
  const role = user.user_metadata?.role as string | undefined;

  // Block wrong panel access (only if role is known — unknown roles fall through to layout DB check)
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
    // Skip static files, images, fonts — only process page routes
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};
