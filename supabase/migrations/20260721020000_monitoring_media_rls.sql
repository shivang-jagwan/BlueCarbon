-- ============================================================
-- MIGRATION: Grant Verifiers Media Access
-- ============================================================
-- Allow verifiers assigned to a project to upload media (albums and gallery items)

BEGIN;

DROP POLICY IF EXISTS pa_verifier_all ON project_albums;
CREATE POLICY pa_verifier_all ON project_albums FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_monitoring_assignments WHERE verifier_id = auth.uid()
    ) OR
    project_id IN (
      SELECT project_id FROM project_partnerships WHERE verifier_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS pgi_verifier_all ON project_gallery_items;
CREATE POLICY pgi_verifier_all ON project_gallery_items FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_monitoring_assignments WHERE verifier_id = auth.uid()
    ) OR
    project_id IN (
      SELECT project_id FROM project_partnerships WHERE verifier_id = auth.uid() AND status = 'active'
    )
  );

COMMIT;
