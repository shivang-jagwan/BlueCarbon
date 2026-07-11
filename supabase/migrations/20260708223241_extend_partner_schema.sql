/*
# CarbonRush AI — Sustainability Partner Schema

## Overview
Extends profiles with partner-specific fields for CSR/ESG organizations.

## Modified Tables
1. **profiles** — Added partner columns:
   - industry (text) — company industry sector
   - cin (text) — Corporate Identity Number
   - gst (text) — GST registration number
   - esg_goals (text) — organization ESG goals
   - csr_objectives (text) — CSR objectives
   - net_zero_target_year (integer) — net zero commitment year
   - sustainability_focus (text[]) — focus areas array
   - annual_csr_budget (numeric) — annual CSR budget in USD

## Notes
1. All columns nullable to avoid breaking existing rows.
2. Partners auto-approve (like owners) — no manual verification needed.
*/

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN industry text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN cin text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN gst text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN esg_goals text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN csr_objectives text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN net_zero_target_year integer;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN sustainability_focus text[];
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN annual_csr_budget numeric;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
