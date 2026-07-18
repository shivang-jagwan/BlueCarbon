-- Migration: Fix verification workflow state management
-- After approval, project should never reset to "Submit for Verification"

-- 1. Add verified metric columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS verified_area_hectares numeric;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS verified_tree_count integer;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS verified_species_count integer;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS verified_biomass_carbon numeric;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS verified_soil_organic_carbon numeric;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS verified_biodiversity_index numeric;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS verified_ecosystem_health text;

-- 2. Add verification_status to voc_requests (parent request table)
ALTER TABLE voc_requests ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending';

-- 3. Fix existing approved projects: set status to 'verified'
UPDATE projects 
SET status = 'verified',
    verification_status = 'approved',
    updated_at = now()
WHERE id IN (
  SELECT DISTINCT v.project_id 
  FROM voc_requests v 
  JOIN voc_agency_requests a ON a.request_id = v.id 
  WHERE a.verification_status = 'approved'
)
AND status != 'verified';

-- 4. Fix existing voc_requests status to match agency decisions
UPDATE voc_requests 
SET verification_status = 'approved'
WHERE id IN (
  SELECT DISTINCT request_id 
  FROM voc_agency_requests 
  WHERE verification_status = 'approved'
)
AND verification_status != 'approved';
