-- Allow verifiers to read projects if they have an associated verification request
CREATE POLICY "projects_select_verifier_request" ON projects FOR SELECT
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM verification_requests vr
    WHERE vr.project_id = projects.id
    AND vr.verifier_id = auth.uid()
  )
);

-- Allow corporate partners to read projects if they have funded them
CREATE POLICY "projects_select_funder" ON projects FOR SELECT
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM funding_contributions fc
    WHERE fc.project_id = projects.id
    AND fc.partner_id = auth.uid()
  )
);
