-- ============================================================
-- MIGRATION: Verification Evidence System
-- ============================================================
-- Secure geo-tagged evidence collection for field verification.
-- Prevents fake GPS, fake images, and fraudulent monitoring data.
-- ============================================================

-- ============================================================
-- 1. verification_evidence TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  verification_request_id uuid REFERENCES verification_service_requests(id) ON DELETE SET NULL,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Media URLs (stored in Supabase Storage 'evidence-evidence' bucket)
  photo_url text,
  video_url text,
  drone_image_url text,
  drone_video_url text,
  monitoring_notes text,

  -- GPS metadata
  latitude double precision,
  longitude double precision,
  gps_accuracy_meters double precision,
  gps_source text CHECK (gps_source IN ('device', 'exif', 'manual', 'none')),

  -- Timestamps
  capture_timestamp timestamptz,
  upload_timestamp timestamptz NOT NULL DEFAULT now(),

  -- Device metadata
  device_name text,
  device_model text,
  device_platform text,
  exif_data jsonb,
  file_hash text,
  file_size bigint,
  mime_type text,
  original_filename text,
  storage_path text NOT NULL,

  -- Evidence type classification
  evidence_type text NOT NULL
    CHECK (evidence_type IN ('photo', 'video', 'drone_image', 'drone_video')),

  -- Validation results
  validation_status text NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('pending', 'valid', 'warning', 'rejected')),
  validation_notes jsonb,
  
  -- Fraud detection
  fraud_score integer NOT NULL DEFAULT 0
    CHECK (fraud_score >= 0 AND fraud_score <= 100),
  fraud_flags jsonb,

  -- AI preparation (future use)
  ai_similarity_score double precision,
  ai_notes text,
  ai_status text CHECK (ai_status IN ('pending', 'processing', 'completed', 'failed')),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ve_project ON verification_evidence(project_id);
CREATE INDEX IF NOT EXISTS idx_ve_request ON verification_evidence(verification_request_id);
CREATE INDEX IF NOT EXISTS idx_ve_uploaded_by ON verification_evidence(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_ve_status ON verification_evidence(validation_status);
CREATE INDEX IF NOT EXISTS idx_ve_fraud ON verification_evidence(fraud_score);
CREATE INDEX IF NOT EXISTS idx_ve_type ON verification_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_ve_created ON verification_evidence(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ve_hash ON verification_evidence(file_hash);

-- ============================================================
-- 3. RLS
-- ============================================================
ALTER TABLE verification_evidence ENABLE ROW LEVEL SECURITY;

-- Verifiers can CRUD evidence for their assigned projects
CREATE POLICY ve_verifier_all ON verification_evidence
  FOR ALL TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR is_project_verifier_via_request(project_id, auth.uid())
  )
  WITH CHECK (
    uploaded_by = auth.uid()
  );

-- Project owners can read evidence for their projects
CREATE POLICY ve_owner_select ON verification_evidence
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = verification_evidence.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- Sustainability partners can read evidence for supported projects
CREATE POLICY ve_partner_select ON verification_evidence
  FOR SELECT TO authenticated
  USING (
    is_project_monitoring_partner(project_id, auth.uid())
  );

-- Admins can do everything
CREATE POLICY ve_admin_all ON verification_evidence
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- 4. UPDATED_AT TRIGGER
-- ============================================================
DROP TRIGGER IF EXISTS ve_updated_at ON verification_evidence;
CREATE TRIGGER ve_updated_at
  BEFORE UPDATE ON verification_evidence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 5. evidence-evidence STORAGE BUCKET (separate from raw evidence)
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('evidence-verified', 'evidence-verified', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Only authenticated users can upload to their own project folder
CREATE POLICY "evidence_verified_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'evidence-verified'
    AND (storage.foldername(name))[1] IS NOT NULL
  );

-- Storage RLS: Read access via project membership
CREATE POLICY "evidence_verified_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'evidence-verified'
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE id::text = (storage.foldername(name))[1]
        AND (
          owner_id = auth.uid()
          OR is_project_verifier_via_request(id, auth.uid())
          OR is_project_monitoring_partner(id, auth.uid())
        )
    )
  );

-- Storage RLS: Admins can read all
CREATE POLICY "evidence_verified_admin_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'evidence-verified'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
