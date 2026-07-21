import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/api-auth';

// Use service role key to bypass RLS for administrative updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { projectId, updates } = body;

    if (!projectId || !updates) {
      return NextResponse.json({ error: 'Missing projectId or updates' }, { status: 400 });
    }

    // In a production scenario, you might want to verify the user has permission
    // to update this project (e.g., they are the assigned agency).
    // For now, we trust the caller (assuming it's called from our UI after validation).

    const { error } = await supabaseAdmin
      .from('projects')
      .update(updates)
      .eq('id', projectId);

    if (error) {
      console.error('[Admin Project Status] Update failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Project Status] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
