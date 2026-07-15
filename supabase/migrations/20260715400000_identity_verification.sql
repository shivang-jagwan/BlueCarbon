-- ============================================================
-- MIGRATION: Enterprise Identity Verification & Anti-Fraud
-- ============================================================

-- ============================================================
-- 1. IDENTITY DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS identity_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Document metadata
  document_type text NOT NULL
    CHECK (document_type IN (
      'government_id', 'passport', 'driving_license', 'aadhaar', 'pan_card',
      'organization_certificate', 'registration_document', 'tax_registration',
      'gst_certificate', 'authorization_letter', 'board_resolution',
      'business_license', 'incorporation_certificate', 'memorandum',
      'articles_of_association', 'proof_of_address', 'bank_statement',
      'other'
    )),
  document_category text NOT NULL
    CHECK (document_category IN ('personal_identity', 'organization_proof', 'authorization', 'other')),

  -- Storage
  file_name text,
  file_size bigint,
  mime_type text,
  storage_path text NOT NULL,
  file_hash text,

  -- Metadata
  document_number text,
  issuing_authority text,
  issue_date date,
  expiry_date date,
  issuing_country text,

  -- Verification
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN (
      'pending', 'submitted', 'under_review', 'verified',
      'rejected', 'expired', 'additional_required'
    )),
  verified_by uuid REFERENCES profiles(id),
  verified_at timestamptz,
  rejection_reason text,
  additional_documents_requested text,
  verifier_notes text,

  -- Versioning
  version integer NOT NULL DEFAULT 1,
  replaced_by uuid REFERENCES identity_documents(id),
  is_current boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_id_user ON identity_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_id_status ON identity_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_id_current ON identity_documents(user_id, is_current);
CREATE INDEX IF NOT EXISTS idx_id_hash ON identity_documents(file_hash);

-- ============================================================
-- 2. IDENTITY VERIFICATION (Workflow per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS identity_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  -- Role-specific requirements
  role text NOT NULL CHECK (role IN ('project_owner', 'verifier', 'sustainability_partner', 'admin')),

  -- Email verification
  email_verified boolean NOT NULL DEFAULT false,
  email_verified_at timestamptz,

  -- Phone verification
  phone_verified boolean NOT NULL DEFAULT false,
  phone_verified_at timestamptz,

  -- Identity verification
  identity_documents_submitted boolean NOT NULL DEFAULT false,
  identity_verified boolean NOT NULL DEFAULT false,
  identity_verified_at timestamptz,

  -- Organization verification (verifiers & partners)
  organization_verified boolean NOT NULL DEFAULT false,
  organization_verified_at timestamptz,
  organization_document_count integer NOT NULL DEFAULT 0,

  -- Overall status
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',           -- Just registered
      'email_verified',    -- Email confirmed
      'phone_verified',    -- Phone confirmed
      'identity_submitted',-- Documents uploaded
      'identity_verified', -- Documents approved
      'organization_submitted',
      'organization_verified',
      'fully_verified',    -- All checks passed
      'rejected',          -- Identity rejected
      'suspended'          -- Account suspended
    )),

  -- Fraud detection flags
  fraud_flags jsonb,
  duplicate_check_passed boolean,
  suspicious_activity_detected boolean NOT NULL DEFAULT false,
  suspicious_activity_reasons jsonb,

  -- Admin review
  admin_notes text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,

  -- Compliance
  terms_accepted boolean NOT NULL DEFAULT false,
  terms_accepted_at timestamptz,
  privacy_policy_accepted boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_iv_user ON identity_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_iv_status ON identity_verifications(status);
CREATE INDEX IF NOT EXISTS idx_iv_role ON identity_verifications(role);

-- ============================================================
-- 3. VERIFICATION ATTEMPTS (Fraud Detection Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- What was attempted
  attempt_type text NOT NULL
    CHECK (attempt_type IN (
      'email_verification', 'phone_otp', 'identity_upload',
      'organization_upload', 'login', 'password_reset',
      'duplicate_check', 'fraud_scan'
    )),
  status text NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'failed', 'blocked', 'flagged')),

  -- Fraud detection
  fraud_score integer DEFAULT 0 CHECK (fraud_score >= 0 AND fraud_score <= 100),
  fraud_reasons jsonb,
  duplicate_of_user_id uuid REFERENCES profiles(id),

  -- Context
  ip_address inet,
  device text,
  browser text,
  metadata jsonb,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_va_user ON verification_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_va_type ON verification_attempts(attempt_type);
