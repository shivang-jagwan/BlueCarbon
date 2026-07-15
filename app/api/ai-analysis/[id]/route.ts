import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/api-auth';
import {
  getAiAnalysisById,
  updateAiAnalysis,
  deleteAiAnalysis,
} from '@/services/ai-analysis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const analysis = await getAiAnalysisById(id);
  if (!analysis) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
  }
  return NextResponse.json({ analysis });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'At least one field required' }, { status: 400 });
    }
    const analysis = await updateAiAnalysis(id, body);
    return NextResponse.json({ analysis });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await deleteAiAnalysis(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete' },
      { status: 500 }
    );
  }
}
