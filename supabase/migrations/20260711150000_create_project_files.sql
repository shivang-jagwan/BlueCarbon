-- Create project_files table as a replacement for project_documents
CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text,
  category text NOT NULL,
  storage_path text NOT NULL,
  public_url text,
  file_size bigint,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_category ON project_files(category);

-- Enable RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Owner can do everything for their own projects
CREATE POLICY "files_owner_all" ON project_files FOR ALL
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND projects.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND projects.owner_id = auth.uid()));

-- Verifier can select files for assigned projects
CREATE POLICY "files_verifier_select" ON project_files FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND projects.verifier_id = auth.uid()));

-- Sustainability Partner can select files for funded projects
CREATE POLICY "files_partner_select" ON project_files FOR SELECT
  USING (EXISTS (SELECT 1 FROM funding_contributions WHERE funding_contributions.project_id = project_files.project_id AND funding_contributions.partner_id = auth.uid()));


-- Create Storage Buckets (Storage must be enabled in Supabase)
-- Insert standard buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('profile-documents', 'profile-documents', false),
  ('project-documents', 'project-documents', false),
  ('evidence', 'evidence', false),
  ('monthly-monitoring', 'monthly-monitoring', false),
  ('reports', 'reports', false),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Authenticated Users (Basic implementation)
-- Note: In a true production environment with Storage RLS enabled, these policies would be applied to storage.objects.
-- We ensure the schema exists for them just in case.

-- Enable RLS on storage.objects if it's not already
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- For now we will allow authenticated users to upload and select to these buckets.

CREATE POLICY "Give authenticated users full access to avatars" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Give authenticated users full access to profile-documents" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'profile-documents') WITH CHECK (bucket_id = 'profile-documents');
CREATE POLICY "Give authenticated users full access to project-documents" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'project-documents') WITH CHECK (bucket_id = 'project-documents');
CREATE POLICY "Give authenticated users full access to evidence" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'evidence') WITH CHECK (bucket_id = 'evidence');
CREATE POLICY "Give authenticated users full access to monthly-monitoring" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'monthly-monitoring') WITH CHECK (bucket_id = 'monthly-monitoring');
CREATE POLICY "Give authenticated users full access to reports" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'reports') WITH CHECK (bucket_id = 'reports');

-- Migrate data from project_documents to project_files if any exists
INSERT INTO project_files (id, project_id, uploaded_by, file_name, file_type, category, storage_path, public_url, file_size, mime_type, created_at)
SELECT 
  id, project_id, uploaded_by, name, 'document', category, file_path, null, file_size, mime_type, created_at
FROM project_documents
ON CONFLICT DO NOTHING;
