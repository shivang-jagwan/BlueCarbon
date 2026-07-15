import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs } from '@/services/audit';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const result = await getAuditLogs({ resourceId: id });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
