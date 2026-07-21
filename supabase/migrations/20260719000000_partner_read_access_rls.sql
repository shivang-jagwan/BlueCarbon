-- ============================================================
-- PARTNER READ ACCESS: voc_requests, voc_agency_requests,
-- project_albums, project_gallery_items, voc_official_records,
-- voc_audit_reports, voc_passport_applications
-- ============================================================
-- Partners could not see verification reports or gallery because
-- RLS only allowed owner/agency/verifier reads.

-- Helper: partner project_ids via project_partnerships
-- Pattern: project_id IN (SELECT pp.project_id FROM project_partnerships pp
--   WHERE pp.company_id = auth.uid() AND pp.status IN ('active','pending_owner','pending_verifier'))

-- 1. voc_requests
DROP POLICY IF EXISTS vr_partner_select ON voc_requests;
CREATE POLICY vr_partner_select ON voc_requests FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT pp.project_id FROM project_partnerships pp
      WHERE pp.company_id = auth.uid()
        AND pp.status IN ('active', 'pending_owner', 'pending_verifier')
    )
  );

-- 2. voc_agency_requests
DROP POLICY IF EXISTS var_partner_select ON voc_agency_requests;
CREATE POLICY var_partner_select ON voc_agency_requests FOR SELECT TO authenticated
  USING (
    request_id IN (
      SELECT vr.id FROM voc_requests vr
      WHERE vr.project_id IN (
        SELECT pp.project_id FROM project_partnerships pp
        WHERE pp.company_id = auth.uid()
          AND pp.status IN ('active', 'pending_owner', 'pending_verifier')
      )
    )
  );

-- 3. project_albums
DROP POLICY IF EXISTS pa_partner_select_via_partnerships ON project_albums;
CREATE POLICY pa_partner_select_via_partnerships ON project_albums FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT pp.project_id FROM project_partnerships pp
      WHERE pp.company_id = auth.uid()
        AND pp.status IN ('active', 'pending_owner', 'pending_verifier')
    )
  );

-- 4. project_gallery_items
DROP POLICY IF EXISTS pgi_partner_select_via_partnerships ON project_gallery_items;
CREATE POLICY pgi_partner_select_via_partnerships ON project_gallery_items FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT pp.project_id FROM project_partnerships pp
      WHERE pp.company_id = auth.uid()
        AND pp.status IN ('active', 'pending_owner', 'pending_verifier')
    )
  );

-- 5. voc_official_records (certificates, audit reports, passports)
DROP POLICY IF EXISTS vor_partner_select ON voc_official_records;
CREATE POLICY vor_partner_select ON voc_official_records FOR SELECT TO authenticated
  USING (
    request_id IN (
      SELECT vr.id FROM voc_requests vr
      WHERE vr.project_id IN (
        SELECT pp.project_id FROM project_partnerships pp
        WHERE pp.company_id = auth.uid()
          AND pp.status IN ('active', 'pending_owner', 'pending_verifier')
      )
    )
  );

-- 6. voc_audit_reports (queries by agency_request_id OR request_id)
DROP POLICY IF EXISTS var_audit_partner_select ON voc_audit_reports;
CREATE POLICY var_audit_partner_select ON voc_audit_reports FOR SELECT TO authenticated
  USING (
    agency_request_id IN (
      SELECT var.id FROM voc_agency_requests var
      WHERE var.request_id IN (
        SELECT vr.id FROM voc_requests vr
        WHERE vr.project_id IN (
          SELECT pp.project_id FROM project_partnerships pp
          WHERE pp.company_id = auth.uid()
            AND pp.status IN ('active', 'pending_owner', 'pending_verifier')
        )
      )
    )
    OR
    request_id IN (
      SELECT vr.id FROM voc_requests vr
      WHERE vr.project_id IN (
        SELECT pp.project_id FROM project_partnerships pp
        WHERE pp.company_id = auth.uid()
          AND pp.status IN ('active', 'pending_owner', 'pending_verifier')
      )
    )
  );

-- 7. voc_passport_applications
DROP POLICY IF EXISTS vpa_partner_select ON voc_passport_applications;
CREATE POLICY vpa_partner_select ON voc_passport_applications FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT pp.project_id FROM project_partnerships pp
      WHERE pp.company_id = auth.uid()
        AND pp.status IN ('active', 'pending_owner', 'pending_verifier')
    )
  );

-- 8. project_albums — allow read for ANY verified/public project
DROP POLICY IF EXISTS pa_auth_verified_select ON project_albums;
CREATE POLICY pa_auth_verified_select ON project_albums FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE status IN ('registered', 'verified', 'active', 'completed', 'in_verification')
    )
  );

-- 9. project_gallery_items — allow read for ANY verified/public project
DROP POLICY IF EXISTS pgi_auth_verified_select ON project_gallery_items;
CREATE POLICY pgi_auth_verified_select ON project_gallery_items FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE status IN ('registered', 'verified', 'active', 'completed', 'in_verification')
    )
  );

-- 10. project_documents_v2 — allow partner read via partnerships
DROP POLICY IF EXISTS pd2_partner_select ON project_documents_v2;
CREATE POLICY pd2_partner_select ON project_documents_v2 FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT pp.project_id FROM project_partnerships pp
      WHERE pp.company_id = auth.uid()
        AND pp.status IN ('active', 'pending_owner', 'pending_verifier')
    )
  );
