-- ============================================================
-- MIGRATION: Risk-Based Dual Verification Engine
-- ============================================================

-- ============================================================
-- 1. PROJECT RISK ASSESSMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS project_risk_assessment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Risk Score Components (0-100 each, weighted)
  ownership_risk integer NOT NULL DEFAULT 0 CHECK (ownership_risk >= 0 AND ownership_risk <= 100),
  document_risk integer NOT NULL DEFAULT 0 CHECK (document_risk >= 0 AND document_risk <= 100),
  size_risk integer NOT NULL DEFAULT 0 CHECK (size_risk >= 0 AND size_risk <= 100),
  carbon_risk integer NOT NULL DEFAULT 0 CHECK (carbon_risk >= 0 AND carbon_risk <= 100),
  funding_risk integer NOT NULL DEFAULT 0 CHECK (funding_risk >= 0 AND funding_risk <= 100),
  ai_fraud_risk integer NOT NULL DEFAULT 0 CHECK (ai_fraud_risk >= 0 AND ai_fraud_risk <= 100),
  evidence_risk integer NOT NULL DEFAULT 0 CHECK (evidence_risk >= 0 AND evidence_risk <= 100),
  dispute_risk integer NOT NULL DEFAULT 0 CHECK (dispute_risk >= 0 AND dispute_risk <= 100),
  admin_escalation boolean NOT NULL DEFAULT false,

  -- Composite
  total_risk_score integer NOT NULL DEFAULT 0 CHECK (total_risk_score >= 0 AND total_risk_score <= 100),
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  required_verifiers integer NOT NULL DEFAULT 1 CHECK (required_verifiers IN (1, 2)),
  admin_review_required boolean NOT NULL DEFAULT false,

  -- Metadata
  calculated_by text NOT NULL DEFAULT 'system' CHECK (calculated_by IN ('system', 'admin', 'manual')),
  calculation_reasoning text,
  last_assessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pra_project ON project_risk_assessment(project_id);
CREATE INDEX IF NOT EXISTS idx_pra_risk_level ON project_risk_assessment(risk_level);

-- ============================================================
-- 2. VERIFICATION REVIEWS (Blind)
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  verification_request_id uuid REFERENCES verification_service_requests(id) ON DELETE SET NULL,
  risk_assessment_id uuid REFERENCES project_risk_assessment(id) ON DELETE SET NULL,

  -- Reviewer assignment
  verifier_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verifier_org_id uuid REFERENCES profiles(id),
  reviewer_number integer NOT NULL DEFAULT 1 CHECK (reviewer_number IN (1, 2, 3)),

  -- Review content
  status text NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'in_review', 'submitted', 'under_conflict_review', 'finalized')),
  vegetation_score double precision,
  carbon_estimate double precision,
  boundary_area_hectares double precision,
  evidence_quality_score integer CHECK (evidence_quality_score >= 0 AND evidence_quality_score <= 100),
  monitoring_notes text,
  recommendation text NOT NULL DEFAULT 'pending'
    CHECK (recommendation IN ('approved', 'rejected', 'changes_requested', 'pending')),

  -- Detailed findings
  findings jsonb,
  conditions jsonb,
  anomalies jsonb,
  overall_confidence integer CHECK (overall_confidence >= 0 AND overall_confidence <= 100),
  reviewer_remarks text,

  -- Conflict tracking
  is_in_conflict boolean NOT NULL DEFAULT false,
  conflict_id uuid,

  -- Metadata
  submitted_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vr_project ON verification_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_vr_verifier ON verification_reviews(verifier_id);
CREATE INDEX IF NOT EXISTS idx_vr_request ON verification_reviews(verification_request_id);
CREATE INDEX IF NOT EXISTS idx_vr_status ON verification_reviews(status);
CREATE INDEX IF NOT EXISTS idx_vr_conflict ON verification_reviews(is_in_conflict);

