/*
# CarbonRush AI — Verifier Workspace Schema

## Overview
Extends the database for the Verifier workspace: verifier-specific profile fields,
verification requests, verification decisions, and discussion comments.

## Modified Tables

1. **profiles** — Added verifier-specific columns:
   - organization_type (text) — NGO, government, auditor, university, etc.
   - registration_number (text) — official registration number
   - website (text) — organization website
   - designation (text) — authorized representative's title
   - office_address (text) — full office address
   - services_offered (text[]) — array of verification services
   - team_members (jsonb) — team member info
   - rating (numeric) — public rating
   - projects_verified_count (integer) — counter
   - pricing_info (jsonb) — service pricing
   - availability_status (text) — accepting/limited/unavailable

## New Tables

1. **verification_requests** — Incoming verification requests to verifiers.
   - id, project_id (FK), verifier_id (FK), request_type (land/project/corporate/monthly),
     priority (high/medium/low), status (pending/in_review/approved/rejected/changes_requested),
     due_date, corporate_partner_id (FK, nullable), description, created_at, updated_at.

2. **verification_decisions** — Permanent audit trail of every decision.
   - id, request_id (FK), verifier_id (FK), decision (approved/rejected/changes_requested),
     remarks, justification, file_path, created_at.

3. **discussion_comments** — Thread-based communication in project workspaces.
   - id, project_id (FK), author_id (FK), parent_id (self-ref for replies),
     body, attachments (jsonb), created_at.

## Security (RLS)
- verification_requests: verifiers can CRUD their own requests; owners can read
  requests for their projects; partners can read corporate requests they initiated.
- verification_decisions: verifiers insert; owners and assigned verifiers can read.
- discussion_comments: owners, verifiers, and partners (for verified projects) can
  read and insert comments.

## Notes
1. All new columns nullable to avoid breaking existing rows.
2. verification_requests.request_type uses CHECK constraint.
3. discussion_comments.parent_id allows threaded replies (nullable for top-level).
*/

-- ============================================================
-- EXTEND PROFILES TABLE — Verifier fields
-- ============================================================
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN organization_type text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN registration_number text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN website text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN designation text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN office_address text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN services_offered text[];
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN team_members jsonb;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN rating numeric DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN projects_verified_count integer DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN pricing_info jsonb;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN availability_status text NOT NULL DEFAULT 'accepting'
    CHECK (availability_status IN ('accepting','limited','unavailable'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================================
-- VERIFICATION REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  verifier_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type text NOT NULL
    CHECK (request_type IN ('land','project','corporate','monthly')),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high','medium','low')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_review','approved','rejected','changes_requested')),
  due_date date,
  corporate_partner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verif_requests_verifier ON verification_requests(verifier_id);
CREATE INDEX IF NOT EXISTS idx_verif_requests_project ON verification_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_verif_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verif_requests_type ON verification_requests(request_type);

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Verifiers can see and manage their own requests
DROP POLICY IF EXISTS "verif_req_select_verifier" ON verification_requests;
CREATE POLICY "verif_req_select_verifier" ON verification_requests FOR SELECT
  TO authenticated USING (auth.uid() = verifier_id);

DROP POLICY IF EXISTS "verif_req_update_verifier" ON verification_requests;
CREATE POLICY "verif_req_update_verifier" ON verification_requests FOR UPDATE
  TO authenticated USING (auth.uid() = verifier_id) WITH CHECK (auth.uid() = verifier_id);

DROP POLICY IF EXISTS "verif_req_insert_verifier" ON verification_requests;
CREATE POLICY "verif_req_insert_verifier" ON verification_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = verifier_id);

-- Project owners can see requests for their projects
DROP POLICY IF EXISTS "verif_req_select_owner" ON verification_requests;
CREATE POLICY "verif_req_select_owner" ON verification_requests FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = verification_requests.project_id AND projects.owner_id = auth.uid())
  );

-- Corporate partners can see requests they initiated
DROP POLICY IF EXISTS "verif_req_select_partner" ON verification_requests;
CREATE POLICY "verif_req_select_partner" ON verification_requests FOR SELECT
  TO authenticated USING (auth.uid() = corporate_partner_id);

-- ============================================================
-- VERIFICATION DECISIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES verification_requests(id) ON DELETE CASCADE,
  verifier_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  decision text NOT NULL
    CHECK (decision IN ('approved','rejected','changes_requested')),
  remarks text,
  justification text,
  file_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verif_decisions_request ON verification_decisions(request_id);

ALTER TABLE verification_decisions ENABLE ROW LEVEL SECURITY;

-- Verifiers can insert decisions for their requests
DROP POLICY IF EXISTS "verif_dec_insert_verifier" ON verification_decisions;
CREATE POLICY "verif_dec_insert_verifier" ON verification_decisions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM verification_requests WHERE verification_requests.id = verification_decisions.request_id AND verification_requests.verifier_id = auth.uid())
  );

-- Verifiers and project owners can read decisions
DROP POLICY IF EXISTS "verif_dec_select_verifier" ON verification_decisions;
CREATE POLICY "verif_dec_select_verifier" ON verification_decisions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM verification_requests WHERE verification_requests.id = verification_decisions.request_id AND verification_requests.verifier_id = auth.uid())
  );

DROP POLICY IF EXISTS "verif_dec_select_owner" ON verification_decisions;
CREATE POLICY "verif_dec_select_owner" ON verification_decisions FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM verification_requests
      JOIN projects ON projects.id = verification_requests.project_id
      WHERE verification_requests.id = verification_decisions.request_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Partners can read decisions for corporate requests they initiated
DROP POLICY IF EXISTS "verif_dec_select_partner" ON verification_decisions;
CREATE POLICY "verif_dec_select_partner" ON verification_decisions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM verification_requests WHERE verification_requests.id = verification_decisions.request_id AND verification_requests.corporate_partner_id = auth.uid())
  );

-- ============================================================
-- DISCUSSION COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS discussion_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES discussion_comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  attachments jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discussion_project ON discussion_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_discussion_parent ON discussion_comments(parent_id);

ALTER TABLE discussion_comments ENABLE ROW LEVEL SECURITY;

-- Project owners can read and post comments on their projects
DROP POLICY IF EXISTS "discussion_select_owner" ON discussion_comments;
CREATE POLICY "discussion_select_owner" ON discussion_comments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = discussion_comments.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "discussion_insert_owner" ON discussion_comments;
CREATE POLICY "discussion_insert_owner" ON discussion_comments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = discussion_comments.project_id AND projects.owner_id = auth.uid())
  );

-- Assigned verifiers can read and post comments
DROP POLICY IF EXISTS "discussion_select_verifier" ON discussion_comments;
CREATE POLICY "discussion_select_verifier" ON discussion_comments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = discussion_comments.project_id AND projects.verifier_id = auth.uid())
  );

DROP POLICY IF EXISTS "discussion_insert_verifier" ON discussion_comments;
CREATE POLICY "discussion_insert_verifier" ON discussion_comments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = discussion_comments.project_id AND projects.verifier_id = auth.uid())
  );

-- Partners can read comments on verified projects
DROP POLICY IF EXISTS "discussion_select_partner" ON discussion_comments;
CREATE POLICY "discussion_select_partner" ON discussion_comments FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = discussion_comments.project_id
      AND projects.status IN ('verified','active','completed')
    )
  );

-- ============================================================
-- UPDATED_AT trigger for verification_requests
-- ============================================================
DROP TRIGGER IF EXISTS verif_req_updated_at ON verification_requests;
CREATE TRIGGER verif_req_updated_at
  BEFORE UPDATE ON verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
