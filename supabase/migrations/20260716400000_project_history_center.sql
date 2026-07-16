-- ============================================================================
-- Migration: Project History Center (FIXED)
-- Adds missing columns, indexes, helper function, triggers, backfill.
-- No FK references to organizations table (doesn't exist).
-- ============================================================================

-- 1. Add missing columns to project_activity
--    (actor_name, actor_role, organization_name already exist from prior migration)

ALTER TABLE public.project_activity
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS related_document_id UUID,
ADD COLUMN IF NOT EXISTS related_report_id UUID,
ADD COLUMN IF NOT EXISTS related_verification_id UUID,
ADD COLUMN IF NOT EXISTS related_partnership_id UUID,
ADD COLUMN IF NOT EXISTS activity_status TEXT;

-- 2. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_project_activity_project_created
ON public.project_activity (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_activity_event_type
ON public.project_activity (project_id, event_type);

CREATE INDEX IF NOT EXISTS idx_project_activity_status
ON public.project_activity (project_id, activity_status);

-- 3. Helper function for logging activities
CREATE OR REPLACE FUNCTION public.log_project_activity(
  p_project_id UUID,
  p_event_type TEXT,
  p_title TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_related_document_id UUID DEFAULT NULL,
  p_related_report_id UUID DEFAULT NULL,
  p_related_verification_id UUID DEFAULT NULL,
  p_related_partnership_id UUID DEFAULT NULL,
  p_activity_status TEXT DEFAULT NULL,
  p_actor_name TEXT DEFAULT NULL,
  p_actor_role TEXT DEFAULT NULL,
  p_organization_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.project_activity (
    project_id, actor_id, event_type, title, description, metadata,
    organization_id, company_id, related_document_id, related_report_id,
    related_verification_id, related_partnership_id, activity_status,
    actor_name, actor_role, organization_name, created_at
  ) VALUES (
    p_project_id, p_actor_id, p_event_type, p_title, p_description, p_metadata,
    p_organization_id, p_company_id, p_related_document_id, p_related_report_id,
    p_related_verification_id, p_related_partnership_id, p_activity_status,
    p_actor_name, p_actor_role, p_organization_name, NOW()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Auto-logging triggers

-- Trigger: verification_service_requests status changes
CREATE OR REPLACE FUNCTION public.auto_log_verification_change()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_actor_id UUID;
  v_event_type TEXT;
  v_title TEXT;
  v_status TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_project_id := NEW.project_id;
    v_actor_id := NEW.verifier_id;
    v_status := NEW.status;

    CASE NEW.status
      WHEN 'completed' THEN
        v_event_type := CASE NEW.request_type
          WHEN 'land' THEN 'land_verification_approved'
          WHEN 'project' THEN 'project_verification_approved'
          ELSE 'verification_approved'
        END;
        v_title := CASE NEW.request_type
          WHEN 'land' THEN 'Land Verification Approved'
          WHEN 'project' THEN 'Project Verification Approved'
          ELSE 'Verification Approved'
        END;
      WHEN 'rejected' THEN
        v_event_type := CASE NEW.request_type
          WHEN 'land' THEN 'land_verification_rejected'
          WHEN 'project' THEN 'project_verification_rejected'
          ELSE 'verification_rejected'
        END;
        v_title := CASE NEW.request_type
          WHEN 'land' THEN 'Land Verification Rejected'
          WHEN 'project' THEN 'Project Verification Rejected'
          ELSE 'Verification Rejected'
        END;
      WHEN 'in_progress' THEN
        v_event_type := 'verification_started';
        v_title := 'Verification In Progress';
      ELSE
        v_event_type := 'verification_updated';
        v_title := 'Verification Status Updated';
    END CASE;

    PERFORM public.log_project_activity(
      v_project_id, v_event_type, v_title, v_actor_id,
      NULL,
      jsonb_build_object('request_type', NEW.request_type, 'status', v_status, 'priority', NEW.priority),
      NULL, NULL, NULL, NULL, NEW.id, NULL, v_status,
      NULL, NULL, NULL
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_log_verification ON public.verification_service_requests;
CREATE TRIGGER trg_auto_log_verification
  AFTER UPDATE ON public.verification_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_verification_change();

-- Trigger: monitoring_reports insert/status change
CREATE OR REPLACE FUNCTION public.auto_log_monitoring_change()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type TEXT;
  v_title TEXT;
  v_status TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'monitoring_report_submitted';
    v_title := 'Monitoring Report Submitted';
    v_status := NEW.status;

    PERFORM public.log_project_activity(
      NEW.project_id, v_event_type, v_title, NEW.created_by,
      'Monitoring report for period ' || NEW.period_month,
      jsonb_build_object('period_month', NEW.period_month, 'status', v_status, 'report_type', NEW.report_type),
      NULL, NULL, NULL, NEW.id, NULL, NULL, v_status,
      NEW.submitted_by_name, NULL, NEW.organization_name
    );
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      v_event_type := 'monitoring_report_approved';
      v_title := 'Monitoring Report Approved';
    ELSIF NEW.status = 'rejected' THEN
      v_event_type := 'monitoring_report_rejected';
      v_title := 'Monitoring Report Rejected';
    ELSE
      v_event_type := 'monitoring_report_updated';
      v_title := 'Monitoring Report Status Updated';
    END IF;
    v_status := NEW.status;

    PERFORM public.log_project_activity(
      NEW.project_id, v_event_type, v_title, NEW.created_by,
      NULL,
      jsonb_build_object('period_month', NEW.period_month, 'status', v_status),
      NULL, NULL, NULL, NEW.id, NULL, NULL, v_status,
      NULL, NULL, NEW.organization_name
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_log_monitoring ON public.monitoring_reports;
CREATE TRIGGER trg_auto_log_monitoring
  AFTER INSERT OR UPDATE ON public.monitoring_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_monitoring_change();

-- Trigger: project_partnerships status changes
CREATE OR REPLACE FUNCTION public.auto_log_partnership_change()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type TEXT;
  v_title TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'active' THEN
        v_event_type := 'monitoring_partnership_created';
        v_title := 'Monitoring Partnership Active';
      WHEN 'pending_owner' THEN
        v_event_type := 'company_supported_project';
        v_title := 'Sustainability Partner Joined';
      WHEN 'pending_verifier' THEN
        v_event_type := 'verification_organization_accepted';
        v_title := 'Verification Organization Accepted';
      WHEN 'rejected' THEN
        v_event_type := 'verification_organization_declined';
        v_title := 'Verification Organization Declined';
      WHEN 'terminated' THEN
        v_event_type := 'company_removed_support';
        v_title := 'Partnership Terminated';
      ELSE
        v_event_type := 'partnership_updated';
        v_title := 'Partnership Status Updated';
    END CASE;

    PERFORM public.log_project_activity(
      NEW.project_id, v_event_type, v_title, NEW.company_id,
      'Service type: ' || COALESCE(NEW.service_type, 'General'),
      jsonb_build_object('status', NEW.status, 'service_type', NEW.service_type),
      NEW.company_id, NULL, NULL, NULL, NULL, NEW.id, NEW.status,
      NULL, NULL, NULL
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_log_partnership ON public.project_partnerships;
CREATE TRIGGER trg_auto_log_partnership
  AFTER INSERT OR UPDATE ON public.project_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_partnership_change();

-- Trigger: carbon_passports insert/status change
CREATE OR REPLACE FUNCTION public.auto_log_passport_change()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type TEXT;
  v_title TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'carbon_passport_issued';
    v_title := 'Carbon Passport Issued';
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'revoked' THEN
      v_event_type := 'carbon_passport_revoked';
      v_title := 'Carbon Passport Revoked';
    ELSE
      v_event_type := 'carbon_passport_updated';
      v_title := 'Carbon Passport Updated';
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  PERFORM public.log_project_activity(
    NEW.project_id, v_event_type, v_title, NEW.issued_by,
    NULL,
    jsonb_build_object('status', NEW.status),
    NULL, NULL, NULL, NULL, NULL, NULL, NEW.status,
    NULL, NULL, NULL
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_log_passport ON public.carbon_passports;
CREATE TRIGGER trg_auto_log_passport
  AFTER INSERT OR UPDATE ON public.carbon_passports
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_log_passport_change();

-- 5. Backfill: create 'project_created' entries for existing projects
INSERT INTO public.project_activity (project_id, actor_id, event_type, title, description, metadata, created_at)
SELECT
  p.id,
  p.owner_id,
  'project_created',
  'Project Created',
  'Project "' || p.name || '" was created',
  jsonb_build_object('project_name', p.name, 'project_type', p.project_type),
  p.created_at
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_activity a
  WHERE a.project_id = p.id AND a.event_type = 'project_created'
);
