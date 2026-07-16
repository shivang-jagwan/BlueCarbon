-- ============================================================
-- MIGRATION: Project Owner Workspace Enhancement
-- ============================================================

-- ============================================================
-- 1. VERIFICATION HISTORY (permanent, immutable records)
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  verification_type text NOT NULL
    CHECK (verification_type IN ('land', 'project', 'monitoring', 'carbon')),
  organization_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  organization_name text,
  verifier_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verifier_name text,
  status text NOT NULL
    CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'changes_requested')),
  decision_date timestamptz,
  comments text,
  documents_reviewed integer DEFAULT 0,
  evidence_count integer DEFAULT 0,
  report_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vh_project ON verification_history(project_id);
CREATE INDEX IF NOT EXISTS idx_vh_type ON verification_history(verification_type);
CREATE INDEX IF NOT EXISTS idx_vh_status ON verification_history(status);

ALTER TABLE verification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vh_select_owner ON verification_history;
CREATE POLICY vh_select_owner ON verification_history FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS vh_select_verifier ON verification_history;
CREATE POLICY vh_select_verifier ON verification_history FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT project_id FROM project_partnerships WHERE verifier_id = auth.uid() AND status = 'active'
    UNION
    SELECT project_id FROM verification_service_requests WHERE verifier_id = auth.uid()
  ));

DROP POLICY IF EXISTS vh_select_partner ON verification_history;
CREATE POLICY vh_select_partner ON verification_history FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT project_id FROM project_support WHERE partner_id = auth.uid()
  ));

DROP POLICY IF EXISTS vh_insert_system ON verification_history;
CREATE POLICY vh_insert_system ON verification_history FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- 2. PROJECT DOCUMENTS V2 (versioned, categorized, workflow)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_documents_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  replaced_by uuid REFERENCES project_documents_v2(id),

  -- Category system
  category text NOT NULL
    CHECK (category IN (
      'land_ownership', 'government_approval', 'environmental_clearance',
      'lease_agreement', 'community_certificate', 'project_proposal',
      'restoration_plan', 'survey_document', 'gis_report', 'carbon_report',
      'other'
    )),
  document_name text NOT NULL,
  description text,

  -- File
  file_name text,
  file_size bigint,
  mime_type text,
  storage_path text NOT NULL,
  public_url text,

  -- Workflow
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'uploaded', 'submitted', 'under_review',
      'verified', 'rejected', 'revision_requested'
    )),
  submitted_at timestamptz,
  verified_by uuid REFERENCES profiles(id),
  verified_at timestamptz,
  verification_comments text,
  rejection_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pd2_project ON project_documents_v2(project_id);
CREATE INDEX IF NOT EXISTS idx_pd2_category ON project_documents_v2(category);
CREATE INDEX IF NOT EXISTS idx_pd2_status ON project_documents_v2(status);

ALTER TABLE project_documents_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pd2_owner_all ON project_documents_v2;
CREATE POLICY pd2_owner_all ON project_documents_v2 FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS pd2_verifier_select ON project_documents_v2;
CREATE POLICY pd2_verifier_select ON project_documents_v2 FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT project_id FROM project_partnerships WHERE verifier_id = auth.uid() AND status = 'active'
    UNION
    SELECT project_id FROM verification_service_requests WHERE verifier_id = auth.uid()
  ));

DROP POLICY IF EXISTS pd2_verifier_update ON project_documents_v2;
CREATE POLICY pd2_verifier_update ON project_documents_v2 FOR UPDATE TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_partnerships WHERE verifier_id = auth.uid() AND status = 'active'
      UNION
      SELECT project_id FROM verification_service_requests WHERE verifier_id = auth.uid()
    )
  );

-- ============================================================
-- 3. PROJECT ALBUMS
-- ============================================================
CREATE TABLE IF NOT EXISTS project_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cover_image_url text,
  item_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pa_project ON project_albums(project_id);

