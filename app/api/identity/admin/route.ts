import { NextRequest, NextResponse } from 'next/server';
import { getAllIdentityVerificationsAdmin } from '@/services/identity';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const role = searchParams.get('role') || undefined;
    const search = searchParams.get('search') || undefined;
    const suspiciousOnly = searchParams.get('suspiciousOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await getAllIdentityVerificationsAdmin({
      status: status as any,
      role: role as any,
      search,
      suspiciousOnly,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch identity verifications' },
      { status: 500 }
    );
  }
}
