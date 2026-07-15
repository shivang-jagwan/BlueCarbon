import { NextRequest, NextResponse } from 'next/server';
import { getIdentityVerificationStats } from '@/services/identity';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const stats = await getIdentityVerificationStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch identity stats' },
      { status: 500 }
    );
  }
}
