-- ============================================================
-- MIGRATION: Terminology Refactor
-- ============================================================
-- Renames tables to align with enterprise terminology:
--   verification_requests     → verification_service_requests
--   verification_decisions    → verification_service_decisions
--   funding_contributions     → project_support
--
-- Updates all foreign keys, indexes, RLS policies, triggers,
-- and helper functions that reference the old names.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. RENAME TABLES
-- ============================================================

ALTER TABLE verification_requests RENAME TO verification_service_requests;
ALTER TABLE verification_decisions RENAME TO verification_service_decisions;
ALTER TABLE funding_contributions RENAME TO project_support;

-- ============================================================
-- 2. RENAME INDEXES
-- ============================================================

ALTER INDEX idx_verif_requests_verifier RENAME TO idx_verif_service_requests_verifier;
ALTER INDEX idx_verif_requests_project RENAME TO idx_verif_service_requests_project;
ALTER INDEX idx_verif_requests_status RENAME TO idx_verif_service_requests_status;
ALTER INDEX idx_verif_requests_type RENAME TO idx_verif_service_requests_type;

ALTER INDEX idx_verif_decisions_request RENAME TO idx_verif_service_decisions_request;
ALTER INDEX idx_verification_decisions_verifier RENAME TO idx_verif_service_decisions_verifier;

ALTER INDEX idx_funding_project RENAME TO idx_project_support_project;
ALTER INDEX idx_funding_partner RENAME TO idx_project_support_partner;

-- ============================================================
-- 3. UPDATE FK in verification_service_decisions
-- The old FK: request_id REFERENCES verification_requests(id)
-- PostgreSQL handles FK rename automatically, but we verify.
-- ============================================================

-- Drop and recreate FK to be explicit (PostgreSQL may auto-update, but safe to enforce)
ALTER TABLE verification_service_decisions
  DROP CONSTRAINT IF EXISTS verification_decisions_request_id_fkey;

ALTER TABLE verification_service_decisions
  ADD CONSTRAINT verification_service_decisions_request_id_fkey
  FOREIGN KEY (request_id) REFERENCES verification_service_requests(id) ON DELETE CASCADE;

-- ============================================================
-- 4. DROP AND RECREATE RLS POLICIES — verification_service_requests
-- ============================================================

-- Drop old policies
DROP POLICY IF EXISTS verif_req_select_verifier ON verification_service_requests;
DROP POLICY IF EXISTS verif_req_update_verifier ON verification_service_requests;
DROP POLICY IF EXISTS verif_req_insert_verifier ON verification_service_requests;
DROP POLICY IF EXISTS verif_req_select_owner ON verification_service_requests;
DROP POLICY IF EXISTS verif_req_select_partner ON verification_service_requests;
DROP POLICY IF EXISTS verif_req_insert_owner ON verification_service_requests;

-- Recreate policies with new table name
CREATE POLICY verif_req_select_verifier ON verification_service_requests
  FOR SELECT TO authenticated USING (auth.uid() = verifier_id);

CREATE POLICY verif_req_update_verifier ON verification_service_requests
  FOR UPDATE TO authenticated USING (auth.uid() = verifier_id) WITH CHECK (auth.uid() = verifier_id);

CREATE POLICY verif_req_insert_verifier ON verification_service_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = verifier_id);

CREATE POLICY verif_req_select_owner ON verification_service_requests
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = verification_service_requests.project_id
        AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY verif_req_select_partner ON verification_service_requests
  FOR SELECT TO authenticated USING (auth.uid() = corporate_partner_id);

CREATE POLICY verif_req_insert_owner ON verification_service_requests
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = verification_service_requests.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 5. DROP AND RECREATE RLS POLICIES — verification_service_decisions
-- ============================================================

DROP POLICY IF EXISTS verif_dec_insert_verifier ON verification_service_decisions;
DROP POLICY IF EXISTS verif_dec_select_verifier ON verification_service_decisions;
DROP POLICY IF EXISTS verif_dec_select_owner ON verification_service_decisions;
DROP POLICY IF EXISTS verif_dec_select_partner ON verification_service_decisions;

CREATE POLICY verif_dec_insert_verifier ON verification_service_decisions
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM verification_service_requests
      WHERE verification_service_requests.id = verification_service_decisions.request_id
        AND verification_service_requests.verifier_id = auth.uid()
    )
  );

