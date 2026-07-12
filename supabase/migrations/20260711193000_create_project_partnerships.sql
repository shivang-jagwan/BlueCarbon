-- ============================================================
-- PROJECT PARTNERSHIPS
-- ============================================================

CREATE TABLE IF NOT EXISTS project_partnerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verifier_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending_owner'
    CHECK (status IN ('pending_owner', 'pending_verifier', 'active', 'rejected', 'terminated')),
  service_type text NOT NULL
    CHECK (service_type IN ('monthly', 'quarterly', 'annual', 'lifecycle')),
  start_date date,
  budget_usd numeric,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_partnerships_project ON project_partnerships(project_id);
CREATE INDEX IF NOT EXISTS idx_project_partnerships_company ON project_partnerships(company_id);
CREATE INDEX IF NOT EXISTS idx_project_partnerships_verifier ON project_partnerships(verifier_id);

ALTER TABLE project_partnerships ENABLE ROW LEVEL SECURITY;

-- Select Policy: Owners, Verifiers, and the Company can read
CREATE POLICY "partnerships_select" ON project_partnerships FOR SELECT
TO authenticated USING (
  company_id = auth.uid() OR
  verifier_id = auth.uid() OR
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_partnerships.project_id AND projects.owner_id = auth.uid())
);

-- Insert Policy: Sustainability Partners can insert
CREATE POLICY "partnerships_insert" ON project_partnerships FOR INSERT
TO authenticated WITH CHECK (
  company_id = auth.uid()
);

-- Update Policy: Owners and Verifiers can update status (accept/reject)
CREATE POLICY "partnerships_update" ON project_partnerships FOR UPDATE
TO authenticated USING (
  verifier_id = auth.uid() OR
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_partnerships.project_id AND projects.owner_id = auth.uid())
) WITH CHECK (
  verifier_id = auth.uid() OR
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_partnerships.project_id AND projects.owner_id = auth.uid())
);

-- Fix Projects RLS to ensure active partnerships grant access
CREATE OR REPLACE FUNCTION is_project_monitoring_partner(p_id uuid, u_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_partnerships pp
    WHERE pp.project_id = p_id
    AND pp.verifier_id = u_id
    AND pp.status = 'active'
  );
$$;

DROP POLICY IF EXISTS "projects_select_verifier_request" ON projects;

CREATE POLICY "projects_select_verifier_access" ON projects FOR SELECT
TO authenticated USING (
  is_project_verifier_via_request(id, auth.uid()) OR
  is_project_monitoring_partner(id, auth.uid())
);
