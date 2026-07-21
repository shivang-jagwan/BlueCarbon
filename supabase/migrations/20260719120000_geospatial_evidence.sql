-- ============================================================
-- GEOSPATIAL EVIDENCE COLLECTION — Migration
-- Adds audit_media, gallery_albums tables, RLS, and storage
-- ============================================================

-- 1. Gallery Albums
CREATE TABLE IF NOT EXISTS gallery_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  verification_id TEXT,
  audit_id UUID,
  album_type TEXT NOT NULL CHECK (album_type IN ('monitoring', 'audit')),
  title TEXT NOT NULL,
  description TEXT,
  agency_name TEXT,
  verifier_name TEXT,
  audit_date TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE gallery_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_albums_select_auth" ON gallery_albums
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "gallery_albums_insert_auth" ON gallery_albums
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "gallery_albums_update_owner" ON gallery_albums
  FOR UPDATE USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "gallery_albums_delete_admin" ON gallery_albums
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_gallery_albums_project ON gallery_albums(project_id);
CREATE INDEX IF NOT EXISTS idx_gallery_albums_audit ON gallery_albums(audit_id);
CREATE INDEX IF NOT EXISTS idx_gallery_albums_type ON gallery_albums(album_type);

-- 2. Audit Media
CREATE TABLE IF NOT EXISTS audit_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  verification_id TEXT,
  audit_id UUID,
  album_id UUID REFERENCES gallery_albums(id) ON DELETE SET NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'drone_image', 'drone_video', 'satellite')),
  storage_path TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  accuracy_meters DOUBLE PRECISION,
  altitude_meters DOUBLE PRECISION,
  device_name TEXT,
  uploaded_by UUID,
  verifier_name TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  captured_at TIMESTAMPTZ,
  flight_date TEXT,
  satellite_date TEXT,
  description TEXT,
  field_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE audit_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_media_select_auth" ON audit_media
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "audit_media_insert_auth" ON audit_media
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "audit_media_update_verifier" ON audit_media
  FOR UPDATE USING (
    auth.uid() = uploaded_by
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "audit_media_delete_admin" ON audit_media
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_audit_media_project ON audit_media(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_media_audit ON audit_media(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_media_album ON audit_media(album_id);
CREATE INDEX IF NOT EXISTS idx_audit_media_type ON audit_media(media_type);
CREATE INDEX IF NOT EXISTS idx_audit_media_verification ON audit_media(verification_id);

-- 3. GPS Location Capture (for auditor's current location during audit)
CREATE TABLE IF NOT EXISTS audit_location_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_meters DOUBLE PRECISION,
  altitude_meters DOUBLE PRECISION,
  captured_by UUID,
  verifier_name TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT
);

ALTER TABLE audit_location_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_location_captures_select_auth" ON audit_location_captures
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "audit_location_captures_insert_auth" ON audit_location_captures
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_audit_location_audit ON audit_location_captures(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_location_project ON audit_location_captures(project_id);
