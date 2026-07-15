-- ============================================================
-- MIGRATION: AI Decision Support + Land Ownership Verification
-- ============================================================
-- 1. ai_analysis — Stores AI analysis results per project/request
-- 2. project_land_documents — Structured land ownership documents
-- 3. land_document_audit — Audit log for all ownership actions
-- ============================================================

-- ============================================================
-- 1. AI ANALYSIS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  verification_request_id uuid REFERENCES verification_service_requests(id) ON DELETE SET NULL,
  analysis_type text NOT NULL
    CHECK (analysis_type IN (
      'registration_review', 'verification_review',
      'monitoring_review', 'carbon_assessment',
      'evidence_validation', 'land_ownership'
    )),

  -- AI Output (NEVER final decision — advisory only)
  confidence_score integer NOT NULL DEFAULT 0
    CHECK (confidence_score >= 0 AND confidence_score <= 100),
  recommendation text NOT NULL DEFAULT 'insufficient_data'
    CHECK (recommendation IN (
      'recommend_approval', 'recommend_changes',
      'recommend_rejection', 'insufficient_data',
      'needs_more_evidence', 'low_confidence'
    )),
  reasoning text,
  risk_level text NOT NULL DEFAULT 'low'
    CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),

  -- Evidence Used
  evidence_used jsonb,
  detected_risks jsonb,
  observations jsonb,

  -- Domain-specific scores
  vegetation_score double precision,
  carbon_estimate double precision,
  similarity_score double precision,
  gps_consistency_score double precision,
  ownership_verification_score double precision,

  -- Metadata
  ai_model text,
  ai_version text,
  processing_time_ms integer,
  notes text,

  -- AI never decides — this tracks what the verifier decided vs AI recommendation
  verifier_agreed_with_ai boolean,
  verifier_override_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_project ON ai_analysis(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_request ON ai_analysis(verification_request_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON ai_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_created ON ai_analysis(created_at DESC);

-- ============================================================
-- AI ANALYSIS RLS
-- ============================================================
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;

-- Verifiers can read/write AI analyses for their requests
CREATE POLICY ai_analysis_verifier_all ON ai_analysis
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM verification_service_requests vsr
      WHERE vsr.id = ai_analysis.verification_request_id
        AND vsr.verifier_id = auth.uid()
    )
  );

-- Project owners can read AI analyses for their projects
CREATE POLICY ai_analysis_owner_select ON ai_analysis
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = ai_analysis.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Partners can read AI analyses for monitored projects
CREATE POLICY ai_analysis_partner_select ON ai_analysis
  FOR SELECT TO authenticated
  USING (
    is_project_monitoring_partner(project_id, auth.uid())
  );

-- Admins can do everything
CREATE POLICY ai_analysis_admin_all ON ai_analysis
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- AI ANALYSIS UPDATED_AT TRIGGER
-- ============================================================
DROP TRIGGER IF EXISTS ai_analysis_updated_at ON ai_analysis;
CREATE TRIGGER ai_analysis_updated_at
  BEFORE UPDATE ON ai_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 2. PROJECT LAND DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS project_land_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Document metadata
  document_type text NOT NULL
    CHECK (document_type IN (
      'land_ownership_record', 'sale_deed', 'property_registration',
      'government_authorization', 'department_approval',
      'community_resolution', 'village_council_letter', 'forest_committee_approval',
      'lease_agreement', 'land_use_permission',
      'tax_receipt', 'encumbrance_certificate',
      'other'
    )),
  ownership_type text NOT NULL
    CHECK (ownership_type IN ('private', 'government', 'community', 'leased', 'forest_department', 'other')),
  document_number text,
  issuing_authority text,
  issue_date date,
  expiry_date date,

  -- Storage
  document_url text,
  storage_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  file_hash text,

  -- Verification workflow
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'submitted', 'verified', 'rejected', 'expired', 'additional_required')),
  verified_by uuid REFERENCES profiles(id),
  verified_at timestamptz,
  rejection_reason text,
  additional_documents_requested text,
  verifier_remarks text,

  -- Versioning (replace documents)
  version integer NOT NULL DEFAULT 1,
  replaced_by uuid REFERENCES project_land_documents(id),
  is_current boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pld_project ON project_land_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_pld_owner ON project_land_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_pld_status ON project_land_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_pld_current ON project_land_documents(project_id, is_current);

-- ============================================================
-- LAND DOCUMENTS RLS
-- ============================================================
ALTER TABLE project_land_documents ENABLE ROW LEVEL SECURITY;

-- Project owners can CRUD their own land documents
CREATE POLICY pld_owner_all ON project_land_documents
  FOR ALL TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_land_documents.project_id
        AND projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    owner_id = auth.uid()
  );

-- Verifiers can read and update verification status
CREATE POLICY pld_verifier_select ON project_land_documents
  FOR SELECT TO authenticated
  USING (
    is_project_verifier_via_request(project_id, auth.uid())
  );

CREATE POLICY pld_verifier_update ON project_land_documents
  FOR UPDATE TO authenticated
  USING (
    is_project_verifier_via_request(project_id, auth.uid())
  );

-- Partners can read land documents
CREATE POLICY pld_partner_select ON project_land_documents
  FOR SELECT TO authenticated
  USING (
    is_project_monitoring_partner(project_id, auth.uid())
  );

-- Admins can do everything
CREATE POLICY pld_admin_all ON project_land_documents
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- LAND DOCUMENTS UPDATED_AT TRIGGER
-- ============================================================
DROP TRIGGER IF EXISTS pld_updated_at ON project_land_documents;
CREATE TRIGGER pld_updated_at
  BEFORE UPDATE ON project_land_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 3. LAND DOCUMENT AUDIT LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS land_document_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id uuid REFERENCES project_land_documents(id) ON DELETE SET NULL,
  actor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL
    CHECK (action IN (
      'document_uploaded', 'document_replaced', 'verification_requested',
      'ownership_verified', 'ownership_rejected', 'ownership_expired',
      'additional_documents_requested', 'document_downloaded',
      'admin_override', 'status_change'
    )),
  old_status text,
  new_status text,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lda_project ON land_document_audit(project_id);
CREATE INDEX IF NOT EXISTS idx_lda_document ON land_document_audit(document_id);
CREATE INDEX IF NOT EXISTS idx_lda_actor ON land_document_audit(actor_id);
CREATE INDEX IF NOT EXISTS idx_lda_action ON land_document_audit(action);
CREATE INDEX IF NOT EXISTS idx_lda_created ON land_document_audit(created_at DESC);

-- ============================================================
-- AUDIT LOG RLS
-- ============================================================
ALTER TABLE land_document_audit ENABLE ROW LEVEL SECURITY;

-- Project owners can read audit logs for their projects
CREATE POLICY lda_owner_select ON land_document_audit
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = land_document_audit.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Verifiers can read audit logs for their assigned projects
CREATE POLICY lda_verifier_select ON land_document_audit
  FOR SELECT TO authenticated
  USING (
    is_project_verifier_via_request(project_id, auth.uid())
  );

-- Admins can do everything
CREATE POLICY lda_admin_all ON land_document_audit
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
