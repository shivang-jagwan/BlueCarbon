-- ============================================================
-- CALENDAR EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'completed', 'cancelled', 'overdue')),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  location text,
  meeting_link text,
  color text,
  notes text,
  attachments text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_project ON calendar_events(project_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_assigned ON calendar_events(assigned_to);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Select Policy: Users can see events they created, are assigned to, or are linked to their projects
CREATE POLICY "events_select_policy" ON calendar_events FOR SELECT
  TO authenticated USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects WHERE projects.id = calendar_events.project_id AND (
        projects.owner_id = auth.uid() OR
        projects.verifier_id = auth.uid()
      )
    )) OR
    -- Partners can see events for verified/active/completed projects
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects WHERE projects.id = calendar_events.project_id AND projects.status IN ('verified','active','completed')
    ))
  );

-- Insert Policy: Owners can insert for their projects, Verifiers for assigned projects, or personal events (project_id null)
CREATE POLICY "events_insert_policy" ON calendar_events FOR INSERT
  TO authenticated WITH CHECK (
    created_by = auth.uid() AND
    (
      project_id IS NULL OR
      EXISTS (
        SELECT 1 FROM projects WHERE projects.id = calendar_events.project_id AND (
          projects.owner_id = auth.uid() OR
          projects.verifier_id = auth.uid()
        )
      )
    )
  );

-- Update Policy: Creators or assigned users or project owners/verifiers
CREATE POLICY "events_update_policy" ON calendar_events FOR UPDATE
  TO authenticated USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects WHERE projects.id = calendar_events.project_id AND (
        projects.owner_id = auth.uid() OR
        projects.verifier_id = auth.uid()
      )
    ))
  ) WITH CHECK (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects WHERE projects.id = calendar_events.project_id AND (
        projects.owner_id = auth.uid() OR
        projects.verifier_id = auth.uid()
      )
    ))
  );

-- Delete Policy: Only creator or project owner
CREATE POLICY "events_delete_policy" ON calendar_events FOR DELETE
  TO authenticated USING (
    created_by = auth.uid() OR
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM projects WHERE projects.id = calendar_events.project_id AND projects.owner_id = auth.uid()
    ))
  );
