-- Migration: Add RLS policy for VOC agency users to read project_activity

-- 1. Allow VOC agency users to SELECT project_activity for projects they have requests for
DROP POLICY IF EXISTS activity_select_voc_agency ON project_activity;
CREATE POLICY activity_select_voc_agency ON project_activity
  FOR SELECT USING (
    project_id IN (SELECT get_agency_project_ids(auth.uid()))
  );

-- 2. Allow VOC agency users to INSERT project_activity for projects they have requests for
DROP POLICY IF EXISTS activity_insert_voc_agency ON project_activity;
CREATE POLICY activity_insert_voc_agency ON project_activity
  FOR INSERT WITH CHECK (
    actor_id = auth.uid()
    AND project_id IN (SELECT get_agency_project_ids(auth.uid()))
  );
