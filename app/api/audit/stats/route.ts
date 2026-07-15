import { NextRequest, NextResponse } from 'next/server';
import { getAuditStats } from '@/services/audit';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const stats = await getAuditStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch audit stats' },
      { status: 500 }
    );
  }
}
