-- ============================================================
-- MIGRATION: Architectural Refactor — Separate Temporary 
-- Verification from Permanent Monitoring Partnerships
-- ============================================================
-- This migration:
-- 1. Adds owner_id, started_at, ended_at to project_partnerships
-- 2. Tightens is_project_verifier_via_request to ACTIVE requests only
-- 3. Adds admin SELECT policy on projects
-- 4. Updates partnership RLS for proper owner/verifier accept flow
-- 5. Ensures verifiers only see monitoring projects permanently

BEGIN;

-- ============================================================
-- 1. ENHANCE project_partnerships TABLE
-- ============================================================

-- Add owner_id (denormalized from projects for efficient RLS)
ALTER TABLE project_partnerships 
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- Backfill owner_id from projects table
UPDATE project_partnerships pp
SET owner_id = p.owner_id
FROM projects p
WHERE pp.project_id = p.id AND pp.owner_id IS NULL;

-- Make owner_id NOT NULL after backfill
ALTER TABLE project_partnerships 
  ALTER COLUMN owner_id SET NOT NULL;

-- Add started_at / ended_at for lifecycle tracking
ALTER TABLE project_partnerships 
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz;

-- Backfill started_at from start_date for active partnerships
UPDATE project_partnerships
SET started_at = start_date::timestamptz
WHERE status = 'active' AND started_at IS NULL AND start_date IS NOT NULL;

-- ============================================================
-- 2. FIX is_project_verifier_via_request()
-- Only return true for ACTIVE (non-completed) requests.
-- After a request is approved/rejected, verifier loses 
-- temporary access to the project.
-- ============================================================

CREATE OR REPLACE FUNCTION is_project_verifier_via_request(p_id uuid, u_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM verification_requests
    WHERE project_id = p_id 
      AND verifier_id = u_id
      AND status IN ('pending', 'in_review', 'changes_requested')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 3. ADD is_project_owner_via_partnership() FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION is_project_owner_via_partnership(p_id uuid, u_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_partnerships
    WHERE project_id = p_id 
      AND owner_id = u_id 
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 4. ADD ADMIN SELECT POLICY ON PROJECTS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'projects_select_admin' 
    AND tablename = 'projects'
  ) THEN
    CREATE POLICY projects_select_admin ON projects
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================
-- 5. UPDATE project_partnerships RLS
-- ============================================================

-- Drop old combined update policy if it exists
DROP POLICY IF EXISTS partnerships_update ON project_partnerships;

-- Owner can update (accept/reject) partnerships for their projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'partnerships_update_owner' 
    AND tablename = 'project_partnerships'
  ) THEN
    CREATE POLICY partnerships_update_owner ON project_partnerships
      FOR UPDATE USING (
        owner_id = auth.uid()
      );
  END IF;
END $$;

-- Verifier can update (accept/reject) partnerships assigned to them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'partnerships_update_verifier' 
    AND tablename = 'project_partnerships'
  ) THEN
    CREATE POLICY partnerships_update_verifier ON project_partnerships
      FOR UPDATE USING (
        verifier_id = auth.uid()
      );
  END IF;
END $$;

-- ============================================================
-- 6. ADD INDEXES FOR PARTNERSHIP QUERIES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_project_partnerships_verifier_status 
  ON project_partnerships(verifier_id, status);

CREATE INDEX IF NOT EXISTS idx_project_partnerships_owner_status 
  ON project_partnerships(owner_id, status);

CREATE INDEX IF NOT EXISTS idx_project_partnerships_project_status 
  ON project_partnerships(project_id, status);

-- ============================================================
-- 7. CLEAN UP projects.verifier_id
-- The projects.verifier_id column is NEVER set by any frontend 
-- code. It conflates temporary verification with permanent 
-- monitoring. Remove it to enforce the architectural boundary.
-- ============================================================

-- Drop the column and its dependent policies
ALTER TABLE projects DROP COLUMN IF EXISTS verifier_id;

-- Drop policies that referenced verifier_id directly
DROP POLICY IF EXISTS projects_select_assigned_verifier ON projects;
DROP POLICY IF EXISTS projects_update_verifier ON projects;
DROP POLICY IF EXISTS projects_select_verifier_access ON projects;

-- Recreate verifier access policy using ONLY the functions
-- (temporary via active requests, permanent via active partnerships)
CREATE POLICY projects_select_verifier_access ON projects
  FOR SELECT USING (
    is_project_verifier_via_request(id, auth.uid()) OR
    is_project_monitoring_partner(id, auth.uid())
  );

-- ============================================================
-- 8. UPDATE STORAGE POLICIES THAT REFERENCED verifier_id
-- ============================================================

