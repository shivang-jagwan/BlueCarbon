import { NextRequest, NextResponse } from 'next/server';
import { resolveSecurityEvent } from '@/services/identity';
import { requireAdmin } from '@/lib/api-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const resolvedBy = auth.user.id;

    const event = await resolveSecurityEvent(id, resolvedBy);
    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resolve security event' },
      { status: 500 }
    );
  }
}