CREATE POLICY verif_dec_select_verifier ON verification_service_decisions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM verification_service_requests
      WHERE verification_service_requests.id = verification_service_decisions.request_id
        AND verification_service_requests.verifier_id = auth.uid()
    )
  );

CREATE POLICY verif_dec_select_owner ON verification_service_decisions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM verification_service_requests
      JOIN projects ON projects.id = verification_service_requests.project_id
      WHERE verification_service_requests.id = verification_service_decisions.request_id
        AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY verif_dec_select_partner ON verification_service_decisions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM verification_service_requests
      WHERE verification_service_requests.id = verification_service_decisions.request_id
        AND verification_service_requests.corporate_partner_id = auth.uid()
    )
  );

-- ============================================================
-- 6. DROP AND RECREATE RLS POLICIES — project_support
-- ============================================================

DROP POLICY IF EXISTS funding_select_partner ON project_support;
DROP POLICY IF EXISTS funding_insert_partner ON project_support;
DROP POLICY IF EXISTS funding_update_partner ON project_support;
DROP POLICY IF EXISTS funding_select_owner ON project_support;

CREATE POLICY support_select_partner ON project_support
  FOR SELECT TO authenticated USING (auth.uid() = partner_id);

CREATE POLICY support_insert_partner ON project_support
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = partner_id);

CREATE POLICY support_update_partner ON project_support
  FOR UPDATE TO authenticated USING (auth.uid() = partner_id) WITH CHECK (auth.uid() = partner_id);

CREATE POLICY support_select_owner ON project_support
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_support.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 7. RECREATE updated_at TRIGGER for verification_service_requests
-- ============================================================

DROP TRIGGER IF EXISTS verif_req_updated_at ON verification_service_requests;
CREATE TRIGGER verif_req_updated_at
  BEFORE UPDATE ON verification_service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 8. UPDATE FUNCTIONS that reference old table names
-- ============================================================

-- is_project_verifier_via_request() references verification_requests
CREATE OR REPLACE FUNCTION is_project_verifier_via_request(p_id uuid, u_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM verification_service_requests
    WHERE project_id = p_id
      AND verifier_id = u_id
      AND status IN ('pending', 'in_review', 'changes_requested')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 9. UPDATE RLS policies that reference old table names in subqueries
-- ============================================================

-- project_documents: docs_select_verifier references verification_requests
DROP POLICY IF EXISTS docs_select_verifier ON project_documents;
CREATE POLICY docs_select_verifier ON project_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_documents.project_id
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- project_files: files_verifier_select references verification_requests
DROP POLICY IF EXISTS files_verifier_select ON project_files;
CREATE POLICY files_verifier_select ON project_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_files.project_id
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- monitoring_reports: monitoring_select_verifier
DROP POLICY IF EXISTS monitoring_select_verifier ON monitoring_reports;
CREATE POLICY monitoring_select_verifier ON monitoring_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = monitoring_reports.project_id
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- monitoring_reports: monitoring_update_verifier
DROP POLICY IF EXISTS monitoring_update_verifier ON monitoring_reports;
CREATE POLICY monitoring_update_verifier ON monitoring_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = monitoring_reports.project_id
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- discussion_comments: discussion_select_verifier
DROP POLICY IF EXISTS discussion_select_verifier ON discussion_comments;
CREATE POLICY discussion_select_verifier ON discussion_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = discussion_comments.project_id
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- discussion_comments: discussion_insert_verifier
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

-- project_activity: activity_select_verifier
DROP POLICY IF EXISTS activity_select_verifier ON project_activity;
CREATE POLICY activity_select_verifier ON project_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_activity.project_id
        AND (is_project_verifier_via_request(id, auth.uid()) OR is_project_monitoring_partner(id, auth.uid()))
    )
  );

-- project_activity: activity_insert_verifier
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

-- calendar_events: events_select_policy
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

-- carbon_passports: passports_select_policy
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

-- projects: projects_select_verifier_access
DROP POLICY IF EXISTS projects_select_verifier_access ON projects;
CREATE POLICY projects_select_verifier_access ON projects
  FOR SELECT USING (
    is_project_verifier_via_request(id, auth.uid())
    OR is_project_monitoring_partner(id, auth.uid())
  );

-- Storage policies that reference old table names via subqueries
-- project-documents bucket
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

-- project_files storage
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

-- evidence bucket
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

-- monthly-monitoring bucket
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

-- reports bucket
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

COMMIT;
