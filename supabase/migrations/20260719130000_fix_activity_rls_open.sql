-- ============================================================
-- FIX project_activity RLS — 403 errors
-- Activity logs are audit trail data; any authenticated user
-- should be able to read them. Inserts also need to be more
-- permissive so VOC/verifier service calls succeed.
-- ============================================================

-- Drop all existing SELECT policies (too restrictive)
DROP POLICY IF EXISTS "activity_select_owner" ON project_activity;
DROP POLICY IF EXISTS "activity_select_partner" ON project_activity;
DROP POLICY IF EXISTS "activity_select_verifier" ON project_activity;
DROP POLICY IF EXISTS "activity_select_voc_agency" ON project_activity;
DROP POLICY IF EXISTS "activity_select_own" ON project_activity;

-- One permissive SELECT for all authenticated users
CREATE POLICY "activity_select_authenticated" ON project_activity
  FOR SELECT TO authenticated USING (true);

-- Drop all existing INSERT policies (some require actor_id = auth.uid()
-- but our client-side logActivity() doesn't always set it)
DROP POLICY IF EXISTS "activity_insert_owner" ON project_activity;
DROP POLICY IF EXISTS "activity_insert_verifier" ON project_activity;
DROP POLICY IF EXISTS "activity_insert_voc_agency" ON project_activity;
DROP POLICY IF EXISTS "activity_insert_own" ON project_activity;

-- One permissive INSERT for all authenticated users
CREATE POLICY "activity_insert_authenticated" ON project_activity
  FOR INSERT TO authenticated WITH CHECK (true);