ALTER TABLE project_albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pa_owner_all ON project_albums;
CREATE POLICY pa_owner_all ON project_albums FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS pa_partner_select ON project_albums;
CREATE POLICY pa_partner_select ON project_albums FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT project_id FROM project_support WHERE partner_id = auth.uid()
  ));

-- ============================================================
-- 4. PROJECT GALLERY ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS project_gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  album_id uuid REFERENCES project_albums(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  uploader_name text,

  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  file_name text,
  file_size bigint,
  mime_type text,
  storage_path text NOT NULL,
  public_url text,

  -- Metadata
  caption text,
  capture_date timestamptz,
  location_name text,
  latitude double precision,
  longitude double precision,
  tags text[],

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pgi_project ON project_gallery_items(project_id);
CREATE INDEX IF NOT EXISTS idx_pgi_album ON project_gallery_items(album_id);
CREATE INDEX IF NOT EXISTS idx_pgi_type ON project_gallery_items(media_type);

ALTER TABLE project_gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pgi_owner_all ON project_gallery_items;
CREATE POLICY pgi_owner_all ON project_gallery_items FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS pgi_partner_select ON project_gallery_items;
CREATE POLICY pgi_partner_select ON project_gallery_items FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT project_id FROM project_support WHERE partner_id = auth.uid()
  ));

DROP POLICY IF EXISTS pgi_verifier_select ON project_gallery_items;
CREATE POLICY pgi_verifier_select ON project_gallery_items FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT project_id FROM project_partnerships WHERE verifier_id = auth.uid() AND status = 'active'
  ));

-- ============================================================
-- 5. PROJECT CHANGE REQUESTS (for immutable fields)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  field_name text NOT NULL,
  current_value text,
  proposed_value text NOT NULL,
  reason text,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  review_notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pcr_project ON project_change_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_pcr_status ON project_change_requests(status);

ALTER TABLE project_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pcr_owner_select ON project_change_requests;
CREATE POLICY pcr_owner_select ON project_change_requests FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS pcr_owner_insert ON project_change_requests;
CREATE POLICY pcr_owner_insert ON project_change_requests FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()) AND requested_by = auth.uid());

DROP POLICY IF EXISTS pcr_admin_all ON project_change_requests;
CREATE POLICY pcr_admin_all ON project_change_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============================================================
-- 6. EXPAND monitoring_reports
-- ============================================================
ALTER TABLE monitoring_reports ADD COLUMN IF NOT EXISTS report_type text NOT NULL DEFAULT 'monthly'
  CHECK (report_type IN ('monthly', 'inspection', 'drone', 'satellite', 'carbon', 'health'));
ALTER TABLE monitoring_reports ADD COLUMN IF NOT EXISTS organization_name text;
ALTER TABLE monitoring_reports ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE monitoring_reports ADD COLUMN IF NOT EXISTS submitted_by_name text;

-- ============================================================
-- 7. EXPAND project_activity (add organization context)
-- ============================================================
ALTER TABLE project_activity ADD COLUMN IF NOT EXISTS organization_name text;
ALTER TABLE project_activity ADD COLUMN IF NOT EXISTS actor_name text;
ALTER TABLE project_activity ADD COLUMN IF NOT EXISTS actor_role text;

-- ============================================================
-- 8. PROJECT CONTACTS (separate from profile)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  contact_person text,
  phone text,
  email text,
  organization text,
  address text,
  emergency_contact text,
  emergency_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE project_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pc_owner_all ON project_contacts;
CREATE POLICY pc_owner_all ON project_contacts FOR ALL TO authenticated
  USING (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS pc_verifier_select ON project_contacts;
CREATE POLICY pc_verifier_select ON project_contacts FOR SELECT TO authenticated
  USING (project_id IN (
    SELECT project_id FROM project_partnerships WHERE verifier_id = auth.uid() AND status = 'active'
  ));
