-- ============================================================
-- Critical Fixes: project_support schema + activity events
-- ============================================================

-- 1. Fix project_support status CHECK constraint
--    Old: 'pledged' | 'completed' | 'refunded'
--    New: 'pending' | 'active' | 'completed' | 'terminated'
ALTER TABLE project_support DROP CONSTRAINT IF EXISTS project_support_status_check;
ALTER TABLE project_support ADD CONSTRAINT project_support_status_check
  CHECK (status IN ('pending', 'active', 'completed', 'terminated'));

-- 2. Backfill existing status values
UPDATE project_support SET status = 'pending' WHERE status = 'pledged';
UPDATE project_support SET status = 'terminated' WHERE status = 'refunded';

-- 3. Fix project_activity event types (old funding terminology)
UPDATE project_activity SET
  event_type = 'support_requested',
  title = 'Support Requested'
WHERE event_type = 'funding_pledged';

-- 4. Add project_partnerships owner_id, started_at, ended_at if not present
-- (These should already exist from migration 19, but guard for safety)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_partnerships' AND column_name = 'owner_id') THEN
    ALTER TABLE project_partnerships ADD COLUMN owner_id uuid REFERENCES profiles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_partnerships' AND column_name = 'started_at') THEN
    ALTER TABLE project_partnerships ADD COLUMN started_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_partnerships' AND column_name = 'ended_at') THEN
    ALTER TABLE project_partnerships ADD COLUMN ended_at timestamptz;
  END IF;
END $$;

-- 5. Ensure projects table does NOT have verifier_id (should already be dropped)
ALTER TABLE projects DROP COLUMN IF EXISTS verifier_id;
