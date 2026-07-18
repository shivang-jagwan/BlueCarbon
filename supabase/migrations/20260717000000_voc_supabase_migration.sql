-- ============================================================
-- MIGRATION: VOC Supabase Migration
-- Drop old single-verifier verification tables, create new
-- multi-agency VOC tables, seed agencies, fix RLS.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. DROP OLD TABLES AND FUNCTIONS
-- ============================================================

DROP POLICY IF EXISTS vh_select_verifier ON verification_history;
DROP POLICY IF EXISTS pd2_verifier_select ON project_documents_v2;
DROP POLICY IF EXISTS pd2_verifier_update ON project_documents_v2;

DROP TABLE IF EXISTS verification_service_decisions CASCADE;
DROP TABLE IF EXISTS verification_service_requests CASCADE;
DROP TABLE IF EXISTS verification_decisions CASCADE;
DROP TABLE IF EXISTS verification_requests CASCADE;

DROP FUNCTION IF EXISTS is_project_verifier_via_request(uuid, uuid) CASCADE;

-- ============================================================
-- 2. CREATE insert_notification RPC FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION insert_notification(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_type text DEFAULT 'general',
  p_link text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO notifications (user_id, title, body, type, link)
  VALUES (p_user_id, p_title, p_body, p_type, p_link)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('id', v_id, 'error', null);
END;
$$;

-- ============================================================
-- 3. CREATE ALL VOC TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS verification_agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  logo_url text,
  registration_number text NOT NULL,
  description text,
  mission text,
  founded_year integer,
  headquarters text,
  operating_regions text[] DEFAULT '{}',
  countries_served text[] DEFAULT '{}',
  states_covered text[] DEFAULT '{}',
  expertise text[] DEFAULT '{}',
  services text[] DEFAULT '{}',
  supported_ecosystems text[] DEFAULT '{}',
  certifications jsonb DEFAULT '[]',
  projects_certified integer DEFAULT 0,
  active_applications integer DEFAULT 0,
  avg_verification_days integer DEFAULT 0,
  years_of_operation integer DEFAULT 0,
  available_audit_teams integer DEFAULT 0,
  estimated_review_days integer DEFAULT 0,
  availability text NOT NULL DEFAULT 'accepting'
    CHECK (availability IN ('accepting', 'limited', 'fully_booked')),
  verification_status text NOT NULL DEFAULT 'active'
    CHECK (verification_status IN ('active', 'pending', 'inactive')),
  accepts_new_applications boolean DEFAULT true,
  paused boolean DEFAULT false,
  recent_projects jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_va_profile ON verification_agencies(profile_id);
CREATE INDEX IF NOT EXISTS idx_va_availability ON verification_agencies(availability);
CREATE INDEX IF NOT EXISTS idx_va_status ON verification_agencies(verification_status);
ALTER TABLE verification_agencies ENABLE ROW LEVEL SECURITY;

-- Fix profile_id nullable if table existed from partial previous run
DO $$ BEGIN
  ALTER TABLE verification_agencies ALTER COLUMN profile_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS voc_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  project_owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_owner_name text NOT NULL,
  snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vr_project ON voc_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_vr_owner ON voc_requests(project_owner_id);
CREATE INDEX IF NOT EXISTS idx_vr_number ON voc_requests(request_number);
ALTER TABLE voc_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS voc_agency_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES voc_requests(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES verification_agencies(id) ON DELETE CASCADE,
  agency_name text NOT NULL,
  request_status text NOT NULL DEFAULT 'sent'
    CHECK (request_status IN ('sent', 'accepted', 'declined')),
  verification_status text NOT NULL DEFAULT 'waiting'
    CHECK (verification_status IN (
      'waiting', 'under_review', 'audit_scheduled', 'audit_completed',
      'approved', 'returned', 'rejected'
    )),
  assigned_verifier text,
  audit_date timestamptz,
  carbon_passport_status text NOT NULL DEFAULT 'none'
    CHECK (carbon_passport_status IN ('none', 'requested', 'under_processing', 'issued')),
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_var_request ON voc_agency_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_var_agency ON voc_agency_requests(agency_id);
CREATE INDEX IF NOT EXISTS idx_var_status ON voc_agency_requests(verification_status);
ALTER TABLE voc_agency_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS voc_passport_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES voc_requests(id) ON DELETE CASCADE,
  agency_id uuid NOT NULL REFERENCES verification_agencies(id) ON DELETE CASCADE,
  agency_name text NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  project_owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'under_processing', 'issued')),
  assigned_verifier text,
  verification_report_ref text,
  audit_report_ref text,
  certificate_url text,
  passport_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vpa_project ON voc_passport_applications(project_id);
