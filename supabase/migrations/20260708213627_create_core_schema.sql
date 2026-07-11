/*
# CarbonRush AI — Core Schema

## Overview
Creates foundational tables: profiles, projects, project_documents,
monitoring_reports, funding_contributions, notifications.

## New Tables
1. profiles — extends auth.users with role, approval status, org info.
2. projects — core project registry for restoration projects.
3. project_documents — evidence and document uploads per project.
4. monitoring_reports — monthly monitoring data per project.
5. funding_contributions — partner funding and carbon credit purchases.
6. notifications — in-app notifications per user.

## Security (RLS)
- All tables have RLS enabled.
- profiles: users read/update own; approved profiles readable by all auth users.
- projects: owners full CRUD; verifiers read+update assigned; partners read verified.
- project_documents: owners CRUD; verifiers read assigned.
- monitoring_reports: owners create/read; verifiers read+update assigned.
- funding_contributions: partners CRUD own; owners read theirs.
- notifications: users CRUD own.

## Notes
1. Profile auto-creation via trigger on auth.users INSERT.
2. Slug uniqueness enforced per owner.
3. GeoJSON stored as jsonb.
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  organization text,
  role text NOT NULL DEFAULT 'project_owner'
    CHECK (role IN ('project_owner','verifier','sustainability_partner','admin')),
  approval_status text NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected','suspended')),
  avatar_url text,
  bio text,
  country text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_approved" ON profiles;
CREATE POLICY "profiles_select_approved" ON profiles FOR SELECT
  TO authenticated USING (approval_status = 'approved');

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  project_type text NOT NULL DEFAULT 'mangrove'
    CHECK (project_type IN ('mangrove','seagrass','salt_marsh','kelp_forest','mixed')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','registered','in_verification','verified','rejected','active','paused','completed')),
  country text,
  location_name text,
  boundary_geojson jsonb,
  area_hectares numeric,
  perimeter_km numeric,
  target_carbon_tonnes numeric,
  verified_carbon_tonnes numeric,
  start_date date,
  end_date date,
  verifier_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verification_status text NOT NULL DEFAULT 'not_submitted'
    CHECK (verification_status IN ('not_submitted','pending','in_review','approved','rejected','expired')),
  passport_issued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_verifier ON projects(verifier_id);
CREATE INDEX IF NOT EXISTS idx_projects_verification_status ON projects(verification_status);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_own" ON projects;
CREATE POLICY "projects_select_own" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "projects_insert_own" ON projects;
CREATE POLICY "projects_insert_own" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "projects_update_own" ON projects;
CREATE POLICY "projects_update_own" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "projects_delete_own" ON projects;
CREATE POLICY "projects_delete_own" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "projects_select_assigned_verifier" ON projects;
CREATE POLICY "projects_select_assigned_verifier" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = verifier_id);

DROP POLICY IF EXISTS "projects_update_verifier" ON projects;
CREATE POLICY "projects_update_verifier" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = verifier_id) WITH CHECK (auth.uid() = verifier_id);

DROP POLICY IF EXISTS "projects_select_verified_public" ON projects;
CREATE POLICY "projects_select_verified_public" ON projects FOR SELECT
  TO authenticated USING (
    status IN ('verified','active','completed','in_verification')
  );

-- ============================================================
-- PROJECT DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  category text NOT NULL DEFAULT 'evidence',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_documents_project ON project_documents(project_id);

ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "docs_select_project_owner" ON project_documents;
CREATE POLICY "docs_select_project_owner" ON project_documents FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_documents.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "docs_insert_project_owner" ON project_documents;
CREATE POLICY "docs_insert_project_owner" ON project_documents FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_documents.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "docs_delete_project_owner" ON project_documents;
CREATE POLICY "docs_delete_project_owner" ON project_documents FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_documents.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "docs_select_verifier" ON project_documents;
CREATE POLICY "docs_select_verifier" ON project_documents FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_documents.project_id AND projects.verifier_id = auth.uid())
  );

-- ============================================================
-- MONITORING REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS monitoring_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  period_month text NOT NULL,
  area_observed_hectares numeric,
  ndvi_avg numeric,
  carbon_estimate_tonnes numeric,
  notes text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','reviewed','approved')),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_project ON monitoring_reports(project_id);

ALTER TABLE monitoring_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "monitoring_select_owner" ON monitoring_reports;
CREATE POLICY "monitoring_select_owner" ON monitoring_reports FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = monitoring_reports.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "monitoring_insert_owner" ON monitoring_reports;
CREATE POLICY "monitoring_insert_owner" ON monitoring_reports FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = monitoring_reports.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "monitoring_update_owner" ON monitoring_reports;
CREATE POLICY "monitoring_update_owner" ON monitoring_reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = monitoring_reports.project_id AND projects.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "monitoring_select_verifier" ON monitoring_reports;
CREATE POLICY "monitoring_select_verifier" ON monitoring_reports FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = monitoring_reports.project_id AND projects.verifier_id = auth.uid())
  );

DROP POLICY IF EXISTS "monitoring_update_verifier" ON monitoring_reports;
CREATE POLICY "monitoring_update_verifier" ON monitoring_reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = monitoring_reports.project_id AND projects.verifier_id = auth.uid())
  );

-- ============================================================
-- FUNDING CONTRIBUTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS funding_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  amount_usd numeric NOT NULL DEFAULT 0,
  carbon_credits_tonnes numeric,
  status text NOT NULL DEFAULT 'pledged'
    CHECK (status IN ('pledged','completed','refunded')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funding_project ON funding_contributions(project_id);
CREATE INDEX IF NOT EXISTS idx_funding_partner ON funding_contributions(partner_id);

ALTER TABLE funding_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "funding_select_partner" ON funding_contributions;
CREATE POLICY "funding_select_partner" ON funding_contributions FOR SELECT
  TO authenticated USING (auth.uid() = partner_id);

DROP POLICY IF EXISTS "funding_insert_partner" ON funding_contributions;
CREATE POLICY "funding_insert_partner" ON funding_contributions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = partner_id);

DROP POLICY IF EXISTS "funding_update_partner" ON funding_contributions;
CREATE POLICY "funding_update_partner" ON funding_contributions FOR UPDATE
  TO authenticated USING (auth.uid() = partner_id) WITH CHECK (auth.uid() = partner_id);

DROP POLICY IF EXISTS "funding_select_owner" ON funding_contributions;
CREATE POLICY "funding_select_owner" ON funding_contributions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = funding_contributions.project_id AND projects.owner_id = auth.uid())
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text NOT NULL DEFAULT 'general',
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: Auto-create profile on auth.users INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, approval_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'project_owner'),
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- UPDATED_AT triggers
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