-- ============================================================
-- 3. VERIFICATION CONFLICTS
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Reviews in conflict
  review_1_id uuid NOT NULL REFERENCES verification_reviews(id),
  review_2_id uuid NOT NULL REFERENCES verification_reviews(id),
  verifier_1_id uuid NOT NULL REFERENCES profiles(id),
  verifier_2_id uuid NOT NULL REFERENCES profiles(id),

  -- What differed
  conflict_fields jsonb NOT NULL,
  recommendation_mismatch boolean NOT NULL DEFAULT false,
  severity text NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),

  -- Resolution
  status text NOT NULL DEFAULT 'detected'
    CHECK (status IN ('detected', 'admin_review', 'third_review_requested', 'resolved', 'escalated')),
  admin_id uuid REFERENCES profiles(id),
  admin_decision text CHECK (admin_decision IN ('approved', 'rejected', 'changes_requested')),
  admin_remarks text,
  third_review_id uuid REFERENCES verification_reviews(id),
  resolution_reasoning text,

  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vc_project ON verification_conflicts(project_id);
CREATE INDEX IF NOT EXISTS idx_vc_status ON verification_conflicts(status);

-- ============================================================
-- 4. DUAL VERIFICATION SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS dual_verification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default settings
INSERT INTO dual_verification_settings (setting_key, setting_value, description) VALUES
  ('risk_weights', '{"ownership": 15, "documents": 12, "size": 10, "carbon": 15, "funding": 12, "ai_fraud": 15, "evidence": 12, "disputes": 9}', 'Weight for each risk factor in composite score'),
  ('risk_thresholds', '{"medium": 30, "high": 55, "critical": 80}', 'Thresholds for risk level classification'),
  ('comparison_thresholds', '{"vegetation": 20, "carbon": 25, "boundary": 15, "evidence_quality": 20, "recommendation": true}', 'Max % difference before conflict flag'),
  ('auto_assign_enabled', 'true', 'Whether the system auto-assigns verifiers'),
  ('blind_verification_enabled', 'true', 'Whether blind verification is enforced')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE project_risk_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dual_verification_settings ENABLE ROW LEVEL SECURITY;

-- project_risk_assessment
CREATE POLICY pra_owner_select ON project_risk_assessment FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_risk_assessment.project_id AND projects.owner_id = auth.uid()));
CREATE POLICY pra_verifier_select ON project_risk_assessment FOR SELECT TO authenticated
  USING (is_project_verifier_via_request(project_id, auth.uid()));
CREATE POLICY pra_partner_select ON project_risk_assessment FOR SELECT TO authenticated
  USING (is_project_monitoring_partner(project_id, auth.uid()));
CREATE POLICY pra_admin_all ON project_risk_assessment FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- verification_reviews
CREATE POLICY vr_own_review ON verification_reviews FOR ALL TO authenticated
  USING (verifier_id = auth.uid());
CREATE POLICY vr_project_owner_select ON verification_reviews FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = verification_reviews.project_id AND projects.owner_id = auth.uid()));
CREATE POLICY vr_admin_all ON verification_reviews FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- verification_conflicts
CREATE POLICY vc_verifier_select ON verification_conflicts FOR SELECT TO authenticated
  USING (verifier_1_id = auth.uid() OR verifier_2_id = auth.uid());
CREATE POLICY vc_admin_all ON verification_conflicts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY vc_owner_select ON verification_conflicts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = verification_conflicts.project_id AND projects.owner_id = auth.uid()));

-- dual_verification_settings
CREATE POLICY dvs_admin_all ON dual_verification_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY dvs_verifier_select ON dual_verification_settings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'verifier'));

-- Triggers
DROP TRIGGER IF EXISTS pra_updated_at ON project_risk_assessment;
CREATE TRIGGER pra_updated_at BEFORE UPDATE ON project_risk_assessment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS vr_updated_at ON verification_reviews;
CREATE TRIGGER vr_updated_at BEFORE UPDATE ON verification_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS vc_updated_at ON verification_conflicts;
CREATE TRIGGER vc_updated_at BEFORE UPDATE ON verification_conflicts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS dvs_updated_at ON dual_verification_settings;
CREATE TRIGGER dvs_updated_at BEFORE UPDATE ON dual_verification_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
