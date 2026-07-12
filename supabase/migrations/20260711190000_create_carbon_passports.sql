-- ============================================================
-- CARBON PASSPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS carbon_passports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  issued_by uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  certificate_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carbon_passports_project ON carbon_passports(project_id);

ALTER TABLE carbon_passports ENABLE ROW LEVEL SECURITY;

-- Select Policy: Owners, verifiers, and partners can view passports for their associated projects.
CREATE POLICY "passports_select_policy" ON carbon_passports FOR SELECT
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM projects WHERE projects.id = carbon_passports.project_id AND (
      projects.owner_id = auth.uid() OR
      projects.status IN ('verified', 'active', 'completed') OR
      EXISTS (SELECT 1 FROM verification_requests vr WHERE vr.project_id = projects.id AND vr.verifier_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM funding_contributions fc WHERE fc.project_id = projects.id AND fc.partner_id = auth.uid())
    )
  )
);

-- Insert Policy: Only Verifiers assigned to the project can issue a passport.
CREATE POLICY "passports_insert_policy" ON carbon_passports FOR INSERT
TO authenticated WITH CHECK (
  issued_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM verification_requests vr WHERE vr.project_id = carbon_passports.project_id AND vr.verifier_id = auth.uid()
  )
);
