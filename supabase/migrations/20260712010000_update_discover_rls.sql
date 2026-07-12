-- Update the RLS policy to allow authenticated users (Sustainability Partners) 
-- to view 'registered' projects in addition to verified/active projects.

DROP POLICY IF EXISTS "projects_select_verified_public" ON projects;

CREATE POLICY "projects_select_verified_public" ON projects FOR SELECT
TO authenticated USING (
  status = ANY (ARRAY['registered', 'verified', 'active', 'completed', 'in_verification'])
);
