-- Allow project owners to insert verification requests
CREATE POLICY "verif_req_insert_owner" ON verification_requests FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = verification_requests.project_id AND projects.owner_id = auth.uid())
  );

-- Allow authenticated users to send notifications to anyone
DROP POLICY IF EXISTS "notifications_insert_all" ON notifications;
CREATE POLICY "notifications_insert_all" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);
