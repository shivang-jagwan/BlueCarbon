-- ============================================================
-- MIGRATION: Critical Security Fixes (Round 2)
-- Drop insecure notification policy, recreate role escalation prevention
-- ============================================================

-- ============================================================
-- 1. DROP INSECURE notifications_insert_all POLICY
-- ============================================================
-- The old policy has WITH CHECK (true) which allows any authenticated
-- user to insert notifications for ANY user_id. PostgreSQL evaluates
-- multiple INSERT policies with OR logic, so this bypasses the
-- secure notifications_insert_own policy.

DROP POLICY IF EXISTS notifications_insert_all ON notifications;

-- ============================================================
-- 2. RECREATE prevent_role_escalation FUNCTION AND TRIGGER
-- ============================================================
-- This was referenced in earlier migrations but is missing from the
-- database. Without it, any user can escalate their own role.

CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only administrators can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_escalation ON profiles;
CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();
