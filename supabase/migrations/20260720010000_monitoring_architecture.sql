-- ============================================================
-- MIGRATION: Monitoring Architecture Refactoring
-- ============================================================

BEGIN;

-- 1. Update voc_official_records record_type check constraint
ALTER TABLE voc_official_records DROP CONSTRAINT IF EXISTS voc_official_records_record_type_check;
ALTER TABLE voc_official_records ADD CONSTRAINT voc_official_records_record_type_check 
  CHECK (record_type IN (
    'carbon_passport', 'verification_certificate', 'audit_report',
    'ngo_approval', 'supporting_document', 'verification_history', 'monitoring_report'
  ));

-- 2. Ensure project_activity accepts monitoring events
-- (project_activity doesn't have a check constraint on event_type, so no migration needed for it)

COMMIT;
