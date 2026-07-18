-- Fix: Replace function-based RLS with inline check for reliability
-- Also add access for verifiers who are assigned to requests on the project

-- Drop and recreate SELECT policy
DROP POLICY IF EXISTS activity_select_voc_agency ON project_activity;
CREATE POLICY activity_select_voc_agency ON project_activity
  FOR SELECT USING (
    -- User is the agency profile owner with requests on this project
    project_id IN (
      SELECT DISTINCT vr.project_id
      FROM voc_requests vr
      JOIN voc_agency_requests var ON var.request_id = vr.id
      JOIN verification_agencies va ON va.id = var.agency_id
      WHERE va.profile_id = auth.uid()
    )
    OR
    -- User is a verifier assigned to an agency request on this project
    project_id IN (
      SELECT DISTINCT vr.project_id
      FROM voc_requests vr
      JOIN voc_agency_requests var ON var.request_id = vr.id
      WHERE var.assigned_verifier = (
        SELECT full_name FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Drop and recreate INSERT policy
DROP POLICY IF EXISTS activity_insert_voc_agency ON project_activity;
CREATE POLICY activity_insert_voc_agency ON project_activity
  FOR INSERT WITH CHECK (
    actor_id = auth.uid()
    AND (
      project_id IN (
        SELECT DISTINCT vr.project_id
        FROM voc_requests vr
        JOIN voc_agency_requests var ON var.request_id = vr.id
        JOIN verification_agencies va ON va.id = var.agency_id
        WHERE va.profile_id = auth.uid()
      )
      OR
      project_id IN (
        SELECT DISTINCT vr.project_id
        FROM voc_requests vr
        JOIN voc_agency_requests var ON var.request_id = vr.id
        WHERE var.assigned_verifier = (
          SELECT full_name FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );
