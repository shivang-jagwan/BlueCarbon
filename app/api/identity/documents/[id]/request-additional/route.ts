import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { requestAdditionalDocuments } from '@/services/identity';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const requestedBy = auth.user.id;
    const { requestedDocs } = body;

    if (!requestedDocs) {
      return NextResponse.json(
        { error: 'requestedDocs is required' },
        { status: 400 }
      );
    }

    await requestAdditionalDocuments(id, requestedDocs, requestedBy);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to request additional documents' },
      { status: 500 }
    );
  }
}
