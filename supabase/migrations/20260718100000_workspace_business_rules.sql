-- ============================================================
-- Migration: Workspace Business Rules
-- Adds document/evidence verification tracking, decision metadata,
-- and snapshot sync support to voc_agency_requests
-- ============================================================

-- Add per-document verification tracking (JSONB array of {docId, status, remarks, verified_by, verified_at})
ALTER TABLE voc_agency_requests
ADD COLUMN IF NOT EXISTS document_verifications jsonb DEFAULT '[]'::jsonb;

-- Add per-evidence verification tracking (JSONB array of {itemId, status, remarks, verified_by, verified_at})
ALTER TABLE voc_agency_requests
ADD COLUMN IF NOT EXISTS evidence_verifications jsonb DEFAULT '[]'::jsonb;

-- Add decision metadata
ALTER TABLE voc_agency_requests
ADD COLUMN IF NOT EXISTS decision_notes text,
ADD COLUMN IF NOT EXISTS decision_verifier_name text,
ADD COLUMN IF NOT EXISTS digital_signature text,
ADD COLUMN IF NOT EXISTS blockchain_hash text;

-- Add verified metrics (JSONB snapshot of verified values synced to project on approve)
ALTER TABLE voc_agency_requests
ADD COLUMN IF NOT EXISTS verified_metrics jsonb DEFAULT '{}'::jsonb;

-- Comments for documentation
COMMENT ON COLUMN voc_agency_requests.document_verifications IS 'Per-document verification status: [{docId, status: pending|verified|needs_clarification|rejected, remarks, verified_by, verified_at}]';
COMMENT ON COLUMN voc_agency_requests.evidence_verifications IS 'Per-evidence verification status: [{itemId, status: pending|approved|needs_new_upload|rejected, remarks, verified_by, verified_at}]';
COMMENT ON COLUMN voc_agency_requests.decision_notes IS 'Verifier notes when making approval/rejection decision';
COMMENT ON COLUMN voc_agency_requests.decision_verifier_name IS 'Name of verifier who made the decision';
COMMENT ON COLUMN voc_agency_requests.digital_signature IS 'Digital signature hash of the decision';
COMMENT ON COLUMN voc_agency_requests.blockchain_hash IS 'Blockchain hash for immutability verification';
COMMENT ON COLUMN voc_agency_requests.verified_metrics IS 'Verified environmental metrics synced to project on approval';

-- Add extended audit data to voc_audit_reports
ALTER TABLE voc_audit_reports
ADD COLUMN IF NOT EXISTS extended_audit_data jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN voc_audit_reports.extended_audit_data IS 'Extended audit form data: land verification, carbon assessment, biodiversity, site inspection, observations, recommendations, risks, corrective actions';
