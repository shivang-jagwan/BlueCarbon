-- Create saved_projects table
CREATE TABLE IF NOT EXISTS saved_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, project_id)
);

-- Enable RLS for saved_projects
ALTER TABLE saved_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved projects" ON saved_projects
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());

-- Create followed_projects table
CREATE TABLE IF NOT EXISTS followed_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, project_id)
);

-- Enable RLS for followed_projects
ALTER TABLE followed_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own followed projects" ON followed_projects
  FOR ALL
  TO authenticated
  USING (company_id = auth.uid())
  WITH CHECK (company_id = auth.uid());
