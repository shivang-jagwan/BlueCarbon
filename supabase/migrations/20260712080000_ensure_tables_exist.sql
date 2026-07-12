-- ============================================================
-- IDEMPOTENT FIX: Ensure project_support + project_partnerships
-- exist with all required columns, indexes, and RLS policies.
-- Safe to re-run; uses IF NOT EXISTS / DO blocks throughout.
-- ============================================================

-- ============================================================
-- 0. Handle funding_contributions → project_support rename
--    (if the rename migration failed, do it here)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'funding_contributions'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'project_support'
  ) THEN
    ALTER TABLE funding_contributions RENAME TO project_support;
    -- Rename indexes if they still have old names
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_funding_project') THEN
      ALTER INDEX idx_funding_project RENAME TO idx_project_support_project;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_funding_partner') THEN
      ALTER INDEX idx_funding_partner RENAME TO idx_project_support_partner;
    END IF;
  END IF;
END $$;

-- ============================================================
-- 1. project_support (create from scratch if still missing)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'project_support'
  ) THEN
    CREATE TABLE project_support (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      partner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      amount_usd numeric NOT NULL DEFAULT 0,
      carbon_credits_tonnes numeric,
      status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'completed', 'terminated')),
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX idx_project_support_project ON project_support(project_id);
    CREATE INDEX idx_project_support_partner ON project_support(partner_id);

    ALTER TABLE project_support ENABLE ROW LEVEL SECURITY;

    CREATE POLICY support_select_partner ON project_support
      FOR SELECT TO authenticated USING (auth.uid() = partner_id);

    CREATE POLICY support_insert_partner ON project_support
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = partner_id);

    CREATE POLICY support_update_partner ON project_support
      FOR UPDATE TO authenticated
      USING (auth.uid() = partner_id)
      WITH CHECK (auth.uid() = partner_id);

    CREATE POLICY support_select_owner ON project_support
      FOR SELECT TO authenticated USING (
        EXISTS (
          SELECT 1 FROM projects
          WHERE projects.id = project_support.project_id
            AND projects.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================
-- 2. project_partnerships (create from scratch if missing)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'project_partnerships'
  ) THEN
    CREATE TABLE project_partnerships (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      company_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      verifier_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'pending_owner'
        CHECK (status IN ('pending_owner', 'pending_verifier', 'active', 'rejected', 'terminated')),
      service_type text NOT NULL
        CHECK (service_type IN ('monthly', 'quarterly', 'annual', 'lifecycle')),
      start_date date,
      budget_usd numeric,
      message text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      started_at timestamptz,
      ended_at timestamptz
    );

    CREATE INDEX idx_project_partnerships_project ON project_partnerships(project_id);
    CREATE INDEX idx_project_partnerships_company ON project_partnerships(company_id);
    CREATE INDEX idx_project_partnerships_verifier ON project_partnerships(verifier_id);

    ALTER TABLE project_partnerships ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "partnerships_select" ON project_partnerships FOR SELECT
      TO authenticated USING (
        company_id = auth.uid() OR
        verifier_id = auth.uid() OR
        owner_id = auth.uid()
      );

    CREATE POLICY "partnerships_insert" ON project_partnerships FOR INSERT
      TO authenticated WITH CHECK (company_id = auth.uid());

    CREATE POLICY "partnerships_update" ON project_partnerships FOR UPDATE
      TO authenticated USING (
        verifier_id = auth.uid() OR owner_id = auth.uid()
      ) WITH CHECK (
        verifier_id = auth.uid() OR owner_id = auth.uid()
      );
  END IF;
END $$;

-- ============================================================
-- 3. Ensure project_partnerships has all columns
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_partnerships' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE project_partnerships
      ADD COLUMN owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_partnerships' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE project_partnerships
      ADD COLUMN started_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_partnerships' AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE project_partnerships
      ADD COLUMN ended_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_partnerships' AND column_name = 'budget_usd'
  ) THEN
    ALTER TABLE project_partnerships
      ADD COLUMN budget_usd numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_partnerships' AND column_name = 'message'
  ) THEN
    ALTER TABLE project_partnerships
      ADD COLUMN message text;
  END IF;
END $$;

-- ============================================================
-- 4. Backfill owner_id on project_partnerships
-- ============================================================
UPDATE project_partnerships pp
SET owner_id = p.owner_id
FROM projects p
WHERE pp.project_id = p.id AND pp.owner_id IS NULL;

-- Make owner_id NOT NULL after backfill
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_partnerships'
      AND column_name = 'owner_id'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE project_partnerships
      ALTER COLUMN owner_id SET NOT NULL;
  END IF;
END $$;

-- ============================================================
-- 5. Ensure indexes exist
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_project_partnerships_project') THEN
    CREATE INDEX idx_project_partnerships_project ON project_partnerships(project_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_project_partnerships_company') THEN
    CREATE INDEX idx_project_partnerships_company ON project_partnerships(company_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_project_partnerships_verifier') THEN
    CREATE INDEX idx_project_partnerships_verifier ON project_partnerships(verifier_id);
  END IF;
END $$;

-- ============================================================
-- 6. Ensure RLS policies exist (idempotent)
-- ============================================================
DO $$
BEGIN
  -- project_partnerships policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_partnerships' AND policyname = 'partnerships_select'
  ) THEN
    CREATE POLICY "partnerships_select" ON project_partnerships FOR SELECT
      TO authenticated USING (
        company_id = auth.uid() OR verifier_id = auth.uid() OR owner_id = auth.uid()
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_partnerships' AND policyname = 'partnerships_insert'
  ) THEN
    CREATE POLICY "partnerships_insert" ON project_partnerships FOR INSERT
      TO authenticated WITH CHECK (company_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_partnerships' AND policyname = 'partnerships_update'
  ) THEN
    CREATE POLICY "partnerships_update" ON project_partnerships FOR UPDATE
      TO authenticated USING (
        verifier_id = auth.uid() OR owner_id = auth.uid()
      ) WITH CHECK (
        verifier_id = auth.uid() OR owner_id = auth.uid()
      );
  END IF;

  -- project_support policies (may have been dropped if table was recreated)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_support' AND policyname = 'support_select_partner'
  ) THEN
    CREATE POLICY support_select_partner ON project_support
      FOR SELECT TO authenticated USING (auth.uid() = partner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_support' AND policyname = 'support_insert_partner'
  ) THEN
    CREATE POLICY support_insert_partner ON project_support
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = partner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_support' AND policyname = 'support_select_owner'
  ) THEN
    CREATE POLICY support_select_owner ON project_support
      FOR SELECT TO authenticated USING (
        EXISTS (
          SELECT 1 FROM projects
          WHERE projects.id = project_support.project_id
            AND projects.owner_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================
-- 7. Backfill project_support status values
-- ============================================================
UPDATE project_support SET status = 'pending' WHERE status NOT IN ('pending', 'active', 'completed', 'terminated');
