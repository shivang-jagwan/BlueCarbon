-- Add missing columns to voc_passport_applications
-- These are referenced in TypeScript code (updateCarbonPassportStatus, mapPassportAppFromDb)
-- but were never added in the original migration.

ALTER TABLE voc_passport_applications
  ADD COLUMN IF NOT EXISTS qr_code_data text,
  ADD COLUMN IF NOT EXISTS digital_signature text;