CREATE INDEX IF NOT EXISTS idx_vpa_request ON voc_passport_applications(request_id);
CREATE INDEX IF NOT EXISTS idx_vpa_agency ON voc_passport_applications(agency_id);
CREATE INDEX IF NOT EXISTS idx_vpa_owner ON voc_passport_applications(project_owner_id);
ALTER TABLE voc_passport_applications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS voc_official_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES voc_requests(id) ON DELETE CASCADE,
  record_type text NOT NULL
    CHECK (record_type IN (
      'carbon_passport', 'verification_certificate', 'audit_report',
      'ngo_approval', 'supporting_document', 'verification_history'
    )),
  title text NOT NULL,
  description text,
  verifier_name text,
  ngo_name text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vor_request ON voc_official_records(request_id);
CREATE INDEX IF NOT EXISTS idx_vor_type ON voc_official_records(record_type);
ALTER TABLE voc_official_records ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS voc_audit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES voc_requests(id) ON DELETE CASCADE,
  agency_request_id uuid NOT NULL REFERENCES voc_agency_requests(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  auditor_name text NOT NULL,
  audit_date timestamptz NOT NULL,
  area_verified numeric,
  tree_count integer,
  species_count integer,
  site_condition text CHECK (site_condition IN ('excellent', 'good', 'fair', 'poor')),
  gps_validated boolean DEFAULT false,
  gps_coordinates text,
  photos_count integer DEFAULT 0,
  videos_count integer DEFAULT 0,
  remarks text,
  final_observation text,
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_var_audit_request ON voc_audit_reports(request_id);
CREATE INDEX IF NOT EXISTS idx_var_audit_agency_req ON voc_audit_reports(agency_request_id);
ALTER TABLE voc_audit_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. SECURITY DEFINER HELPER FUNCTIONS (break RLS recursion)
-- ============================================================
-- These functions run as the definer (superuser) and bypass RLS,
-- preventing circular policy evaluation between voc_requests and
-- voc_agency_requests.

CREATE OR REPLACE FUNCTION public.is_voc_agency_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM verification_agencies WHERE profile_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_agency_project_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT DISTINCT vr.project_id
  FROM voc_requests vr
  JOIN voc_agency_requests var ON var.request_id = vr.id
  JOIN verification_agencies va ON va.id = var.agency_id
  WHERE va.profile_id = p_user_id;
$$;

CREATE OR REPLACE FUNCTION public.user_has_agency_request(p_request_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM voc_agency_requests var
    JOIN verification_agencies va ON va.id = var.agency_id
    WHERE var.request_id = p_request_id AND va.profile_id = p_user_id
  );
$$;

-- ============================================================
-- 5. DROP EXISTING VOC POLICIES THEN RECREATE ALL (no recursion)
-- ============================================================

-- Drop all VOC policies
DROP POLICY IF EXISTS va_select_all ON verification_agencies;
DROP POLICY IF EXISTS va_update_own ON verification_agencies;
DROP POLICY IF EXISTS va_admin_all ON verification_agencies;
DROP POLICY IF EXISTS vr_owner_select ON voc_requests;
DROP POLICY IF EXISTS vr_owner_insert ON voc_requests;
DROP POLICY IF EXISTS vr_agency_select ON voc_requests;
DROP POLICY IF EXISTS var_owner_select ON voc_agency_requests;
DROP POLICY IF EXISTS var_owner_insert ON voc_agency_requests;
DROP POLICY IF EXISTS var_owner_update ON voc_agency_requests;
DROP POLICY IF EXISTS var_agency_select ON voc_agency_requests;
DROP POLICY IF EXISTS var_agency_update ON voc_agency_requests;
DROP POLICY IF EXISTS vpa_owner_select ON voc_passport_applications;
DROP POLICY IF EXISTS vpa_owner_insert ON voc_passport_applications;
DROP POLICY IF EXISTS vpa_owner_update ON voc_passport_applications;
DROP POLICY IF EXISTS vpa_agency_select ON voc_passport_applications;
DROP POLICY IF EXISTS vpa_agency_update ON voc_passport_applications;
DROP POLICY IF EXISTS vor_owner_select ON voc_official_records;
DROP POLICY IF EXISTS vor_insert_system ON voc_official_records;
DROP POLICY IF EXISTS vor_agency_select ON voc_official_records;
DROP POLICY IF EXISTS var_audit_owner_select ON voc_audit_reports;
DROP POLICY IF EXISTS var_audit_agency_insert ON voc_audit_reports;
DROP POLICY IF EXISTS var_audit_agency_select ON voc_audit_reports;
DROP POLICY IF EXISTS pd2_verifier_select ON project_documents_v2;
DROP POLICY IF EXISTS pd2_verifier_update ON project_documents_v2;
DROP POLICY IF EXISTS vh_select_verifier ON verification_history;

-- verification_agencies policies
CREATE POLICY va_select_all ON verification_agencies FOR SELECT TO authenticated
  USING (true);
CREATE POLICY va_update_own ON verification_agencies FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
CREATE POLICY va_admin_all ON verification_agencies FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- voc_requests policies (NO cross-table subqueries to avoid recursion)
CREATE POLICY vr_owner_select ON voc_requests FOR SELECT TO authenticated
  USING (project_owner_id = auth.uid());
CREATE POLICY vr_owner_insert ON voc_requests FOR INSERT TO authenticated
  WITH CHECK (
    project_owner_id = auth.uid()
    AND EXISTS (SELECT 1 FROM projects WHERE id = project_id AND owner_id = auth.uid())
  );
CREATE POLICY vr_agency_select ON voc_requests FOR SELECT TO authenticated
  USING (is_voc_agency_user(auth.uid()));

-- voc_agency_requests policies (owner queries voc_requests directly, no recursion)
CREATE POLICY var_owner_select ON voc_agency_requests FOR SELECT TO authenticated
  USING (request_id IN (SELECT vr.id FROM voc_requests vr WHERE vr.project_owner_id = auth.uid()));
CREATE POLICY var_owner_insert ON voc_agency_requests FOR INSERT TO authenticated
  WITH CHECK (request_id IN (SELECT vr.id FROM voc_requests vr WHERE vr.project_owner_id = auth.uid()));
CREATE POLICY var_owner_update ON voc_agency_requests FOR UPDATE TO authenticated
  USING (request_id IN (SELECT vr.id FROM voc_requests vr WHERE vr.project_owner_id = auth.uid()));
CREATE POLICY var_agency_select ON voc_agency_requests FOR SELECT TO authenticated
  USING (agency_id IN (SELECT id FROM verification_agencies WHERE profile_id = auth.uid()));
CREATE POLICY var_agency_update ON voc_agency_requests FOR UPDATE TO authenticated
  USING (agency_id IN (SELECT id FROM verification_agencies WHERE profile_id = auth.uid()));

-- voc_passport_applications policies
CREATE POLICY vpa_owner_select ON voc_passport_applications FOR SELECT TO authenticated
  USING (project_owner_id = auth.uid());
CREATE POLICY vpa_owner_insert ON voc_passport_applications FOR INSERT TO authenticated
  WITH CHECK (project_owner_id = auth.uid());
CREATE POLICY vpa_owner_update ON voc_passport_applications FOR UPDATE TO authenticated
  USING (project_owner_id = auth.uid());
CREATE POLICY vpa_agency_select ON voc_passport_applications FOR SELECT TO authenticated
  USING (is_voc_agency_user(auth.uid()));
CREATE POLICY vpa_agency_update ON voc_passport_applications FOR UPDATE TO authenticated
  USING (is_voc_agency_user(auth.uid()));

-- voc_official_records policies
CREATE POLICY vor_owner_select ON voc_official_records FOR SELECT TO authenticated
  USING (request_id IN (SELECT vr.id FROM voc_requests vr WHERE vr.project_owner_id = auth.uid()));
CREATE POLICY vor_insert_system ON voc_official_records FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY vor_agency_select ON voc_official_records FOR SELECT TO authenticated
  USING (is_voc_agency_user(auth.uid()));

-- voc_audit_reports policies
CREATE POLICY var_audit_owner_select ON voc_audit_reports FOR SELECT TO authenticated
  USING (request_id IN (SELECT vr.id FROM voc_requests vr WHERE vr.project_owner_id = auth.uid()));
CREATE POLICY var_audit_agency_insert ON voc_audit_reports FOR INSERT TO authenticated
  WITH CHECK (is_voc_agency_user(auth.uid()));
CREATE POLICY var_audit_agency_select ON voc_audit_reports FOR SELECT TO authenticated
  USING (is_voc_agency_user(auth.uid()));

-- project_documents_v2 and verification_history (use SECURITY DEFINER to avoid recursion)
CREATE POLICY pd2_verifier_select ON project_documents_v2 FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT project_id FROM project_partnerships WHERE verifier_id = auth.uid() AND status = 'active')
    OR project_id IN (SELECT get_agency_project_ids(auth.uid()))
  );
