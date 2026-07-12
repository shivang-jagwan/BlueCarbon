/*
# CarbonRush AI — Add verifier specific fields to profiles

## Overview
Adds `languages_spoken` and `average_response_time` to profiles to support
detailed verifier directory requirements without using placeholders.
*/

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN languages_spoken text[];
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN average_response_time text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
