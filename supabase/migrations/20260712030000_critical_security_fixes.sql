-- ============================================================
-- SECURITY FIX: Privilege Escalation in handle_new_user()
-- ============================================================
-- PROBLEM: User-supplied role from raw_user_meta_data was trusted
-- to create admin/verifier accounts without server-side validation.
-- FIX: Only allow 'project_owner' and 'sustainability_partner' from
-- client metadata. Admin and verifier must be set server-side.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  requested_role text;
  safe_role text;
BEGIN
  requested_role := NEW.raw_user_meta_data->>'role';

  -- Only allow safe client-provided roles
  IF requested_role IN ('project_owner', 'sustainability_partner') THEN
    safe_role := requested_role;
  ELSE
    -- Default to project_owner for any other value (including 'admin', 'verifier')
    safe_role := 'project_owner';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, approval_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    safe_role,
    CASE WHEN safe_role = 'sustainability_partner' THEN 'approved' ELSE 'pending' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================
-- SECURITY FIX: Notifications INSERT Policy
-- ============================================================
-- PROBLEM: notifications_insert_own already existed but was being
-- bypassed. Ensure only owner can insert their own notifications.
-- ============================================================

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_all" ON notifications;

CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SECURITY FIX: Storage Policies — Scope to file owner
-- ============================================================
-- PROBLEM: "Give authenticated users full access to X" gave ALL
-- authenticated users read/write/delete to every file in every bucket.
-- FIX: Drop permissive policies, create scoped policies.

-- Drop all overly-permissive policies
DROP POLICY IF EXISTS "Give authenticated users full access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Give authenticated users full access to profile-documents" ON storage.objects;
DROP POLICY IF EXISTS "Give authenticated users full access to project-documents" ON storage.objects;
DROP POLICY IF EXISTS "Give authenticated users full access to evidence" ON storage.objects;
DROP POLICY IF EXISTS "Give authenticated users full access to monthly-monitoring" ON storage.objects;
DROP POLICY IF EXISTS "Give authenticated users full access to reports" ON storage.objects;

-- AVATARS: Users can manage their own files (path: user_id/filename)
CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- PROFILE-DOCUMENTS: Users can manage their own
CREATE POLICY "profile_docs_select_own" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'profile-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "profile_docs_insert_own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'profile-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "profile_docs_delete_own" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'profile-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- PROJECT-DOCUMENTS: Project owners and assigned verifiers
CREATE POLICY "project_docs_select_project_members" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'project-documents' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[2]
        AND (projects.owner_id = auth.uid() OR projects.verifier_id = auth.uid())
    )
  );
CREATE POLICY "project_docs_insert_project_owner" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'project-documents' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[2]
        AND projects.owner_id = auth.uid()
    )
  );
CREATE POLICY "project_docs_delete_project_owner" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'project-documents' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[2]
        AND projects.owner_id = auth.uid()
    )
  );

-- EVIDENCE: Project owners and assigned verifiers
CREATE POLICY "evidence_select_project_members" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'evidence' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[2]
        AND (projects.owner_id = auth.uid() OR projects.verifier_id = auth.uid())
    )
  );
CREATE POLICY "evidence_insert_project_owner" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'evidence' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[2]
        AND projects.owner_id = auth.uid()
    )
  );
CREATE POLICY "evidence_delete_project_owner" ON storage.objects FOR DELETE
  TO authenticated USING (
    bucket_id = 'evidence' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[2]
        AND projects.owner_id = auth.uid()
    )
  );

-- MONTHLY-MONITORING: Project owners and assigned verifiers
CREATE POLICY "monitoring_select_project_members" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'monthly-monitoring' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[2]
        AND (projects.owner_id = auth.uid() OR projects.verifier_id = auth.uid())
    )
  );
CREATE POLICY "monitoring_insert_project_owner" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'monthly-monitoring' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[2]
        AND projects.owner_id = auth.uid()
    )
  );

-- REPORTS: Project owners and assigned verifiers
CREATE POLICY "reports_select_project_members" ON storage.objects FOR SELECT
  TO authenticated USING (
    bucket_id = 'reports' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[2]
        AND (projects.owner_id = auth.uid() OR projects.verifier_id = auth.uid())
    )
  );
CREATE POLICY "reports_insert_project_owner" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (
    bucket_id = 'reports' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id::text = (storage.foldername(name))[2]
        AND projects.owner_id = auth.uid()
    )
  );

-- ============================================================
-- SECURITY FIX: Add updated_at triggers for missing tables
-- ============================================================
DROP TRIGGER IF EXISTS calendar_events_updated_at ON calendar_events;
CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS project_partnerships_updated_at ON project_partnerships;
CREATE TRIGGER project_partnerships_updated_at
  BEFORE UPDATE ON project_partnerships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- SECURITY FIX: Restrict profile role escalation via UPDATE
-- ============================================================
-- Users must not be able to change their own role or approval_status
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only super_admin (not currently implemented) can change role/approval
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.approval_status IS DISTINCT FROM NEW.approval_status) THEN
    RAISE EXCEPTION 'Cannot modify role or approval_status directly';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_escalation ON profiles;
CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();
