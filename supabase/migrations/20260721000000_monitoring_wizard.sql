-- ============================================================
-- MIGRATION: Expand project_monitoring_reports for 10-step Wizard
-- ============================================================

BEGIN;

-- Step 1: Visit Information
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS visit_date date;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS visit_time time;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS lead_inspector text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS inspection_team text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS weather text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS temperature text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS gps_lat numeric;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS gps_lng numeric;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS gps_accuracy numeric;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS gps_timestamp timestamptz;

-- Step 4: Forest Assessment
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS current_tree_count integer;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS dead_trees integer;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS missing_trees integer;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS dominant_species text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS species_count integer;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS average_height numeric;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS average_dbh numeric;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS canopy_coverage numeric;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS tree_health text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS growth_stage text;

-- Step 5: Carbon Assessment
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS soil_carbon numeric;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS carbon_gain numeric;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS carbon_loss numeric;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS methodology text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS sampling_notes text;

-- Step 6: Biodiversity
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS species_observed text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS bird_count integer;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS wildlife text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS pollinators text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS insects text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS invasive_species text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS habitat_quality text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS biodiversity_index numeric;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS ecosystem_health text;

-- Step 7: Site Assessment
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS illegal_activities text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS fire_damage text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS flood_damage text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS soil_erosion text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS water_availability text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS waste text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS encroachment text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS site_condition text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS risk_level text;

-- Step 8/9: AI Comparison Differences & Summary
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS monitoring_score integer;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS risk_score integer;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS recommendation text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS auditor_notes text;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS partner_notes text;

-- Persistent Deltas for Step 8 (AI Comparison)
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS delta_tree_count integer;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS delta_carbon_estimate numeric;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS delta_biomass numeric;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS delta_canopy_coverage numeric;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS delta_health_score integer;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS auto_growth_rate numeric;
ALTER TABLE project_monitoring_reports ADD COLUMN IF NOT EXISTS auto_area_change numeric;

COMMIT;
