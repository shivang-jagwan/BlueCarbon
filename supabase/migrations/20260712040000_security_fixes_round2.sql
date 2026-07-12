-- ============================================================
-- SECURITY FIXES — Round 2
-- ============================================================

-- 1. Fix prevent_role_escalation: Allow admin to change role/approval_status
-- ============================================================
DROP TRIGGER IF EXISTS prevent_role_escalation ON profiles;

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Get the role of the user making this change
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  -- Only admins can change role or approval_status
  IF caller_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot change role or approval_status
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.approval_status IS DISTINCT FROM NEW.approval_status) THEN
    RAISE EXCEPTION 'Only administrators can modify role or approval_status';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- 2. Admin RLS policy: admins can read all profiles
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Fix cross-user notification inserts: allow inserts for other users
-- (needed for passport issuance, calendar event notifications, etc.)
-- ============================================================
DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);

-- 4. Add activity_insert_verifier policy: verifiers can insert activity for assigned projects
-- ============================================================
DROP POLICY IF EXISTS "activity_insert_verifier" ON project_activity;
CREATE POLICY "activity_insert_verifier" ON project_activity FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_activity.project_id
        AND projects.verifier_id = auth.uid()
    )
  );

-- 5. Fix storage policies: change foldername index from [2] to [1]
-- Path is: {projectId}/{category}/{uniqueName}
-- ============================================================

-- PROJECT-DOCUMENTS
DROP POLICY IF EXISTS "project_docs_select_project_members" ON storage.objects;
CREATE POLICY "project_docs_select_project_members" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'project-documents' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[1]
        AND (projects.owner_id = auth.uid() OR projects.verifier_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS "project_docs_insert_project_owner" ON storage.objects;
CREATE POLICY "project_docs_insert_project_owner" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'project-documents' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[1]
        AND projects.owner_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "project_docs_delete_project_owner" ON storage.objects;
CREATE POLICY "project_docs_delete_project_owner" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'project-documents' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[1]
        AND projects.owner_id = auth.uid()
    )
  );

-- EVIDENCE
DROP POLICY IF EXISTS "evidence_select_project_members" ON storage.objects;
CREATE POLICY "evidence_select_project_members" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'evidence' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[1]
        AND (projects.owner_id = auth.uid() OR projects.verifier_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS "evidence_insert_project_owner" ON storage.objects;
CREATE POLICY "evidence_insert_project_owner" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'evidence' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[1]
        AND projects.owner_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "evidence_delete_project_owner" ON storage.objects;
CREATE POLICY "evidence_delete_project_owner" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'evidence' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[1]
        AND projects.owner_id = auth.uid()
    )
  );

-- MONTHLY-MONITORING
DROP POLICY IF EXISTS "monitoring_select_project_members" ON storage.objects;
CREATE POLICY "monitoring_select_project_members" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'monthly-monitoring' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[1]
        AND (projects.owner_id = auth.uid() OR projects.verifier_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS "monitoring_insert_project_owner" ON storage.objects;
CREATE POLICY "monitoring_insert_project_owner" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'monthly-monitoring' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[1]
        AND projects.owner_id = auth.uid()
    )
  );

-- REPORTS
DROP POLICY IF EXISTS "reports_select_project_members" ON storage.objects;
CREATE POLICY "reports_select_project_members" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'reports' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[1]
        AND (projects.owner_id = auth.uid() OR projects.verifier_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS "reports_insert_project_owner" ON storage.objects;
CREATE POLICY "reports_insert_project_owner" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'reports' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[1]
        AND projects.owner_id = auth.uid()
    )
  );

-- 6. Add missing indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_saved_projects_project ON saved_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_followed_projects_project ON followed_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by ON project_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_monitoring_reports_created_by ON monitoring_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_verification_decisions_verifier ON verification_decisions(verifier_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_author ON discussion_comments(author_id);
