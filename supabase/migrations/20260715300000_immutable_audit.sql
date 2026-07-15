-- ============================================================
-- MIGRATION: Immutable Audit Logging System
-- ============================================================

-- ============================================================
-- 1. AUDIT LOGS (Append-Only)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),

  -- Actor
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  role text,
  session_id text,

  -- Action
  action text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'security')),

  -- Resource
  resource_type text NOT NULL,
  resource_id text,

  -- State tracking
  before_state jsonb,
  after_state jsonb,

  -- Context
  reason text,
  ip_address inet,
  device text,
  browser text,
  location jsonb,

  -- Integrity
  checksum text NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_role ON audit_logs(role);

-- ============================================================
-- 2. PREVENT UPDATE AND DELETE (append-only enforcement)
-- ============================================================

-- Revoke UPDATE and DELETE on audit_logs for everyone (including superuser)
-- This is enforced at the SQL level — no application code can bypass it
REVOKE UPDATE, DELETE ON audit_logs FROM authenticated;
REVOKE UPDATE, DELETE ON audit_logs FROM service_role;
REVOKE UPDATE, DELETE ON audit_logs FROM anon;

-- ============================================================
-- 3. AUDIT LOG RLS (read-only for admins, write via SECURITY DEFINER)
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY audit_admin_select ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Service function to insert audit logs (bypasses RLS)
CREATE OR REPLACE FUNCTION insert_audit_log(
  p_user_id uuid,
  p_role text,
  p_action text,
  p_resource_type text,
  p_resource_id text,
  p_before_state jsonb,
  p_after_state jsonb,
  p_reason text,
  p_severity text DEFAULT 'info',
  p_session_id text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_device text DEFAULT NULL,
  p_browser text DEFAULT NULL,
  p_location jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_checksum text;
  v_data text;
BEGIN
  -- Build checksum data for integrity
  v_data := COALESCE(p_user_id::text, '') || COALESCE(p_action, '') ||
            COALESCE(p_resource_type, '') || COALESCE(p_resource_id, '') ||
            COALESCE(p_before_state::text, '') || COALESCE(p_after_state::text, '') ||
            now()::text;
  v_checksum := encode(sha256(v_data::bytea), 'hex');

  INSERT INTO audit_logs (
    user_id, role, action, resource_type, resource_id,
    before_state, after_state, reason, severity,
    session_id, ip_address, device, browser, location,
    checksum
  ) VALUES (
    p_user_id, p_role, p_action, p_resource_type, p_resource_id,
    p_before_state, p_after_state, p_reason, p_severity,
    p_session_id, p_ip_address, p_device, p_browser, p_location,
    v_checksum
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================================
-- 4. AUDIT RETENTION POLICY (metadata table)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_retention_policy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL UNIQUE,
  retention_days integer NOT NULL DEFAULT 365,
  archive_after_days integer NOT NULL DEFAULT 90,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO audit_retention_policy (resource_type, retention_days, archive_after_days) VALUES
  ('project', 2555, 365),
  ('verification', 2555, 365),
  ('identity', 3650, 730),
  ('support', 2555, 365),
  ('auth', 1825, 365),
  ('admin', 3650, 730),
  ('system', 1095, 180)
ON CONFLICT (resource_type) DO NOTHING;

ALTER TABLE audit_retention_policy ENABLE ROW LEVEL SECURITY;
CREATE POLICY arp_admin_all ON audit_retention_policy FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP TRIGGER IF EXISTS arp_updated_at ON audit_retention_policy;
CREATE TRIGGER arp_updated_at BEFORE UPDATE ON audit_retention_policy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
