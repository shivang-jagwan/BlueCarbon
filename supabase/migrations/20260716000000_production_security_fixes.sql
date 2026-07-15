-- ============================================================
-- MIGRATION: Production Security Fixes
-- verify_audit_checksum, RLS fixes, severity constraint, indexes
-- ============================================================

-- ============================================================
-- 1. CREATE verify_audit_checksum FUNCTION (CRITICAL FIX)
-- ============================================================
-- Called by services/audit.ts:verifyAuditIntegrity() but was never created.

CREATE OR REPLACE FUNCTION verify_audit_checksum(p_log_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record audit_logs%ROWTYPE;
  v_data text;
  v_expected text;
BEGIN
  SELECT * INTO v_record FROM audit_logs WHERE id = p_log_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  v_data := COALESCE(v_record.user_id::text, '') ||
            COALESCE(v_record.action, '') ||
            COALESCE(v_record.resource_type, '') ||
            COALESCE(v_record.resource_id, '') ||
            COALESCE(v_record.before_state::text, '') ||
            COALESCE(v_record.after_state::text, '') ||
            v_record.timestamp::text;
  v_expected := encode(sha256(v_data::bytea), 'hex');

  RETURN v_record.checksum = v_expected;
END;
$$;

-- ============================================================
-- 2. FIX project_risk_assessment RLS — ADD INSERT/UPDATE
-- ============================================================
-- calculateRiskAssessment() in services/dual-verification.ts needs
-- to INSERT and UPDATE but no policies exist for these operations.

DROP POLICY IF EXISTS pra_authenticated_insert ON project_risk_assessment;
CREATE POLICY pra_authenticated_insert ON project_risk_assessment
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS pra_authenticated_update ON project_risk_assessment;
CREATE POLICY pra_authenticated_update ON project_risk_assessment
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. FIX notifications_insert_own — RESTRICT TO SELF-ONLY
-- ============================================================
-- Current policy has WITH CHECK (true) allowing any user to forge
-- notifications to any user_id.

DROP POLICY IF EXISTS notifications_insert_own ON notifications;
CREATE POLICY notifications_insert_own ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. FIX security_events.severity CHECK CONSTRAINT
-- ============================================================
-- TypeScript includes 'security' as valid severity but DB only allows
-- info/warning/critical.

ALTER TABLE security_events
  DROP CONSTRAINT IF EXISTS security_events_severity_check;
ALTER TABLE security_events
  ADD CONSTRAINT security_events_severity_check
  CHECK (severity IN ('info', 'warning', 'critical', 'security'));

-- ============================================================
-- 5. ADD MISSING INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_project_files_storage_path ON project_files(storage_path);
CREATE INDEX IF NOT EXISTS idx_verification_evidence_storage_path ON verification_evidence(storage_path);
