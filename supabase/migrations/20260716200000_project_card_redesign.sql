-- ============================================================
-- MIGRATION: Project Card Redesign — Database Support
-- ============================================================

-- 1. Add land_verification_status to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS land_verification_status text NOT NULL DEFAULT 'not_requested'
  CHECK (land_verification_status IN (
    'not_requested',
    'requested',
    'verified',
    'rejected'
  ));

CREATE INDEX IF NOT EXISTS idx_projects_land_verification ON projects(land_verification_status);

-- 2. Create project-cover-images storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES
  ('project-cover-images', 'project-cover-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS policies for project-cover-images bucket
-- Public read for authenticated users
DROP POLICY IF EXISTS "cover_images_select" ON storage.objects;
CREATE POLICY "cover_images_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'project-cover-images');

-- Owner can upload
DROP POLICY IF EXISTS "cover_images_insert" ON storage.objects;
CREATE POLICY "cover_images_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-cover-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Owner can update
DROP POLICY IF EXISTS "cover_images_update" ON storage.objects;
CREATE POLICY "cover_images_update" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'project-cover-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Owner can delete
DROP POLICY IF EXISTS "cover_images_delete" ON storage.objects;
CREATE POLICY "cover_images_delete" ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-cover-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE owner_id = auth.uid()
    )
  );

-- Admin full access
DROP POLICY IF EXISTS "cover_images_admin_all" ON storage.objects;
CREATE POLICY "cover_images_admin_all" ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'project-cover-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
