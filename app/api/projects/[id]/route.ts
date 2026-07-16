import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/api-auth';

const STORAGE_BUCKETS = [
  'project-cover-images',
  'project-gallery',
  'project-files',
  'evidence-verified',
  'evidence-uploaded',
  'land-documents',
  'verification-evidence',
];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const { supabase, response } = auth;

    // Fetch project to verify ownership and get storage paths
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, owner_id, cover_image_url')
      .eq('id', id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Only owner or admin can delete
    if (auth.user.role !== 'admin' && project.owner_id !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Clean up storage files for this project (best-effort, don't block on errors)
    for (const bucket of STORAGE_BUCKETS) {
      try {
        const { data: files } = await supabase.storage.from(bucket).list(id, {
          limit: 1000,
        });
        if (files && files.length > 0) {
          const paths = files.map((f) => `${id}/${f.name}`);
          await supabase.storage.from(bucket).remove(paths);
        }
      } catch {
        // Storage cleanup is best-effort — bucket may not exist
      }
    }

    // Delete the project row — all 25 related tables cascade via ON DELETE CASCADE
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Failed to delete project:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
