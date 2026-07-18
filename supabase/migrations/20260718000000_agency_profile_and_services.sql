-- ============================================================
-- MIGRATION: Agency Profile & Service Catalog
-- Add editable profile fields + agency_services table
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ADD MISSING COLUMNS TO verification_agencies
-- ============================================================

ALTER TABLE verification_agencies
  ADD COLUMN IF NOT EXISTS cover_image text,
  ADD COLUMN IF NOT EXISTS vision text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS districts text[] DEFAULT '{}';

-- ============================================================
-- 2. CREATE agency_services TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS agency_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES verification_agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'verification'
    CHECK (category IN (
      'verification', 'audit', 'consulting', 'monitoring',
      'mapping', 'training', 'certification', 'assessment', 'other'
    )),
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  price_unit text NOT NULL DEFAULT 'per_project'
    CHECK (price_unit IN (
      'per_project', 'per_hectare', 'per_day', 'per_hour',
      'per_audit', 'fixed', 'custom'
    )),
  estimated_duration_days integer,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_as_agency ON agency_services(agency_id);
CREATE INDEX IF NOT EXISTS idx_as_category ON agency_services(category);
CREATE INDEX IF NOT EXISTS idx_as_active ON agency_services(is_active);
ALTER TABLE agency_services ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS POLICIES FOR agency_services
-- ============================================================

-- Anyone can read active services (public directory)
CREATE POLICY as_select_public ON agency_services FOR SELECT TO authenticated
  USING (true);

-- Agency owners can manage their own services
CREATE POLICY as_insert_own ON agency_services FOR INSERT TO authenticated
  WITH CHECK (
    agency_id IN (SELECT id FROM verification_agencies WHERE profile_id = auth.uid())
  );

CREATE POLICY as_update_own ON agency_services FOR UPDATE TO authenticated
  USING (
    agency_id IN (SELECT id FROM verification_agencies WHERE profile_id = auth.uid())
  )
  WITH CHECK (
    agency_id IN (SELECT id FROM verification_agencies WHERE profile_id = auth.uid())
  );

CREATE POLICY as_delete_own ON agency_services FOR DELETE TO authenticated
  USING (
    agency_id IN (SELECT id FROM verification_agencies WHERE profile_id = auth.uid())
  );

-- ============================================================
-- 4. UPDATED_AT TRIGGER FOR agency_services
-- ============================================================

DROP TRIGGER IF EXISTS as_updated_at ON agency_services;
CREATE TRIGGER as_updated_at
  BEFORE UPDATE ON agency_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 5. SEED DEFAULT SERVICES FOR EXISTING AGENCIES
-- ============================================================

DO $$
DECLARE
  agency_rec RECORD;
  svc text;
  base_price numeric;
  currency text;
  order_idx integer;
BEGIN
  FOR agency_rec IN SELECT id, name FROM verification_agencies WHERE NOT EXISTS (
    SELECT 1 FROM agency_services WHERE agency_id = verification_agencies.id
  )
  LOOP
    order_idx := 0;
    -- Determine currency based on headquarters
    IF agency_rec.name LIKE '%India%' OR agency_rec.name LIKE '%Sri Lanka%' OR agency_rec.name LIKE '%Bangladesh%' OR agency_rec.name LIKE '%Pacific Mangrove%' OR agency_rec.name LIKE '%South Asia%' THEN
      currency := 'USD';
    ELSIF agency_rec.name LIKE '%Africa%' OR agency_rec.name LIKE '%Kenya%' OR agency_rec.name LIKE '%Pan-African%' THEN
      currency := 'USD';
    ELSIF agency_rec.name LIKE '%Brazil%' THEN
      currency := 'USD';
    ELSE
      currency := 'USD';
    END IF;

    FOREACH svc IN ARRAY ARRAY['Land Verification', 'Field Audit', 'Carbon Certification', 'Biodiversity Assessment', 'Satellite Monitoring', 'Drone Survey', 'Community Impact Assessment']
    LOOP
      order_idx := order_idx + 1;
      CASE svc
        WHEN 'Land Verification' THEN base_price := 2500;
        WHEN 'Field Audit' THEN base_price := 4000;
        WHEN 'Carbon Certification' THEN base_price := 8000;
        WHEN 'Biodiversity Assessment' THEN base_price := 3500;
        WHEN 'Satellite Monitoring' THEN base_price := 1800;
        WHEN 'Drone Survey' THEN base_price := 3000;
        WHEN 'Community Impact Assessment' THEN base_price := 2200;
        ELSE base_price := 2000;
      END CASE;

      INSERT INTO agency_services (agency_id, name, category, price, currency, price_unit, is_active, display_order)
      SELECT
        agency_rec.id,
        svc,
        CASE svc
          WHEN 'Land Verification' THEN 'verification'
          WHEN 'Field Audit' THEN 'audit'
          WHEN 'Carbon Certification' THEN 'certification'
          WHEN 'Biodiversity Assessment' THEN 'assessment'
          WHEN 'Satellite Monitoring' THEN 'monitoring'
          WHEN 'Drone Survey' THEN 'mapping'
          WHEN 'Community Impact Assessment' THEN 'assessment'
          ELSE 'other'
        END,
        base_price,
        currency,
        'per_project',
        true,
        order_idx
      WHERE NOT EXISTS (
        SELECT 1 FROM agency_services WHERE agency_id = agency_rec.id AND name = svc
      );
    END LOOP;
  END LOOP;
END $$;

COMMIT;
