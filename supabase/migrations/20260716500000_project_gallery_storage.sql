-- ============================================================
-- Fix: Create project-gallery storage bucket + policies
-- The bucket was never created despite the code referencing it.
-- ============================================================

-- Create bucket (public so gallery images are viewable)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-gallery', 'project-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS pgal_owner_insert ON storage.objects;
DROP POLICY IF EXISTS pgal_owner_select ON storage.objects;
DROP POLICY IF EXISTS pgal_owner_delete ON storage.objects;
DROP POLICY IF EXISTS pgal_public_select ON storage.objects;

-- Owner can upload to their project folder
CREATE POLICY pgal_owner_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-gallery'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Owner can view their project files
CREATE POLICY pgal_owner_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-gallery'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Owner can delete their project files
CREATE POLICY pgal_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-gallery'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Public read access for gallery images
CREATE POLICY pgal_public_select ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'project-gallery');

-- Verifiers in active partnerships can also view
DROP POLICY IF EXISTS pgal_verifier_select ON storage.objects;
CREATE POLICY pgal_verifier_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-gallery'
    AND (storage.foldername(name))[1] IN (
      SELECT project_id::text FROM project_partnerships
      WHERE verifier_id = auth.uid() AND status = 'active'
    )
  );