-- The storage policies used projects.verifier_id directly.
-- Now they must use the functions instead.

-- Project Documents
DROP POLICY IF EXISTS docs_select_verifier ON storage.objects;
CREATE POLICY docs_select_verifier ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-documents' 
    AND EXISTS (
      SELECT 1 FROM projects 
      WHERE id::text = (storage.foldername(name))[1]
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- Project Files
DROP POLICY IF EXISTS files_verifier_select ON storage.objects;
CREATE POLICY files_verifier_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-documents'
    AND EXISTS (
      SELECT 1 FROM projects 
      WHERE id::text = (storage.foldername(name))[1]
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- Evidence
DROP POLICY IF EXISTS evidence_select_project_members ON storage.objects;
CREATE POLICY evidence_select_project_members ON storage.objects
  FOR SELECT USING (
    bucket_id = 'evidence'
    AND EXISTS (
      SELECT 1 FROM projects 
      WHERE id::text = (storage.foldername(name))[1]
        AND (owner_id = auth.uid() OR is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- Monthly Monitoring
DROP POLICY IF EXISTS monitoring_select_project_members ON storage.objects;
CREATE POLICY monitoring_select_project_members ON storage.objects
  FOR SELECT USING (
    bucket_id = 'monthly-monitoring'
    AND EXISTS (
      SELECT 1 FROM projects 
      WHERE id::text = (storage.foldername(name))[1]
        AND (owner_id = auth.uid() OR is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- Reports
DROP POLICY IF EXISTS reports_select_project_members ON storage.objects;
CREATE POLICY reports_select_project_members ON storage.objects
  FOR SELECT USING (
    bucket_id = 'reports'
    AND EXISTS (
      SELECT 1 FROM projects 
      WHERE id::text = (storage.foldername(name))[1]
        AND (owner_id = auth.uid() OR is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- ============================================================
-- 9. UPDATE document/file RLS that referenced verifier_id
-- ============================================================

-- project_documents: drop old verifier policy, recreate with functions
DROP POLICY IF EXISTS docs_select_verifier ON project_documents;
CREATE POLICY docs_select_verifier ON project_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_documents.project_id
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- project_files: same treatment
DROP POLICY IF EXISTS files_verifier_select ON project_files;
CREATE POLICY files_verifier_select ON project_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_files.project_id
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- monitoring_reports: same treatment
DROP POLICY IF EXISTS monitoring_select_verifier ON monitoring_reports;
CREATE POLICY monitoring_select_verifier ON monitoring_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = monitoring_reports.project_id
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

DROP POLICY IF EXISTS monitoring_update_verifier ON monitoring_reports;
CREATE POLICY monitoring_update_verifier ON monitoring_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = monitoring_reports.project_id
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- discussion_comments: same treatment
DROP POLICY IF EXISTS discussion_select_verifier ON discussion_comments;
CREATE POLICY discussion_select_verifier ON discussion_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = discussion_comments.project_id
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

DROP POLICY IF EXISTS discussion_insert_verifier ON discussion_comments;
CREATE POLICY discussion_insert_verifier ON discussion_comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects 
      WHERE id = discussion_comments.project_id
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- activity: same treatment
DROP POLICY IF EXISTS activity_select_verifier ON project_activity;
CREATE POLICY activity_select_verifier ON project_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_activity.project_id
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

DROP POLICY IF EXISTS activity_insert_verifier ON project_activity;
CREATE POLICY activity_insert_verifier ON project_activity
  FOR INSERT WITH CHECK (
    actor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_activity.project_id
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- calendar_events: update verifier check
DROP POLICY IF EXISTS events_select_policy ON calendar_events;
CREATE POLICY events_select_policy ON calendar_events
  FOR SELECT USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE id = calendar_events.project_id
        AND (
          owner_id = auth.uid()
          OR is_project_verifier_via_request(id, auth.uid())
          OR is_project_monitoring_partner(id, auth.uid())
        )
    )
    OR (
      project_id IS NULL
      AND (created_by = auth.uid() OR assigned_to = auth.uid())
    )
  );

-- carbon_passports: update verifier check
DROP POLICY IF EXISTS passports_select_policy ON carbon_passports;
CREATE POLICY passports_select_policy ON carbon_passports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects WHERE id = carbon_passports.project_id
        AND (
          owner_id = auth.uid()
          OR is_project_verifier_via_request(id, auth.uid())
          OR is_project_monitoring_partner(id, auth.uid())
        )
    )
    OR (
      project_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM projects 
        WHERE id = carbon_passports.project_id 
          AND status IN ('verified', 'active', 'completed')
      )
    )
    OR issued_by = auth.uid()
  );

COMMIT;
