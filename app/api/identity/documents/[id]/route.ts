import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const { supabase } = auth;

    const { data: document, error } = await supabase
      .from('identity_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch document' },
      { status: 500 }
    );
  }
}
