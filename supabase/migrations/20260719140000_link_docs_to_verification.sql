-- ============================================================
-- LINK DOCUMENTS TO VERIFICATION RECORDS
-- Add certificate_id, audit_report_id, carbon_passport_id
-- to voc_agency_requests so each verification is self-contained.
-- ============================================================

ALTER TABLE voc_agency_requests
  ADD COLUMN IF NOT EXISTS certificate_id uuid,
  ADD COLUMN IF NOT EXISTS audit_report_id uuid,
  ADD COLUMN IF NOT EXISTS carbon_passport_id uuid;
