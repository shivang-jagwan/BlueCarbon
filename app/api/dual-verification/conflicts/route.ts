import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/api-auth';
import { getActiveConflicts } from '@/services/dual-verification';

export async function GET(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as string | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await getActiveConflicts({
      severity: status as any,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch conflicts' },
      { status: 500 }
    );
  }
}