CREATE POLICY pd2_verifier_update ON project_documents_v2 FOR UPDATE TO authenticated
  USING (
    project_id IN (SELECT project_id FROM project_partnerships WHERE verifier_id = auth.uid() AND status = 'active')
    OR project_id IN (SELECT get_agency_project_ids(auth.uid()))
  );
CREATE POLICY vh_select_verifier ON verification_history FOR SELECT TO authenticated
  USING (
    project_id IN (SELECT project_id FROM project_partnerships WHERE verifier_id = auth.uid() AND status = 'active')
    OR project_id IN (SELECT get_agency_project_ids(auth.uid()))
  );

-- ============================================================
-- 6. CREATE FUNCTIONS, TRIGGERS, REALTIME
-- ============================================================

CREATE OR REPLACE FUNCTION is_project_verifier_via_request(p_id uuid, u_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM voc_agency_requests var
    JOIN voc_requests vr ON vr.id = var.request_id
    JOIN verification_agencies va ON va.id = var.agency_id
    WHERE vr.project_id = p_id
      AND va.profile_id = u_id
      AND var.request_status != 'declined'
      AND var.verification_status NOT IN ('approved', 'returned', 'rejected')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP TRIGGER IF EXISTS va_updated_at ON verification_agencies;
CREATE TRIGGER va_updated_at
  BEFORE UPDATE ON verification_agencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS vpa_updated_at ON voc_passport_applications;
CREATE TRIGGER vpa_updated_at
  BEFORE UPDATE ON voc_passport_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE voc_agency_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE voc_requests;

-- ============================================================
-- 6. SEED VERIFICATION AGENCIES
-- ============================================================

DO $$
DECLARE
  agency RECORD;
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM verification_agencies;
  IF v_count > 0 THEN
    RAISE NOTICE 'Agencies already seeded (% rows), skipping.', v_count;
    RETURN;
  END IF;

  FOR agency IN
    SELECT * FROM (VALUES
      ('GreenRoots Foundation', 'IND/GOV/2018/BCR-4412',
        'GreenRoots Foundation is a leading government-certified verification agency specializing in blue carbon ecosystem restoration. With over 8 years of field experience across South Asia, we have certified 142+ mangrove and wetland restoration projects.',
        'To accelerate climate action through rigorous, transparent, and science-based verification of blue carbon ecosystems.',
        2018, 'Mumbai, Maharashtra, India',
        ARRAY['Maharashtra','Gujarat','Odisha','Karnataka','Tamil Nadu'],
        ARRAY['India','Sri Lanka','Bangladesh','Maldives'],
        ARRAY['Maharashtra','Gujarat','Odisha','Karnataka','Tamil Nadu','Goa','Kerala'],
        ARRAY['Mangrove Restoration','Blue Carbon','Wetlands','Coastal Restoration'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Blue Carbon Projects','GIS Mapping'],
        ARRAY['Mangroves','Wetlands','Blue Carbon','Coastal Restoration'],
        '[{"name":"Government Registered"},{"name":"Blue Carbon Certified"},{"name":"ISO 14001"},{"name":"Environmental Impact Certified"}]',
        142, 11, 18, 8, 3, 14, 'accepting',
        '[{"project_name":"Sundarbans Mangrove Phase III","status":"approved","date":"2026-07-01"},{"project_name":"Thane Creek Restoration","status":"approved","date":"2026-06-15"},{"project_name":"Pulicat Lake Wetlands","status":"approved","date":"2026-04-20"}]'),

      ('Coastal Verification Services', 'IND/GOV/2019/BCV-7831',
        'Coastal Verification Services is a nationally accredited verification body with deep expertise in coastal ecosystem certification.',
        'Providing credible, science-driven verification that empowers coastal communities and protects marine ecosystems.',
        2019, 'Chennai, Tamil Nadu, India',
        ARRAY['Tamil Nadu','Andhra Pradesh','Odisha','West Bengal','Kerala'],
        ARRAY['India','Myanmar','Thailand'],
        ARRAY['Tamil Nadu','Andhra Pradesh','Odisha','West Bengal','Kerala','Puducherry'],
        ARRAY['Coastal Restoration','Mangrove Restoration','Biodiversity','Wetlands'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Biodiversity Assessment','Drone Survey'],
        ARRAY['Mangroves','Wetlands','Coral Reefs','Seagrass Beds'],
        '[{"name":"Government Registered"},{"name":"Blue Carbon Certified"},{"name":"ISO 14001"}]',
        98, 7, 22, 7, 4, 16, 'accepting',
        '[{"project_name":"Pichavaram Mangrove Expansion","status":"approved","date":"2026-06-28"},{"project_name":"Chilika Lake Conservation","status":"approved","date":"2026-05-12"},{"project_name":"Vembanad Wetlands Project","status":"approved","date":"2026-03-18"}]'),

      ('Pacific Mangrove Foundation', 'IDN/GOV/2020/PMF-2290',
        'Pacific Mangrove Foundation operates across Southeast Asia, providing specialized verification services for mangrove and coastal restoration projects.',
        'Leveraging technology and local partnerships to deliver fast, accurate, and scalable verification of nature-based solutions.',
        2020, 'Jakarta, Indonesia',
        ARRAY['Java','Sumatra','Kalimantan','Sulawesi'],
        ARRAY['Indonesia','Philippines','Vietnam','Malaysia'],
        ARRAY['DKI Jakarta','West Java','Central Java','East Kalimantan','North Sumatra'],
        ARRAY['Mangrove Restoration','Blue Carbon','Drone Survey','Carbon Certification'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Drone Survey','Satellite Monitoring'],
        ARRAY['Mangroves','Seagrass','Blue Carbon','Peatlands'],
        '[{"name":"Government Registered"},{"name":"Blue Carbon Certified"},{"name":"ISO 14001"},{"name":"REDD+ Certified"}]',
        67, 9, 15, 6, 2, 12, 'limited',
        '[{"project_name":"Mahakam Delta Restoration","status":"approved","date":"2026-07-05"},{"project_name":"Batangas Mangrove Park","status":"approved","date":"2026-05-22"},{"project_name":"Ca Mau Mangrove Reserve","status":"approved","date":"2026-04-10"}]'),

      ('Global Blue Carbon Network', 'KEN/GOV/2021/GBN-5567',
        'Global Blue Carbon Network is an internationally recognized verification body focused on African and Indian Ocean coastal ecosystems.',
        'Building trust in blue carbon markets through community-centered verification and transparent reporting.',
        2021, 'Nairobi, Kenya',
        ARRAY['Coast Province','Nyanza','Western Kenya'],
        ARRAY['Kenya','Tanzania','Mozambique','Madagascar','Seychelles'],
        ARRAY['Mombasa','Kilifi','Lamu','Kwale','Tana River'],
        ARRAY['Blue Carbon','Wetlands','Forest Restoration','Biodiversity','Community Engagement'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Biodiversity Assessment','Community Impact Assessment'],
        ARRAY['Mangroves','Wetlands','Blue Carbon','Coastal Forests'],
        '[{"name":"Government Registered"},{"name":"Blue Carbon Certified"},{"name":"Gold Standard"}]',
        43, 4, 25, 5, 2, 18, 'accepting',
        '[{"project_name":"Mikoko Pamoja Extension","status":"approved","date":"2026-06-10"},{"project_name":"Gazi Bay Blue Carbon","status":"approved","date":"2026-04-25"},{"project_name":"Rufiji Delta Restoration","status":"approved","date":"2026-02-18"}]'),

      ('Wetlands Verification Corp', 'BRA/GOV/2020/WVC-8834',
        'Wetlands Verification Corp is South America''s premier verification body for wetland and mangrove ecosystems.',
        'Ensuring the highest standards of verification for wetland carbon projects across Latin America.',
        2020, 'Sao Paulo, Brazil',
        ARRAY['Sao Paulo','Bahia','Maranhao','Para','Amapa'],
        ARRAY['Brazil','Colombia','Ecuador','Argentina'],
        ARRAY['Sao Paulo','Bahia','Maranhao','Para','Amapa','Ceara','Pernambuco'],
        ARRAY['Wetlands','Mangrove Restoration','Forest Restoration','Blue Carbon','River Delta Systems'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Satellite Monitoring','Biodiversity Assessment'],
        ARRAY['Wetlands','Mangroves','River Deltas','Floodplain Forests'],
        '[{"name":"Government Registered"},{"name":"Blue Carbon Certified"},{"name":"ISO 14001"},{"name":"Verra VCS Certified"}]',
        85, 14, 20, 6, 5, 15, 'limited',
        '[{"project_name":"Amazon Delta Mangroves","status":"approved","date":"2026-07-08"},{"project_name":"Cananeia Estuary Project","status":"approved","date":"2026-05-30"},{"project_name":"Guajira Coastal Wetlands","status":"approved","date":"2026-03-22"}]'),

      ('Nordic Carbon Verification', 'NOR/GOV/2022/NCV-1123',
        'Nordic Carbon Verification brings Scandinavian precision to global carbon certification.',
        'Applying Nordic standards of excellence to ensure credible carbon verification worldwide.',
        2022, 'Oslo, Norway',
        ARRAY['Nordic Region','Northern Europe','Arctic Coastlines'],
        ARRAY['Norway','Sweden','Finland','Iceland','Denmark'],
        ARRAY['Oslo','Bergen','Tromso','Gothenburg','Helsinki'],
        ARRAY['Seagrass','Blue Carbon','Cold-Water Ecosystems','Arctic Coastal'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Seagrass Mapping'],
        ARRAY['Seagrass Meadows','Kelp Forests','Arctic Coastal Wetlands'],
        '[{"name":"Government Registered"},{"name":"ISO 14001"},{"name":"EU ETS Certified"}]',
        31, 5, 12, 4, 2, 10, 'accepting',
        '[{"project_name":"Oslofjord Seagrass Recovery","status":"approved","date":"2026-06-20"},{"project_name":"Skagerrak Coastal Restoration","status":"approved","date":"2026-04-05"},{"project_name":"Bothnia Bay Wetlands","status":"approved","date":"2026-01-15"}]'),

      ('Asia Pacific Carbon Council', 'SGP/GOV/2019/APCC-6678',
        'Asia Pacific Carbon Council is the region''s most comprehensive verification body, covering 12 countries.',
        'Unifying verification standards across the Asia-Pacific to build trust in carbon markets.',
        2019, 'Singapore',
        ARRAY['Southeast Asia','South Asia','East Asia','Pacific Islands'],
        ARRAY['Singapore','India','Indonesia','Philippines','Thailand','Vietnam','Australia','Fiji'],
        ARRAY['Singapore','Maharashtra','Java','Luzon','Queensland'],
        ARRAY['Mangrove Restoration','Blue Carbon','Wetlands','Seagrass','Forest Restoration','Biodiversity'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Satellite Monitoring','Drone Survey','Community Impact Assessment'],
        ARRAY['Mangroves','Wetlands','Seagrass','Coastal Forests','Coral Reefs'],
        '[{"name":"Government Registered"},{"name":"Blue Carbon Certified"},{"name":"ISO 14001"},{"name":"Gold Standard"},{"name":"Verra VCS Certified"}]',
        176, 18, 16, 7, 6, 13, 'limited',
        '[{"project_name":"Sundarbans Cross-Border Initiative","status":"approved","date":"2026-07-12"},{"project_name":"Tonle Sap Wetland Restoration","status":"approved","date":"2026-06-01"},{"project_name":"Great Barrier Reef Seagrass","status":"approved","date":"2026-04-28"}]'),

      ('West Africa Blue Carbon Initiative', 'NGA/GOV/2023/WABC-3345',
        'West Africa Blue Carbon Initiative focuses on verifying mangrove and wetland restoration projects across the West African coastline.',
        'Empowering West African coastal communities through accessible and transparent carbon verification.',
        2023, 'Lagos, Nigeria',
        ARRAY['Lagos','Niger Delta','Cross River','Akwa Ibom'],
        ARRAY['Nigeria','Ghana','Senegal','Cameroon','Gambia'],
        ARRAY['Lagos','Rivers','Cross River','Akwa Ibom','Delta'],
        ARRAY['Mangrove Restoration','Community Engagement','Wetlands','Blue Carbon'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Community Impact Assessment'],
        ARRAY['Mangroves','Wetlands','Coastal Lagoons'],
        '[{"name":"Government Registered"},{"name":"Blue Carbon Certified"}]',
        19, 3, 28, 3, 1, 21, 'accepting',
        '[{"project_name":"Niger Delta Mangrove Phase I","status":"approved","date":"2026-05-18"},{"project_name":"Keta Lagoon Restoration","status":"approved","date":"2026-03-05"},{"project_name":"Senegal River Delta","status":"approved","date":"2026-01-22"}]'),

      ('Mediterranean Blue Carbon Alliance', 'ESP/GOV/2021/MBCA-9012',
        'Mediterranean Blue Carbon Alliance operates across the Mediterranean basin, providing specialized verification for seagrass meadows, coastal lagoons, and salt marsh restoration projects.',
        'Protecting Mediterranean blue carbon ecosystems through rigorous, cross-border verification and scientific collaboration.',
        2021, 'Barcelona, Spain',
        ARRAY['Catalonia','Andalusia','Provence','Sicily','Attica'],
        ARRAY['Spain','France','Italy','Greece','Croatia','Tunisia','Morocco','Turkey','Montenegro'],
        ARRAY['Catalonia','Andalusia','Sicily','Attica'],
        ARRAY['Seagrass','Salt Marsh','Coastal Restoration','Blue Carbon','Marine Biodiversity'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Seagrass Mapping','Underwater Survey'],
        ARRAY['Seagrass Meadows','Salt Marshes','Coastal Lagoons','Maquis Shrubland'],
        '[{"name":"Government Registered"},{"name":"Blue Carbon Certified"},{"name":"ISO 14001"},{"name":"EU LIFE Programme Certified"}]',
        54, 6, 19, 5, 3, 14, 'accepting',
        '[{"project_name":"Posidonia Oceanica Recovery - Balearics","status":"approved","date":"2026-07-02"},{"project_name":"Venetian Lagoon Salt Marsh Restoration","status":"approved","date":"2026-05-15"},{"project_name":"Gulf of Tunis Seagrass Revival","status":"approved","date":"2026-03-28"}]'),

      ('Oceania Carbon Standards', 'AUS/GOV/2020/OCS-4456',
        'Oceania Carbon Standards is Australia and Pacific Islands'' leading independent verification body for blue carbon and coastal ecosystem projects.',
        'Setting the gold standard for carbon verification across Oceania through scientific rigour and community partnership.',
        2020, 'Sydney, Australia',
        ARRAY['New South Wales','Queensland','Western Australia','Pacific Islands'],
        ARRAY['Australia','Papua New Guinea','Fiji','Solomon Islands','Vanuatu'],
        ARRAY['New South Wales','Queensland','Western Australia','Northern Territory'],
        ARRAY['Mangrove Restoration','Tidal Wetlands','Blue Carbon','Coral Reef Monitoring','Seagrass'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Satellite Monitoring','Drone Survey','Aerial Assessment'],
        ARRAY['Mangroves','Tidal Wetlands','Seagrass','Coral Reefs','Coastal Dunes'],
        '[{"name":"Government Registered"},{"name":"Blue Carbon Certified"},{"name":"ISO 14001"},{"name":"Gold Standard"},{"name":"CDM Certified"}]',
        72, 8, 14, 6, 4, 11, 'accepting',
        '[{"project_name":"Moreton Bay Mangrove Expansion","status":"approved","date":"2026-07-10"},{"project_name":"Torres Strait Tidal Restoration","status":"approved","date":"2026-05-25"},{"project_name":"Suva Harbor Seagrass Initiative","status":"approved","date":"2026-04-08"}]'),

      ('Caribbean Basin Blue Carbon Institute', 'JAM/GOV/2022/CBCI-7789',
        'Caribbean Basin Blue Carbon Institute provides verification services across the Caribbean, with particular expertise in hurricane-resilient mangrove restoration.',
        'Strengthening climate resilience in Small Island Developing States through trustworthy blue carbon verification.',
        2022, 'Kingston, Jamaica',
        ARRAY['Jamaica','Bahamas','Trinidad','Belize','Honduras'],
        ARRAY['Jamaica','Bahamas','Trinidad and Tobago','Belize','Honduras','Cuba','Dominican Republic','Barbados'],
        ARRAY['Kingston','New Providence','San Fernando','Stann Creek'],
        ARRAY['Mangrove Restoration','Coral Reef Carbon','Hurricane Resilience','Blue Carbon','Coastal Adaptation'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Underwater Survey','Community Impact Assessment'],
        ARRAY['Mangroves','Coral Reefs','Seagrass Beds','Coastal Wetlands'],
        '[{"name":"Government Registered"},{"name":"Blue Carbon Certified"},{"name":"Gold Standard"}]',
        28, 5, 21, 4, 2, 16, 'limited',
        '[{"project_name":"Belize Barrier Reef Mangrove Shield","status":"approved","date":"2026-06-22"},{"project_name":"Portland Parish Coastal Restoration","status":"approved","date":"2026-04-30"},{"project_name":"San Salvador Mangrove Recovery","status":"approved","date":"2026-02-15"}]'),

      ('Gulf Blue Carbon Initiative', 'ARE/GOV/2023/GBCI-2234',
        'Gulf Blue Carbon Initiative is the first dedicated verification body for arid coastal ecosystems in the Arabian Gulf.',
        'Pioneering verification standards for arid-zone blue carbon ecosystems in the Middle East and North Africa.',
        2023, 'Abu Dhabi, UAE',
        ARRAY['Abu Dhabi','Dubai','Ras Al Khaimah','Doha','Muscat'],
        ARRAY['UAE','Saudi Arabia','Qatar','Oman','Bahrain'],
        ARRAY['Abu Dhabi','Dubai','Al Khor','Muscat','Muharraq'],
        ARRAY['Arid Coastal Restoration','Mangrove Restoration','Sabkha Ecosystems','Blue Carbon','Desalination Impact Assessment'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Satellite Monitoring','Environmental Impact Assessment'],
        ARRAY['Mangroves','Sabkha','Seagrass','Coral Reefs'],
        '[{"name":"Government Registered"},{"name":"Blue Carbon Certified"},{"name":"ISO 14001"}]',
        15, 3, 16, 3, 2, 12, 'accepting',
        '[{"project_name":"Abu Dhabi Mangrove Plantation Phase II","status":"approved","date":"2026-07-06"},{"project_name":"Al Wathba Wetland Reserve Expansion","status":"approved","date":"2026-05-18"},{"project_name":"Sharjah Coast Sabkha Restoration","status":"approved","date":"2026-03-10"}]'),

      ('North America Coastal Trust', 'USA/GOV/2021/NACT-5567',
        'North America Coastal Trust is a federally recognized verification body covering the United States and Canadian coastlines.',
        'Advancing coastal carbon sequestration through the highest standards of verification and transparent governance.',
        2021, 'Charleston, South Carolina, USA',
        ARRAY['Southeast US','Gulf Coast','Pacific Northwest','Atlantic Canada','Maritimes'],
        ARRAY['United States','Canada'],
        ARRAY['South Carolina','Florida','Louisiana','Oregon','British Columbia','Nova Scotia'],
        ARRAY['Salt Marsh','Mangrove Restoration','Eelgrass','Blue Carbon','Coastal Resilience'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Satellite Monitoring','LiDAR Survey','Drone Survey'],
        ARRAY['Salt Marshes','Mangroves','Eelgrass','Kelp Forests','Coastal Wetlands'],
        '[{"name":"Government Registered"},{"name":"Blue Carbon Certified"},{"name":"ISO 14001"},{"name":"Verra VCS Certified"},{"name":"Climate Action Reserve"}]',
        61, 9, 17, 5, 3, 13, 'accepting',
        '[{"project_name":"Charleston Harbor Salt Marsh Revival","status":"approved","date":"2026-07-09"},{"project_name":"Florida Keys Mangrove Restoration","status":"approved","date":"2026-06-03"},{"project_name":"Puget Sound Eelgrass Recovery","status":"approved","date":"2026-04-22"}]'),

      ('South Asia Coastal Verification Network', 'LKA/GOV/2022/SACV-3345',
        'South Asia Coastal Verification Network provides affordable, community-driven verification for small and medium-scale blue carbon projects.',
        'Democratizing blue carbon verification by making it affordable, accessible, and community-centered.',
        2022, 'Colombo, Sri Lanka',
        ARRAY['Western Province','Southern Province','Northern Province','Tamil Nadu','Kerala'],
        ARRAY['Sri Lanka','India','Maldives','Bangladesh','Nepal'],
        ARRAY['Western Province','Southern Province','Tamil Nadu','Kerala','Dhaka','Chittagong'],
        ARRAY['Community-Led Verification','Mangrove Restoration','Coastal Wetlands','Blue Carbon','Small-Scale Projects'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Community Impact Assessment','Capacity Building'],
        ARRAY['Mangroves','Coastal Wetlands','Lagoons','River Deltas'],
        '[{"name":"Government Registered"},{"name":"Blue Carbon Certified"}]',
        37, 6, 24, 4, 2, 18, 'accepting',
        '[{"project_name":"Negombo Lagoon Community Restoration","status":"approved","date":"2026-06-18"},{"project_name":"Rameswaram Island Mangroves","status":"approved","date":"2026-05-01"},{"project_name":"Sundarbans Community Guardian Project","status":"approved","date":"2026-03-12"}]'),

      ('Pan-African Wetlands Verification Hub', 'ZAF/GOV/2020/PAWV-6678',
        'Pan-African Wetlands Verification Hub is the continent''s largest verification network, spanning 14 countries from Senegal to Mozambique.',
        'Building a continent-wide verification infrastructure that supports Africa''s blue carbon leadership.',
        2020, 'Cape Town, South Africa',
        ARRAY['Western Cape','KwaZulu-Natal','Mozambique Coast','West African Coast','East African Coast'],
        ARRAY['South Africa','Mozambique','Tanzania','Kenya','Senegal','Nigeria','Ghana','Madagascar','Cameroon','Guinea-Bissau','Equatorial Guinea','Gabon','Congo','Angola'],
        ARRAY['Western Cape','KwaZulu-Natal','Maputo','Dakar','Lagos','Accra'],
        ARRAY['Wetlands','Mangrove Restoration','Forest Restoration','Blue Carbon','Biodiversity','Community Engagement'],
        ARRAY['Land Verification','Field Audit','Carbon Certification','Biodiversity Assessment','Satellite Monitoring','Community Impact Assessment'],
        ARRAY['Wetlands','Mangroves','River Deltas','Coastal Forests','Floodplain Wetlands'],
        '[{"name":"Government Registered"},{"name":"Blue Carbon Certified"},{"name":"Gold Standard"},{"name":"Verra VCS Certified"},{"name":"ISO 14001"}]',
        104, 12, 23, 6, 5, 17, 'limited',
        '[{"project_name":"iSimangaliso Wetland Park Expansion","status":"approved","date":"2026-07-11"},{"project_name":"Senegal Saloum Delta Restoration","status":"approved","date":"2026-06-08"},{"project_name":"Mozambique Zambezi Delta Revival","status":"approved","date":"2026-04-25"}]')
    ) AS t(name, reg_num, desc_text, mission_text, founded_yr, hq, op_regions, countries, states, exp, svc, ecosystems, certs_json, proj_cert, active_apps, avg_days, yrs_op, audit_teams, est_review, avail, recent_json)
  LOOP
    INSERT INTO verification_agencies (
      name, registration_number, description, mission,
      founded_year, headquarters, operating_regions, countries_served, states_covered,
      expertise, services, supported_ecosystems, certifications,
      projects_certified, active_applications, avg_verification_days,
      years_of_operation, available_audit_teams, estimated_review_days,
      availability, verification_status, accepts_new_applications, paused,
      recent_projects
    ) VALUES (
      agency.name,
      agency.reg_num,
      agency.desc_text,
      agency.mission_text,
      agency.founded_yr,
      agency.hq,
      agency.op_regions,
      agency.countries,
      agency.states,
      agency.exp,
      agency.svc,
      agency.ecosystems,
      agency.certs_json::jsonb,
      agency.proj_cert,
      agency.active_apps,
      agency.avg_days,
      agency.yrs_op,
      agency.audit_teams,
      agency.est_review,
      agency.avail,
      'active',
      true,
      false,
      agency.recent_json::jsonb
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

COMMIT;
