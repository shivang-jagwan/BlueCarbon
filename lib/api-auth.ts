import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { AppRole } from '@/lib/types';

// ---------------------------------------------------------------------------
// Supabase client from request cookies (for API route handlers)
// ---------------------------------------------------------------------------

export function createApiClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, response: supabaseResponse };
}

// ---------------------------------------------------------------------------
// Auth result types
// ---------------------------------------------------------------------------

interface AuthOk {
  ok: true;
  user: { id: string; email?: string; role: AppRole };
  supabase: ReturnType<typeof createApiClient>['supabase'];
  response: NextResponse;
}

interface AuthError {
  ok: false;
  response: NextResponse;
}

export type AuthResult = AuthOk | AuthError;

// ---------------------------------------------------------------------------
// getSessionUser — validates JWT, returns user with role from profiles table
// ---------------------------------------------------------------------------

export async function getSessionUser(request: NextRequest): Promise<AuthResult> {
  const { supabase, response } = createApiClient(request);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  // Fetch role from profiles table (NOT from user_metadata)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'User profile not found' },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      role: profile.role as AppRole,
    },
    supabase,
    response,
  };
}

// ---------------------------------------------------------------------------
// requireRole — validates JWT + checks role is in allowed list
// ---------------------------------------------------------------------------

export async function requireRole(
  request: NextRequest,
  allowedRoles: AppRole[]
): Promise<AuthResult> {
  const result = await getSessionUser(request);
  if (!result.ok) return result;

  if (!allowedRoles.includes(result.user.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      ),
    };
  }

  return result;
}

// ---------------------------------------------------------------------------
// requireAdmin — shorthand for admin-only endpoints
// ---------------------------------------------------------------------------

export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  return requireRole(request, ['admin']);
}

// ---------------------------------------------------------------------------
// validateBody — parses request JSON and checks required fields
// ---------------------------------------------------------------------------

export async function validateBody<T = Record<string, unknown>>(
  request: NextRequest,
  requiredFields: string[]
): Promise<{ data: T | null; error: NextResponse | null }> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }

  const missing = requiredFields.filter((f) => !body[f]);
  if (missing.length > 0) {
    return {
      data: null,
      error: NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      ),
    };
  }

  return { data: body as T, error: null };
}
