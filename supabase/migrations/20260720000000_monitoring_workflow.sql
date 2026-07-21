-- ============================================================
-- MONITORING WORKFLOW
-- ============================================================

CREATE TABLE IF NOT EXISTS project_monitoring_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id uuid NOT NULL REFERENCES project_partnerships(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verifier_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  next_monitoring_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(partnership_id)
);

CREATE INDEX IF NOT EXISTS idx_monitoring_assignments_project ON project_monitoring_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_assignments_verifier ON project_monitoring_assignments(verifier_id);

ALTER TABLE project_monitoring_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monitoring_assignments_select" ON project_monitoring_assignments FOR SELECT
TO authenticated USING (
  company_id = auth.uid() OR
  verifier_id = auth.uid() OR
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_monitoring_assignments.project_id AND projects.owner_id = auth.uid())
);

CREATE POLICY "monitoring_assignments_insert" ON project_monitoring_assignments FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_monitoring_assignments.project_id AND projects.owner_id = auth.uid())
);

CREATE POLICY "monitoring_assignments_update" ON project_monitoring_assignments FOR UPDATE
TO authenticated USING (
  verifier_id = auth.uid()
) WITH CHECK (
  verifier_id = auth.uid()
);

-- Function to automatically create monitoring assignment when partnership becomes active
CREATE OR REPLACE FUNCTION create_monitoring_assignment_on_active_partnership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    INSERT INTO project_monitoring_assignments (partnership_id, project_id, company_id, verifier_id, status)
    VALUES (NEW.id, NEW.project_id, NEW.company_id, NEW.verifier_id, 'pending')
    ON CONFLICT (partnership_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_monitoring_assignment ON project_partnerships;
CREATE TRIGGER trigger_create_monitoring_assignment
AFTER UPDATE ON project_partnerships
FOR EACH ROW
EXECUTE FUNCTION create_monitoring_assignment_on_active_partnership();

-- ============================================================
-- MONITORING REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS project_monitoring_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES project_monitoring_assignments(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  verifier_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Form Data
  general_inspection text,
  tree_growth text,
  tree_survival_rate numeric,
  new_plantation_count integer,
  carbon_estimate_tons numeric,
  biomass_notes text,
  biodiversity_notes text,
  soil_condition text,
  water_condition text,
  threats text,
  restoration_progress text,
  recommendations text,
  overall_health_score integer CHECK (overall_health_score >= 0 AND overall_health_score <= 100),
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_reports_project ON project_monitoring_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_reports_assignment ON project_monitoring_reports(assignment_id);

ALTER TABLE project_monitoring_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monitoring_reports_select" ON project_monitoring_reports FOR SELECT
TO authenticated USING (
  verifier_id = auth.uid() OR
  (status = 'submitted' AND (
    EXISTS (SELECT 1 FROM project_monitoring_assignments pma WHERE pma.id = assignment_id AND pma.company_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_id AND projects.owner_id = auth.uid())
  ))
);

CREATE POLICY "monitoring_reports_insert" ON project_monitoring_reports FOR INSERT
TO authenticated WITH CHECK (
  verifier_id = auth.uid()
);

CREATE POLICY "monitoring_reports_update" ON project_monitoring_reports FOR UPDATE
TO authenticated USING (
  verifier_id = auth.uid() AND status = 'draft'
) WITH CHECK (
  verifier_id = auth.uid()
);
