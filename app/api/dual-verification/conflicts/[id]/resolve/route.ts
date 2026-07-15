import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { resolveConflict } from '@/services/dual-verification';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const { decision, remarks } = await request.json();
    const adminId = auth.user.id;

    if (!decision || !remarks) {
      return NextResponse.json(
        { error: 'decision and remarks are required' },
        { status: 400 }
      );
    }

    const conflict = await resolveConflict(id, adminId, decision, remarks);
    return NextResponse.json({ conflict });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resolve conflict' },
      { status: 500 }
    );
  }
}