CREATE INDEX IF NOT EXISTS idx_va_fraud ON verification_attempts(fraud_score);
CREATE INDEX IF NOT EXISTS idx_va_ip ON verification_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_va_created ON verification_attempts(created_at DESC);

-- ============================================================
-- 4. SECURITY EVENTS (Login failures, brute force, lockouts)
-- ============================================================
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL
    CHECK (event_type IN (
      'failed_login', 'successful_login', 'account_locked',
      'account_unlocked', 'password_changed', 'brute_force_detected',
      'session_expired', 'unauthorized_access', 'rate_limit_exceeded',
      'suspicious_ip', 'concurrent_session'
    )),
  severity text NOT NULL DEFAULT 'warning'
    CHECK (severity IN ('info', 'warning', 'critical')),
  ip_address inet,
  device text,
  browser text,
  details jsonb,
  resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES profiles(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_se_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_se_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_se_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_se_ip ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_se_created ON security_events(created_at DESC);

-- ============================================================
-- 5. RATE LIMITING TABLE (Brute-force protection)
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action_type text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rl_identifier_action ON rate_limits(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_rl_window ON rate_limits(window_start);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE identity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- identity_documents
CREATE POLICY id_owner_all ON identity_documents FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY id_admin_all ON identity_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- identity_verifications
CREATE POLICY iv_owner_select ON identity_verifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY iv_admin_all ON identity_verifications FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY iv_system_insert ON identity_verifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- verification_attempts
CREATE POLICY va_admin_select ON verification_attempts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY va_user_select ON verification_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- security_events
CREATE POLICY se_admin_all ON security_events FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- rate_limits
CREATE POLICY rl_admin_select ON rate_limits FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============================================================
-- SECURITY FUNCTIONS
-- ============================================================

-- Check rate limit and optionally lock account
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier text,
  p_action text,
  p_max_attempts integer DEFAULT 5,
  p_window_seconds integer DEFAULT 300,
  p_lockout_seconds integer DEFAULT 900
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record record;
  v_count integer;
  v_result jsonb;
BEGIN
  -- Find or create rate limit record
  SELECT * INTO v_record
  FROM rate_limits
  WHERE identifier = p_identifier AND action_type = p_action
    AND window_start > now() - (p_window_seconds || ' seconds')::interval
  ORDER BY window_start DESC
  LIMIT 1;

  IF v_record IS NULL THEN
    -- First attempt in window
    INSERT INTO rate_limits (identifier, action_type, attempt_count, window_start)
    VALUES (p_identifier, p_action, 1, now());
    v_result := jsonb_build_object('allowed', true, 'attempts', 1, 'max', p_max_attempts);
  ELSIF v_record.locked_until IS NOT NULL AND v_record.locked_until > now() THEN
    -- Account is locked
    v_result := jsonb_build_object(
      'allowed', false,
      'locked', true,
      'locked_until', v_record.locked_until,
      'attempts', v_record.attempt_count,
      'max', p_max_attempts
    );
  ELSIF v_record.attempt_count >= p_max_attempts THEN
    -- Lock the account
    UPDATE rate_limits
    SET locked_until = now() + (p_lockout_seconds || ' seconds')::interval
    WHERE id = v_record.id;
    v_result := jsonb_build_object(
      'allowed', false,
      'locked', true,
      'locked_until', now() + (p_lockout_seconds || ' seconds')::interval,
      'attempts', v_record.attempt_count,
      'max', p_max_attempts
    );
  ELSE
    -- Increment count
    UPDATE rate_limits SET attempt_count = attempt_count + 1 WHERE id = v_record.id;
    v_result := jsonb_build_object(
      'allowed', true,
      'attempts', v_record.attempt_count + 1,
      'max', p_max_attempts
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Reset rate limit on successful action
CREATE OR REPLACE FUNCTION reset_rate_limit(
  p_identifier text,
  p_action text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE identifier = p_identifier AND action_type = p_action;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS id_updated_at ON identity_documents;
CREATE TRIGGER id_updated_at BEFORE UPDATE ON identity_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS iv_updated_at ON identity_verifications;
CREATE TRIGGER iv_updated_at BEFORE UPDATE ON identity_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
