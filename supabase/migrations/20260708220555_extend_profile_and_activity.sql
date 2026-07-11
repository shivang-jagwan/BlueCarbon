/*
# CarbonRush AI — Extended Profile & Activity Timeline Schema

## Overview
Extends the profiles table with KYC, address, bank, and professional details
for the Project Owner registration flow. Adds a project_activity table for
tracking all events in the project lifecycle.

## Modified Tables

1. **profiles** — Added columns:
   - mobile_number (text) — phone contact
   - aadhaar_number (text) — national ID (KYC)
   - aadhaar_url (text) — uploaded document path
   - pan_number (text) — tax ID (optional)
   - passport_photo_url (text) — KYC photo
   - state (text), district (text), village (text), pin_code (text) — address
   - bank_name (text), account_number (text), ifsc_code (text), upi_id (text) — bank details
   - occupation (text), experience (text), primary_activity (text) — professional
   - kyc_status (text) — KYC verification state
   - profile_completed (boolean) — onboarding completion flag

## New Tables

1. **project_activity** — Activity timeline events per project.
   - id, project_id (FK), actor_id (FK profiles), event_type, title, description,
     metadata (jsonb), created_at.

## Security
- project_activity: RLS enabled. Owners can read/insert their project's activity.
  Verifiers can read activity for assigned projects.
- profiles: existing policies cover the new columns (same row-level access).

## Notes
1. All new columns are nullable to avoid breaking existing rows.
2. kyc_status defaults to 'pending'.
3. profile_completed defaults to false.
*/

-- ============================================================
-- EXTEND PROFILES TABLE
-- ============================================================
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN mobile_number text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN aadhaar_number text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN aadhaar_url text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN pan_number text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN passport_photo_url text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN state text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN district text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN village text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN pin_code text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN bank_name text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN account_number text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN ifsc_code text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN upi_id text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN occupation text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN experience text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN primary_activity text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN kyc_status text NOT NULL DEFAULT 'pending'
    CHECK (kyc_status IN ('pending','submitted','verified','rejected'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN profile_completed boolean NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ============================================================
-- PROJECT ACTIVITY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS project_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_activity_project ON project_activity(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_created ON project_activity(created_at DESC);

ALTER TABLE project_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_select_owner" ON project_activity;
CREATE POLICY "activity_select_owner" ON project_activity FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_activity.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "activity_insert_owner" ON project_activity;
CREATE POLICY "activity_insert_owner" ON project_activity FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_activity.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "activity_select_verifier" ON project_activity;
CREATE POLICY "activity_select_verifier" ON project_activity FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_activity.project_id AND projects.verifier_id = auth.uid())
  );

-- Allow partners to read activity for verified projects they can see
DROP POLICY IF EXISTS "activity_select_partner" ON project_activity;
CREATE POLICY "activity_select_partner" ON project_activity FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_activity.project_id
      AND projects.status IN ('verified','active','completed')
    )
  );

-- ============================================================
-- EXTEND PROJECTS TABLE
-- ============================================================
DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN objectives text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN expected_duration_months integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN ownership_type text
    CHECK (ownership_type IN ('private','government','community','leased'));
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN survey_number text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN land_registry_url text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN cover_image_url text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN health_score integer DEFAULT 0
    CHECK (health_score >= 0 AND health_score <= 100);
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN center_lat double precision;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN center_lng double precision;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
