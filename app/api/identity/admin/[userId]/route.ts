import { NextRequest, NextResponse } from 'next/server';
import { updateIdentityVerificationStatus } from '@/services/identity';
import { requireAdmin } from '@/lib/api-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { userId } = await params;
    const body = await request.json();
    const { status, notes } = body;
    const reviewedBy = auth.user.id;

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    const verification = await updateIdentityVerificationStatus(userId, status, reviewedBy, notes);
    return NextResponse.json({ verification });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update verification status' },
      { status: 500 }
    );
  }
}
