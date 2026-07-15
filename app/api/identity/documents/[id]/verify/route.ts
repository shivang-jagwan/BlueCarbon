import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { verifyIdentityDocument } from '@/services/identity';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const verifiedBy = auth.user.id;
    const { decision, reason } = body;

    if (!decision) {
      return NextResponse.json(
        { error: 'decision is required' },
        { status: 400 }
      );
    }

    const document = await verifyIdentityDocument(id, verifiedBy, decision, reason);
    return NextResponse.json({ document });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify document' },
      { status: 500 }
    );
  }
}
