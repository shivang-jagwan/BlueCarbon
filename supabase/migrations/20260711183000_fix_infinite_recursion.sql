-- Drop the broken policies
DROP POLICY IF EXISTS "projects_select_verifier_request" ON projects;
DROP POLICY IF EXISTS "projects_select_funder" ON projects;

-- Create SECURITY DEFINER functions to break recursion
CREATE OR REPLACE FUNCTION is_project_verifier_via_request(p_id uuid, u_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM verification_requests vr
    WHERE vr.project_id = p_id
    AND vr.verifier_id = u_id
  );
$$;

CREATE OR REPLACE FUNCTION is_project_funder(p_id uuid, u_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM funding_contributions fc
    WHERE fc.project_id = p_id
    AND fc.partner_id = u_id
  );
$$;

-- Create new policies using the functions
CREATE POLICY "projects_select_verifier_request" ON projects FOR SELECT
TO authenticated USING (is_project_verifier_via_request(id, auth.uid()));

CREATE POLICY "projects_select_funder" ON projects FOR SELECT
TO authenticated USING (is_project_funder(id, auth.uid()));
