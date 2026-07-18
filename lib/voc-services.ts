// ============================================================
// VERIFICATION OPERATIONS CENTER (VOC) — Services
// Version 4: Supabase-backed adapter layer
// ============================================================

import { supabase } from '@/lib/supabase/client';
import type {
  VerificationApplication,
  ApplicationStatus,
  VerificationDecision,
  FieldAuditRequired,
  AuditFormData,
  AuditReport,
  OfficialRecord,
  ProjectSnapshot,
  SnapshotDocument,
  VerificationAgency,
  AgencyRequest,
  VerificationRequest,
  AgencyRequestStatus,
  AgencyVerificationStatus,
  CarbonPassportApplication,
  CarbonPassportStatus,
  VOCCalendarEvent,
  AgencyService,
  AgencyServiceCategory,
  AgencyServicePriceUnit,
  AgencyCertification,
  AgencyAvailability,
  AgencyRecentProject,
} from './voc-types';

// ── Workflow State Machine ──────────────────────────────────
const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  draft: ['submitted'],
  submitted: ['under_review'],
  under_review: ['audit_scheduled', 'audit_completed', 'returned_for_revision', 'rejected', 'approved'],
  audit_scheduled: ['audit_completed', 'returned_for_revision', 'rejected'],
  audit_completed: ['approved', 'returned_for_revision', 'rejected'],
  approved: [],
  returned_for_revision: ['submitted'],
  rejected: [],
};

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Notifications (Supabase RPC) ───────────────────────────

export async function sendNotification(params: {
  title: string;
  body: string;
  type: string;
  targetUserId: string;
  link?: string;
}): Promise<void> {
  try {
    await supabase.rpc('insert_notification', {
      p_user_id: params.targetUserId,
      p_title: params.title,
      p_body: params.body,
      p_type: params.type,
      p_link: params.link || null,
    });
  } catch (err) {
    console.error('[VOC] Notification failed:', err);
  }
}

export async function sendNotifications(params: {
  title: string;
  body: string;
  type: string;
  targetUserIds: string[];
  link?: string;
}): Promise<void> {
  for (const uid of params.targetUserIds) {
    await sendNotification({
      title: params.title,
      body: params.body,
      type: params.type,
      targetUserId: uid,
      link: params.link,
    });
  }
}

export async function getNotificationsForUser(userId: string): Promise<{ id: string; title: string; body: string | null; type: string; read: boolean; link: string | null; created_at: string }[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  return count || 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
}

// ── Activity Log (Supabase) ────────────────────────────────

export async function logActivity(params: {
  projectId: string;
  eventType: string;
  title: string;
  description?: string;
  actorName?: string;
  actorRole?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabase.from('project_activity').insert({
      project_id: params.projectId,
      event_type: params.eventType,
      title: params.title,
      description: params.description || '',
      actor_name: params.actorName || null,
      actor_role: params.actorRole || null,
      metadata: params.metadata || null,
    });
  } catch (err) {
    console.error('[VOC] Activity log failed:', err);
  }
}

export async function getActivityForProject(projectId: string): Promise<{ id: string; event_type: string; title: string; description: string | null; actor_name: string | null; actor_role: string | null; metadata: Record<string, unknown> | null; created_at: string }[]> {
  const { data } = await supabase
    .from('project_activity')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  return data || [];
}

// ── Verification Agencies (Supabase) ───────────────────────

export async function getVerificationAgencies(): Promise<VerificationAgency[]> {
  const { data } = await supabase
    .from('verification_agencies')
    .select('*')
    .order('projects_certified', { ascending: false });
  return (data || []).map(mapAgencyFromDb);
}

export async function getVerificationAgency(id: string): Promise<VerificationAgency | undefined> {
  const { data } = await supabase
    .from('verification_agencies')
    .select('*')
    .eq('id', id)
    .single();
  return data ? mapAgencyFromDb(data) : undefined;
}

export async function getAgencyForProfile(profileId: string): Promise<VerificationAgency | undefined> {
  const { data } = await supabase
    .from('verification_agencies')
    .select('*')
    .eq('profile_id', profileId)
    .single();
  return data ? mapAgencyFromDb(data) : undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAgencyFromDb(row: any): VerificationAgency {
  return {
    id: row.id,
    profile_id: row.profile_id,
    name: row.name,
    logo_url: row.logo_url,
    cover_image: row.cover_image || null,
    registration_number: row.registration_number,
    description: row.description || '',
    mission: row.mission || '',
    vision: row.vision || '',
    founded_year: row.founded_year || 0,
    headquarters: row.headquarters || '',
    operating_regions: row.operating_regions || [],
    countries_served: row.countries_served || [],
    states_covered: row.states_covered || [],
    districts: row.districts || [],
    expertise: row.expertise || [],
    services: row.services || [],
    supported_ecosystems: row.supported_ecosystems || [],
    certifications: row.certifications || [],
    website: row.website || '',
    email: row.email || '',
    phone: row.phone || '',
    social_links: row.social_links || {},
    projects_certified: row.projects_certified || 0,
    active_applications: row.active_applications || 0,
    avg_verification_days: row.avg_verification_days || 0,
    years_of_operation: row.years_of_operation || 0,
    available_audit_teams: row.available_audit_teams || 0,
    estimated_review_days: row.estimated_review_days || 0,
    availability: row.availability || 'accepting',
    verification_status: row.verification_status || 'active',
    profile_id_internal: row.profile_id,
    verifier_ids: [],
    audit_team_ids: [],
    regional_office_ids: [],
    accepts_new_applications: row.accepts_new_applications ?? true,
    paused: row.paused ?? false,
    recent_projects: row.recent_projects || [],
  };
}

// ── Selected Agency (localStorage — UI state only) ──────────

const SELECTED_AGENCY_KEY = 'carbonrush_selected_agency';

export function getSelectedAgency(): VerificationAgency | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SELECTED_AGENCY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VerificationAgency;
  } catch {
    return null;
  }
}

export function saveSelectedAgency(agency: VerificationAgency): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SELECTED_AGENCY_KEY, JSON.stringify(agency));
  } catch { /* noop */ }
}

export function clearSelectedAgency(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SELECTED_AGENCY_KEY);
  } catch { /* noop */ }
}

// ── Active Application Check (for lock banner) ─────────────

export async function getActiveApplicationForProject(projectId: string): Promise<VerificationApplication | undefined> {
  const { data } = await supabase
    .from('voc_agency_requests')
    .select('*, voc_requests!inner(project_id)')
    .eq('voc_requests.project_id', projectId)
    .in('verification_status', ['under_review', 'audit_scheduled', 'audit_completed'])
    .limit(1)
    .maybeSingle();

  if (!data) return undefined;

  // Map to VerificationApplication shape for backward compat
  return {
    id: data.id,
    application_number: data.request_id,
    project_id: projectId,
    project_name: '',
    project_owner_id: '',
    project_owner_name: '',
    ngo_id: data.agency_id,
    ngo_name: data.agency_name,
    verification_agency_id: data.agency_id,
    verification_agency_name: data.agency_name,
    assigned_at: data.created_at,
    verifier_id: null,
    verifier_name: data.assigned_verifier,
    submitted_date: data.created_at,
    status: mapDbStatus(data.verification_status as string),
    snapshot: null,
    field_audit_required: 'no',
    audit_date: data.audit_date,
    audit_notes: '',
    audit_form: null,
    audit_report: null,
    decision: null,
    decision_date: null,
    decision_notes: '',
    decision_verifier_name: null,
    digital_signature: null,
    blockchain_hash: null,
    carbon_passport: null,
    verification_certificate: null,
  };
}

export async function hasActiveApplication(projectId: string): Promise<boolean> {
  const app = await getActiveApplicationForProject(projectId);
  return app !== undefined;
}

export async function getApplicationsForProject(projectId: string): Promise<VerificationApplication[]> {
  const { data } = await supabase
    .from('voc_agency_requests')
    .select('*, voc_requests!inner(project_id, project_name, project_owner_id, project_owner_name)')
    .eq('voc_requests.project_id', projectId);

  return (data || []).map((row: Record<string, unknown>) => {
    const req = row.voc_requests as Record<string, unknown>;
    return {
      id: row.id as string,
      application_number: row.request_id as string,
      project_id: projectId,
      project_name: (req?.project_name as string) || '',
      project_owner_id: (req?.project_owner_id as string) || '',
      project_owner_name: (req?.project_owner_name as string) || '',
      ngo_id: row.agency_id as string,
      ngo_name: row.agency_name as string,
      verification_agency_id: row.agency_id as string,
      verification_agency_name: row.agency_name as string,
      assigned_at: row.created_at as string,
      verifier_id: null,
      verifier_name: row.assigned_verifier as string | null,
      submitted_date: row.created_at as string,
      status: mapDbStatus(row.verification_status as string),
      snapshot: null,
      field_audit_required: 'no',
      audit_date: row.audit_date as string | null,
      audit_notes: '',
      audit_form: null,
      audit_report: null,
      decision: null,
      decision_date: null,
      decision_notes: '',
      decision_verifier_name: null,
      digital_signature: null,
      blockchain_hash: null,
      carbon_passport: null,
      verification_certificate: null,
    };
  });
}

// ── Multi-Agency Verification Requests (Supabase) ──────────

export async function getVerificationRequests(): Promise<VerificationRequest[]> {
  const { data: requests } = await supabase
    .from('voc_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (!requests) return [];

  const result: VerificationRequest[] = [];
  for (const req of requests) {
    const { data: agencyRows } = await supabase
      .from('voc_agency_requests')
      .select('*')
      .eq('request_id', req.id);

    result.push({
      id: req.id,
      requestNumber: req.request_number,
      projectId: req.project_id,
      projectName: req.project_name,
      projectOwnerId: req.project_owner_id,
      projectOwnerName: req.project_owner_name,
      selectedAgencies: (agencyRows || []).map(mapAgencyRequestFromDb),
      snapshot: req.snapshot || undefined,
      createdAt: req.created_at,
    });
  }
  return result;
}

export async function getVerificationRequest(id: string): Promise<VerificationRequest | undefined> {
  const { data: req } = await supabase
    .from('voc_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (!req) return undefined;

  const { data: agencyRows } = await supabase
    .from('voc_agency_requests')
    .select('*')
    .eq('request_id', id);

  return {
    id: req.id,
    requestNumber: req.request_number,
    projectId: req.project_id,
    projectName: req.project_name,
    projectOwnerId: req.project_owner_id,
    projectOwnerName: req.project_owner_name,
    selectedAgencies: (agencyRows || []).map(mapAgencyRequestFromDb),
    snapshot: req.snapshot || undefined,
    createdAt: req.created_at,
  };
}

export async function getVerificationRequestsForProject(projectId: string): Promise<VerificationRequest[]> {
  const { data: requests } = await supabase
    .from('voc_requests')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (!requests) return [];

  const result: VerificationRequest[] = [];
  for (const req of requests) {
    const { data: agencyRows } = await supabase
      .from('voc_agency_requests')
      .select('*')
      .eq('request_id', req.id);

    result.push({
      id: req.id,
      requestNumber: req.request_number,
      projectId: req.project_id,
      projectName: req.project_name,
      projectOwnerId: req.project_owner_id,
      projectOwnerName: req.project_owner_name,
      selectedAgencies: (agencyRows || []).map(mapAgencyRequestFromDb),
      snapshot: req.snapshot || undefined,
      createdAt: req.created_at,
    });
  }
  return result;
}

export async function getActiveVerificationRequestForProject(projectId: string): Promise<VerificationRequest | undefined> {
  const { data: req } = await supabase
    .from('voc_requests')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!req) return undefined;

  const { data: agencyRows } = await supabase
    .from('voc_agency_requests')
    .select('*')
    .eq('request_id', req.id);

  const hasActive = (agencyRows || []).some((a: Record<string, unknown>) =>
    a.request_status !== 'declined' &&
    !['approved', 'returned', 'rejected'].includes(a.verification_status as string)
  );

  if (!hasActive) return undefined;

  return {
    id: req.id,
    requestNumber: req.request_number,
    projectId: req.project_id,
    projectName: req.project_name,
    projectOwnerId: req.project_owner_id,
    projectOwnerName: req.project_owner_name,
    selectedAgencies: (agencyRows || []).map(mapAgencyRequestFromDb),
    snapshot: req.snapshot || undefined,
    createdAt: req.created_at,
  };
}

function mapAgencyRequestFromDb(row: Record<string, unknown>): AgencyRequest {
  return {
    agencyId: row.agency_id as string,
    agencyName: row.agency_name as string,
    requestStatus: row.request_status as AgencyRequestStatus,
    verificationStatus: row.verification_status as AgencyVerificationStatus,
    assignedVerifier: (row.assigned_verifier as string) || null,
    auditDate: (row.audit_date as string) || null,
    lastUpdated: row.last_updated as string,
    carbonPassportStatus: (row.carbon_passport_status as CarbonPassportStatus) || 'none',
  };
}

export async function sendVerificationRequests(params: {
  projectId: string;
  projectName: string;
  projectOwnerId: string;
  projectOwnerName: string;
  selectedAgencies: { agencyId: string; agencyName: string }[];
  snapshot?: ProjectSnapshot;
  ownerUserId?: string;
}): Promise<VerificationRequest> {
  // Generate request number
  const { count } = await supabase
    .from('voc_requests')
    .select('*', { count: 'exact', head: true });
  const seq = (count || 0) + 1;
  const reqNumber = `VR-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

  // Insert the request
  const { data: requestRow } = await supabase
    .from('voc_requests')
    .insert({
      request_number: reqNumber,
      project_id: params.projectId,
      project_name: params.projectName,
      project_owner_id: params.projectOwnerId,
      project_owner_name: params.projectOwnerName,
      snapshot: params.snapshot || null,
    })
    .select()
    .single();

  if (!requestRow) throw new Error('Failed to create verification request');

  // Insert agency requests
  const agencyRows = params.selectedAgencies.map(a => ({
    request_id: requestRow.id,
    agency_id: a.agencyId,
    agency_name: a.agencyName,
    request_status: 'sent' as AgencyRequestStatus,
    verification_status: 'waiting' as AgencyVerificationStatus,
    carbon_passport_status: 'none' as CarbonPassportStatus,
  }));

  await supabase.from('voc_agency_requests').insert(agencyRows);

  // Log activity
  await logActivity({
    projectId: params.projectId,
    eventType: 'verification_requests_sent',
    title: 'Verification Requests Sent',
    description: `Verification requests sent to ${params.selectedAgencies.length} agencies for "${params.projectName}"`,
    actorName: params.projectOwnerName,
    actorRole: 'Project Owner',
    metadata: { request_number: reqNumber, agency_count: params.selectedAgencies.length },
  });

  // Send notifications
  if (params.ownerUserId) {
    await sendNotification({
      title: 'Verification Requests Sent',
      body: `${params.selectedAgencies.length} verification request(s) sent for "${params.projectName}".`,
      type: 'verification_requests_sent',
      targetUserId: params.ownerUserId,
    });
  }

  return {
    id: requestRow.id,
    requestNumber: reqNumber,
    projectId: params.projectId,
    projectName: params.projectName,
    projectOwnerId: params.projectOwnerId,
    projectOwnerName: params.projectOwnerName,
    selectedAgencies: params.selectedAgencies.map(a => ({
      agencyId: a.agencyId,
      agencyName: a.agencyName,
      requestStatus: 'sent',
      verificationStatus: 'waiting',
      assignedVerifier: null,
      auditDate: null,
      lastUpdated: new Date().toISOString(),
      carbonPassportStatus: 'none',
    })),
    snapshot: params.snapshot,
    createdAt: requestRow.created_at,
  };
}

export async function updateAgencyRequest(
  requestId: string,
  agencyId: string,
  updates: {
    requestStatus?: AgencyRequestStatus;
    verificationStatus?: AgencyVerificationStatus;
    assignedVerifier?: string | null;
    auditDate?: string | null;
    carbonPassportStatus?: CarbonPassportStatus;
  },
): Promise<void> {
  const dbUpdates: Record<string, unknown> = { last_updated: new Date().toISOString() };
  if (updates.requestStatus) dbUpdates.request_status = updates.requestStatus;
  if (updates.verificationStatus) dbUpdates.verification_status = updates.verificationStatus;
  if (updates.assignedVerifier !== undefined) dbUpdates.assigned_verifier = updates.assignedVerifier;
  if (updates.auditDate !== undefined) dbUpdates.audit_date = updates.auditDate;
  if (updates.carbonPassportStatus) dbUpdates.carbon_passport_status = updates.carbonPassportStatus;

  await supabase
    .from('voc_agency_requests')
    .update(dbUpdates)
    .eq('request_id', requestId)
    .eq('agency_id', agencyId);
}

export async function declineAgencyRequest(requestId: string, agencyId: string, agencyName: string): Promise<void> {
  await updateAgencyRequest(requestId, agencyId, { requestStatus: 'declined' });

  const { data: req } = await supabase
    .from('voc_requests')
    .select('project_owner_id, project_name')
    .eq('id', requestId)
    .single();

  if (req) {
    await sendNotification({
      title: 'Agency Declined Request',
      body: `${agencyName} has declined the verification request for "${req.project_name}".`,
      type: 'agency_declined',
      targetUserId: req.project_owner_id,
    });
  }
}

export async function acceptAgencyRequest(requestId: string, agencyId: string, agencyName: string): Promise<void> {
  await updateAgencyRequest(requestId, agencyId, { requestStatus: 'accepted' });

  const { data: req } = await supabase
    .from('voc_requests')
    .select('project_owner_id, project_name')
    .eq('id', requestId)
    .single();

  if (req) {
    await sendNotification({
      title: 'Agency Accepted Request',
      body: `${agencyName} has accepted the verification request for "${req.project_name}".`,
      type: 'agency_accepted',
      targetUserId: req.project_owner_id,
    });
  }
}

export async function assignVerifierToAgency(
  requestId: string,
  agencyId: string,
  verifierName: string,
): Promise<void> {
  await updateAgencyRequest(requestId, agencyId, {
    verificationStatus: 'under_review',
    assignedVerifier: verifierName,
  });

  const { data: req } = await supabase
    .from('voc_requests')
    .select('project_owner_id, project_name, project_id')
    .eq('id', requestId)
    .single();

  if (req) {
    await sendNotification({
      title: 'Verifier Assigned',
      body: `${verifierName} has been assigned to verify "${req.project_name}".`,
      type: 'verifier_assigned',
      targetUserId: req.project_owner_id,
    });

    await logActivity({
      projectId: req.project_id,
      eventType: 'verifier_assigned',
      title: 'Verifier Assigned',
      description: `${verifierName} assigned to verify "${req.project_name}"`,
      actorName: verifierName,
      actorRole: 'Verifier',
      metadata: { agency_id: agencyId },
    });
  }
}

export async function scheduleAgencyAudit(
  requestId: string,
  agencyId: string,
  auditDate: string,
): Promise<void> {
  await updateAgencyRequest(requestId, agencyId, {
    verificationStatus: 'audit_scheduled',
    auditDate,
  });

  const { data: req } = await supabase
    .from('voc_requests')
    .select('project_owner_id, project_name, project_id')
    .eq('id', requestId)
    .single();

  if (req) {
    await sendNotification({
      title: 'Audit Scheduled',
      body: `A field audit for "${req.project_name}" has been scheduled for ${auditDate}.`,
      type: 'audit_scheduled',
      targetUserId: req.project_owner_id,
    });

    await logActivity({
      projectId: req.project_id,
      eventType: 'verification_audit_scheduled',
      title: 'Field Audit Scheduled',
      description: `Field audit for "${req.project_name}" scheduled for ${auditDate}`,
      actorRole: 'Verifier',
      metadata: { audit_date: auditDate, agency_id: agencyId },
    });
  }
}

export async function completeAgencyAudit(requestId: string, agencyId: string): Promise<void> {
  await updateAgencyRequest(requestId, agencyId, { verificationStatus: 'audit_completed' });

  const { data: req } = await supabase
    .from('voc_requests')
    .select('project_owner_id, project_name, project_id')
    .eq('id', requestId)
    .single();

  if (req) {
    await sendNotification({
      title: 'Audit Completed',
      body: `The field audit for "${req.project_name}" has been completed.`,
      type: 'audit_completed',
      targetUserId: req.project_owner_id,
    });

    await logActivity({
      projectId: req.project_id,
      eventType: 'verification_audit_completed',
      title: 'Field Audit Completed',
      description: `Field audit for "${req.project_name}" completed`,
      actorRole: 'Verifier',
      metadata: { agency_id: agencyId },
    });
  }
}

export async function decideAgencyRequest(
  requestId: string,
  agencyId: string,
  decision: 'approved' | 'returned' | 'rejected',
): Promise<void> {
  await updateAgencyRequest(requestId, agencyId, { verificationStatus: decision });

  const { data: req } = await supabase
    .from('voc_requests')
    .select('project_owner_id, project_name, project_id')
    .eq('id', requestId)
    .single();

  if (req) {
    const labelMap = { approved: 'Approved', returned: 'Returned for Revision', rejected: 'Rejected' };
    const typeMap = { approved: 'project_approved', returned: 'project_returned', rejected: 'project_rejected' };
    await sendNotification({
      title: `Project ${labelMap[decision]}`,
      body: `Your project "${req.project_name}" has been ${labelMap[decision].toLowerCase()} by the verification agency.`,
      type: typeMap[decision],
      targetUserId: req.project_owner_id,
    });

    await logActivity({
      projectId: req.project_id,
      eventType: `verification_application_${decision === 'returned' ? 'returned' : decision}`,
      title: `Project ${labelMap[decision]}`,
      description: `Verification ${decision} for "${req.project_name}"`,
      actorRole: 'Verifier',
      metadata: { decision, agency_id: agencyId },
    });
  }
}

// ── Carbon Passport Applications (Supabase) ────────────────

export async function getCarbonPassportApplications(): Promise<CarbonPassportApplication[]> {
  const { data } = await supabase
    .from('voc_passport_applications')
    .select('*')
    .order('created_at', { ascending: false });

  return (data || []).map(mapPassportAppFromDb);
}

export async function getCarbonPassportApplicationsForProject(projectId: string): Promise<CarbonPassportApplication[]> {
  const { data } = await supabase
    .from('voc_passport_applications')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  return (data || []).map(mapPassportAppFromDb);
}

export async function getCarbonPassportApplicationForAgency(
  requestId: string,
  agencyId: string,
): Promise<CarbonPassportApplication | undefined> {
  const { data } = await supabase
    .from('voc_passport_applications')
    .select('*')
    .eq('request_id', requestId)
    .eq('agency_id', agencyId)
    .maybeSingle();

  return data ? mapPassportAppFromDb(data) : undefined;
}

function mapPassportAppFromDb(row: Record<string, unknown>): CarbonPassportApplication {
  return {
    id: row.id as string,
    requestId: row.request_id as string,
    agencyId: row.agency_id as string,
    agencyName: row.agency_name as string,
    projectId: row.project_id as string,
    projectName: row.project_name as string,
    projectOwnerId: row.project_owner_id as string,
    status: row.status as CarbonPassportStatus,
    assignedVerifier: (row.assigned_verifier as string) || null,
    verificationReportRef: (row.verification_report_ref as string) || null,
    auditReportRef: (row.audit_report_ref as string) || null,
    certificateUrl: (row.certificate_url as string) || null,
    passportNumber: (row.passport_number as string) || null,
    qrCodeData: (row.qr_code_data as string) || null,
    digitalSignature: (row.digital_signature as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function applyForCarbonPassport(params: {
  requestId: string;
  projectId: string;
  projectName: string;
  projectOwnerId: string;
  projectOwnerName: string;
  agencyId: string;
  agencyName: string;
  assignedVerifier: string | null;
  verificationReportRef: string | null;
  auditReportRef: string | null;
}): Promise<CarbonPassportApplication> {
  const { data: app } = await supabase
    .from('voc_passport_applications')
    .insert({
      request_id: params.requestId,
      agency_id: params.agencyId,
      agency_name: params.agencyName,
      project_id: params.projectId,
      project_name: params.projectName,
      project_owner_id: params.projectOwnerId,
      status: 'requested',
      assigned_verifier: params.assignedVerifier,
      verification_report_ref: params.verificationReportRef,
      audit_report_ref: params.auditReportRef,
    })
    .select()
    .single();

  if (!app) throw new Error('Failed to create passport application');

  // Update agency's carbonPassportStatus on the VerificationRequest
  await updateAgencyRequest(params.requestId, params.agencyId, {
    carbonPassportStatus: 'requested',
  });

  // Log activity
  await logActivity({
    projectId: params.projectId,
    eventType: 'carbon_passport_applied',
    title: 'Carbon Passport Application Submitted',
    description: `Carbon Passport application submitted to ${params.agencyName} for "${params.projectName}"`,
    actorName: params.projectOwnerName,
    actorRole: 'Project Owner',
    metadata: { application_id: app.id, agency_name: params.agencyName },
  });

  // Notify the agency
  await sendNotification({
    title: 'Carbon Passport Application Received',
    body: `A Carbon Passport application has been submitted for "${params.projectName}" by ${params.projectOwnerName}.`,
    type: 'carbon_passport_applied',
    targetUserId: params.agencyId,
  });

  return mapPassportAppFromDb(app);
}

export async function updateCarbonPassportStatus(
  applicationId: string,
  status: CarbonPassportStatus,
  extras?: { passportNumber?: string; certificateUrl?: string },
): Promise<void> {
  const updates: Record<string, unknown> = { status };
  if (extras?.passportNumber) updates.passport_number = extras.passportNumber;
  if (extras?.certificateUrl) updates.certificate_url = extras.certificateUrl;

  await supabase
    .from('voc_passport_applications')
    .update(updates)
    .eq('id', applicationId);

  // Get the updated app for notifications
  const { data: app } = await supabase
    .from('voc_passport_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (app) {
    // Sync status back to the VerificationRequest's agency entry
    await updateAgencyRequest(app.request_id, app.agency_id, {
      carbonPassportStatus: status,
    });

    const labelMap: Record<CarbonPassportStatus, string> = {
      none: 'Not Applied',
      requested: 'Passport Requested',
      under_processing: 'Under Processing',
      issued: 'Passport Issued',
    };

    await sendNotification({
      title: `Carbon Passport ${labelMap[status]}`,
      body: `The Carbon Passport for "${app.project_name}" via ${app.agency_name} is now: ${labelMap[status]}.`,
      type: `carbon_passport_${status}`,
      targetUserId: app.project_owner_id,
      link: `/dashboard/projects/${app.project_id}/official-records`,
    });

    if (status === 'issued') {
      // Generate QR code payload and digital signature
      const passportNum = extras?.passportNumber || `CP-${applicationId.slice(0, 8).toUpperCase()}`;
      const qrPayload = JSON.stringify({
        type: 'carbon_rush_passport',
        passport: passportNum,
        project: app.project_id,
        agency: app.agency_id,
        issued: new Date().toISOString(),
        verified: true,
      });
      // Simple deterministic signature from passport + agency + timestamp
      const signatureData = `${passportNum}:${app.agency_id}:${Date.now()}`;
      let hash = 0;
      for (let i = 0; i < signatureData.length; i++) {
        const chr = signatureData.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
      }
      const digitalSignature = `SIG-${passportNum}-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;

      // Store QR + signature on the passport application
      await supabase
        .from('voc_passport_applications')
        .update({
          qr_code_data: qrPayload,
          digital_signature: digitalSignature,
        })
        .eq('id', applicationId);

      await logActivity({
        projectId: app.project_id,
        eventType: 'carbon_passport_issued',
        title: 'Carbon Passport Issued',
        description: `Carbon Passport issued by ${app.agency_name} for "${app.project_name}"`,
        actorName: app.agency_name,
        actorRole: 'Verification Agency',
        metadata: {
          application_id: applicationId,
          passport_number: passportNum,
          digital_signature: digitalSignature,
        },
      });

      await supabase.from('voc_official_records').insert([
        {
          request_id: app.request_id,
          record_type: 'carbon_passport',
          title: 'Carbon Passport',
          description: `Carbon Passport ${passportNum} issued by ${app.agency_name}`,
          verifier_name: app.agency_name,
          ngo_name: app.agency_name,
          file_name: `carbon-passport-${passportNum}.pdf`,
        },
        {
          request_id: app.request_id,
          record_type: 'verification_certificate',
          title: 'Verification Certificate',
          description: `Verification Certificate for "${app.project_name}" issued by ${app.agency_name}`,
          verifier_name: app.agency_name,
          ngo_name: app.agency_name,
          file_name: `verification-certificate-${applicationId}.pdf`,
        },
      ]);
    }
  }
}

// ── Official Records (Supabase) ────────────────────────────

export async function getOfficialRecords(): Promise<OfficialRecord[]> {
  const { data } = await supabase
    .from('voc_official_records')
    .select('*')
    .order('created_at', { ascending: false });

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    application_id: row.request_id as string,
    record_type: row.record_type as OfficialRecord['record_type'],
    title: row.title as string,
    description: (row.description as string) || '',
    created_date: row.created_at as string,
    timestamp: row.timestamp as string,
    verifier_name: (row.verifier_name as string) || '',
    ngo_name: (row.ngo_name as string) || '',
    status: row.status as 'active' | 'archived',
    file_name: (row.file_name as string) || '',
  }));
}

export async function getOfficialRecordsForProject(projectId: string): Promise<OfficialRecord[]> {
  const { data } = await supabase
    .from('voc_official_records')
    .select('*, voc_requests!inner(project_id)')
    .eq('voc_requests.project_id', projectId)
    .order('created_at', { ascending: false });

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    application_id: row.request_id as string,
    record_type: row.record_type as OfficialRecord['record_type'],
    title: row.title as string,
    description: (row.description as string) || '',
    created_date: row.created_at as string,
    timestamp: row.timestamp as string,
    verifier_name: (row.verifier_name as string) || '',
    ngo_name: (row.ngo_name as string) || '',
    status: row.status as 'active' | 'archived',
    file_name: (row.file_name as string) || '',
  }));
}

// ── Audit Reports (Supabase) ───────────────────────────────

export async function getAuditReports(): Promise<AuditReport[]> {
  const { data } = await supabase
    .from('voc_audit_reports')
    .select('*')
    .order('generated_at', { ascending: false });

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    application_id: row.request_id as string,
    project_name: row.project_name as string,
    auditor_name: row.auditor_name as string,
    audit_date: row.audit_date as string,
    area_verified: Number(row.area_verified) || 0,
    tree_count: Number(row.tree_count) || 0,
    species_count: Number(row.species_count) || 0,
    site_condition: (row.site_condition as string) || '',
    gps_validated: Boolean(row.gps_validated),
    gps_coordinates: (row.gps_coordinates as string) || '',
    photos_count: Number(row.photos_count) || 0,
    videos_count: Number(row.videos_count) || 0,
    remarks: (row.remarks as string) || '',
    final_observation: (row.final_observation as string) || '',
    generated_at: row.generated_at as string,
  }));
}

export async function getAuditReportForApplication(applicationId: string): Promise<AuditReport | undefined> {
  const { data } = await supabase
    .from('voc_audit_reports')
    .select('*')
    .eq('request_id', applicationId)
    .maybeSingle();

  if (!data) return undefined;
  return mapAuditReportFromDb(data);
}

// ── Audit Report Submission (Supabase) ──────────────────────

export async function submitAuditReport(params: {
  requestId: string;
  agencyRequestId: string;
  projectId: string;
  projectName: string;
  auditorName: string;
  auditDate: string;
  areaVerified: number;
  treeCount: number;
  speciesCount: number;
  siteCondition: string;
  gpsValidated: boolean;
  gpsCoordinates: string;
  photosCount: number;
  videosCount: number;
  remarks: string;
  finalObservation: string;
  landOwnershipVerified?: boolean;
  boundaryVerified?: boolean;
  dominantSpecies?: string;
  avgTreeHeight?: number;
  treeHealthCondition?: string;
  estimatedCarbonStock?: number;
  biomassEstimate?: number;
  soilCarbonSample?: number;
  carbonMethodology?: string;
  biodiversityIndex?: number;
  wildlifeObserved?: string;
  invasiveSpeciesFound?: boolean;
  ecosystemCondition?: string;
  accessRoadCondition?: string;
  waterSourceNearby?: string;
  nearbyLandUse?: string;
  communityImpact?: string;
  samplesCollected?: number;
  risks?: string;
  correctiveActions?: string;
}): Promise<AuditReport> {
  const { data: report } = await supabase
    .from('voc_audit_reports')
    .insert({
      request_id: params.requestId,
      agency_request_id: params.agencyRequestId,
      project_name: params.projectName,
      auditor_name: params.auditorName,
      audit_date: params.auditDate,
      area_verified: params.areaVerified,
      tree_count: params.treeCount,
      species_count: params.speciesCount,
      site_condition: params.siteCondition,
      gps_validated: params.gpsValidated,
      gps_coordinates: params.gpsCoordinates,
      photos_count: params.photosCount,
      videos_count: params.videosCount,
      remarks: params.remarks,
      final_observation: params.finalObservation,
      land_ownership_verified: params.landOwnershipVerified ?? false,
      boundary_verified: params.boundaryVerified ?? false,
      dominant_species: params.dominantSpecies ?? '',
      avg_tree_height: params.avgTreeHeight ?? 0,
      tree_health_condition: params.treeHealthCondition ?? '',
      estimated_carbon_stock: params.estimatedCarbonStock ?? 0,
      biomass_estimate: params.biomassEstimate ?? 0,
      soil_carbon_sample: params.soilCarbonSample ?? 0,
      carbon_methodology: params.carbonMethodology ?? '',
      biodiversity_index: params.biodiversityIndex ?? 0,
      wildlife_observed: params.wildlifeObserved ?? '',
      invasive_species_found: params.invasiveSpeciesFound ?? false,
      ecosystem_condition: params.ecosystemCondition ?? '',
      access_road_condition: params.accessRoadCondition ?? '',
      water_source_nearby: params.waterSourceNearby ?? '',
      nearby_land_use: params.nearbyLandUse ?? '',
      community_impact: params.communityImpact ?? '',
      samples_collected: params.samplesCollected ?? 0,
      risks: params.risks ?? '',
      corrective_actions: params.correctiveActions ?? '',
    })
    .select()
    .single();

  if (!report) throw new Error('Failed to submit audit report');

  await logActivity({
    projectId: params.projectId,
    eventType: 'verification_audit_completed',
    title: 'Field Audit Completed',
    description: `Field audit completed for "${params.projectName}". Area: ${params.areaVerified.toLocaleString()} m², Trees: ${params.treeCount.toLocaleString()}.`,
    actorName: params.auditorName,
    actorRole: 'Field Auditor',
    metadata: {
      area_verified: params.areaVerified,
      tree_count: params.treeCount,
      site_condition: params.siteCondition,
      gps_validated: params.gpsValidated,
    },
  });

  return mapAuditReportFromDb(report);
}

export async function getAuditReportForRequest(requestId: string): Promise<AuditReport | undefined> {
  let { data } = await supabase
    .from('voc_audit_reports')
    .select('*')
    .eq('agency_request_id', requestId)
    .maybeSingle();

  if (!data) {
    const result = await supabase
      .from('voc_audit_reports')
      .select('*')
      .eq('request_id', requestId)
      .maybeSingle();
    data = result.data;
  }

  if (!data) return undefined;
  return mapAuditReportFromDb(data);
}

function mapAuditReportFromDb(row: Record<string, unknown>): AuditReport {
  return {
    id: row.id as string,
    application_id: row.request_id as string,
    project_name: row.project_name as string,
    auditor_name: row.auditor_name as string,
    audit_date: row.audit_date as string,
    area_verified: Number(row.area_verified) || 0,
    tree_count: Number(row.tree_count) || 0,
    species_count: Number(row.species_count) || 0,
    site_condition: row.site_condition as string || '',
    gps_validated: Boolean(row.gps_validated),
    gps_coordinates: row.gps_coordinates as string || '',
    photos_count: Number(row.photos_count) || 0,
    videos_count: Number(row.videos_count) || 0,
    remarks: row.remarks as string || '',
    final_observation: row.final_observation as string || '',
    generated_at: row.generated_at as string,
    // Extended fields
    land_ownership_verified: Boolean(row.land_ownership_verified),
    boundary_verified: Boolean(row.boundary_verified),
    dominant_species: row.dominant_species as string || '',
    avg_tree_height: Number(row.avg_tree_height) || 0,
    tree_health_condition: row.tree_health_condition as string || '',
    estimated_carbon_stock: Number(row.estimated_carbon_stock) || 0,
    biomass_estimate: Number(row.biomass_estimate) || 0,
    soil_carbon_sample: Number(row.soil_carbon_sample) || 0,
    carbon_methodology: row.carbon_methodology as string || '',
    biodiversity_index: Number(row.biodiversity_index) || 0,
    wildlife_observed: row.wildlife_observed as string || '',
    invasive_species_found: Boolean(row.invasive_species_found),
    ecosystem_condition: row.ecosystem_condition as string || '',
    access_road_condition: row.access_road_condition as string || '',
    water_source_nearby: row.water_source_nearby as string || '',
    nearby_land_use: row.nearby_land_use as string || '',
    community_impact: row.community_impact as string || '',
    samples_collected: Number(row.samples_collected) || 0,
    risks: row.risks as string || '',
    corrective_actions: row.corrective_actions as string || '',
  };
}

// ── Calendar Events (Supabase) ──────────────────────────────

export async function getCalendarEvents(): Promise<VOCCalendarEvent[]> {
  const events: VOCCalendarEvent[] = [];

  const { data: agencyRequests } = await supabase
    .from('voc_agency_requests')
    .select('id, agency_name, audit_date, verification_status, request_id, voc_requests!inner(project_name)')
    .not('audit_date', 'is', null);

  if (agencyRequests) {
    for (const ar of agencyRequests) {
      const req = ar.voc_requests as Record<string, unknown>;
      const projectName = (req?.project_name as string) || 'Unknown Project';
      const auditDate = ar.audit_date as string;
      const dateStr = auditDate.split('T')[0];

      if (ar.verification_status === 'audit_scheduled') {
        events.push({
          id: `audit-${ar.id}`,
          title: `Field Audit: ${ar.agency_name}`,
          date: dateStr,
          time: '09:00',
          type: 'audit',
          application_id: ar.request_id,
          project_name: projectName,
        });
      } else if (ar.verification_status === 'audit_completed' || ar.verification_status === 'approved') {
        events.push({
          id: `completed-${ar.id}`,
          title: `Audit Completed: ${ar.agency_name}`,
          date: dateStr,
          time: '09:00',
          type: 'completed',
          application_id: ar.request_id,
          project_name: projectName,
        });
      }
    }
  }

  const { data: reviewRequests } = await supabase
    .from('voc_agency_requests')
    .select('id, agency_name, created_at, verification_status, request_id, voc_requests!inner(project_name)')
    .eq('verification_status', 'under_review');

  if (reviewRequests) {
    for (const rr of reviewRequests) {
      const req = rr.voc_requests as Record<string, unknown>;
      const projectName = (req?.project_name as string) || 'Unknown Project';
      const createdDate = (rr.created_at as string).split('T')[0];

      events.push({
        id: `review-${rr.id}`,
        title: `Review: ${rr.agency_name}`,
        date: createdDate,
        time: '10:00',
        type: 'review',
        application_id: rr.request_id,
        project_name: projectName,
      });
    }
  }

  return events;
}

// ── History ─────────────────────────────────────────────────

export async function getHistoryApplications(): Promise<VerificationApplication[]> {
  const { data } = await supabase
    .from('voc_agency_requests')
    .select('*, voc_requests!inner(project_id, project_name, project_owner_id, project_owner_name)')
    .in('verification_status', ['approved', 'returned', 'rejected']);

  return (data || []).map((row: Record<string, unknown>) => {
    const req = row.voc_requests as Record<string, unknown>;
    return {
      id: row.id as string,
      application_number: row.request_id as string,
      project_id: (req?.project_id as string) || '',
      project_name: (req?.project_name as string) || '',
      project_owner_id: (req?.project_owner_id as string) || '',
      project_owner_name: (req?.project_owner_name as string) || '',
      ngo_id: row.agency_id as string,
      ngo_name: row.agency_name as string,
      verification_agency_id: row.agency_id as string,
      verification_agency_name: row.agency_name as string,
      assigned_at: row.created_at as string,
      verifier_id: null,
      verifier_name: row.assigned_verifier as string | null,
      submitted_date: row.created_at as string,
      status: mapDbStatus(row.verification_status as string),
      snapshot: null,
      field_audit_required: 'no',
      audit_date: row.audit_date as string | null,
      audit_notes: '',
      audit_form: null,
      audit_report: null,
      decision: null,
      decision_date: null,
      decision_notes: '',
      decision_verifier_name: null,
      digital_signature: null,
      blockchain_hash: null,
      carbon_passport: null,
      verification_certificate: null,
    };
  });
}

export async function getHistoryApplicationsForAgency(agencyId: string): Promise<VerificationApplication[]> {
  const { data } = await supabase
    .from('voc_agency_requests')
    .select('*, voc_requests!inner(project_id, project_name, project_owner_id, project_owner_name)')
    .eq('agency_id', agencyId)
    .in('verification_status', ['approved', 'returned', 'rejected']);

  return (data || []).map((row: Record<string, unknown>) => {
    const req = row.voc_requests as Record<string, unknown>;
    return {
      id: row.id as string,
      application_number: row.request_id as string,
      project_id: (req?.project_id as string) || '',
      project_name: (req?.project_name as string) || '',
      project_owner_id: (req?.project_owner_id as string) || '',
      project_owner_name: (req?.project_owner_name as string) || '',
      ngo_id: row.agency_id as string,
      ngo_name: row.agency_name as string,
      verification_agency_id: row.agency_id as string,
      verification_agency_name: row.agency_name as string,
      assigned_at: row.created_at as string,
      verifier_id: null,
      verifier_name: row.assigned_verifier as string | null,
      submitted_date: row.created_at as string,
      status: mapDbStatus(row.verification_status as string),
      snapshot: null,
      field_audit_required: 'no',
      audit_date: row.audit_date as string | null,
      audit_notes: '',
      audit_form: null,
      audit_report: null,
      decision: null,
      decision_date: null,
      decision_notes: '',
      decision_verifier_name: null,
      digital_signature: null,
      blockchain_hash: null,
      carbon_passport: null,
      verification_certificate: null,
    };
  });
}

export async function getApplicationsByStatus(status: ApplicationStatus): Promise<VerificationApplication[]> {
  const { data } = await supabase
    .from('voc_agency_requests')
    .select('*, voc_requests!inner(project_id, project_name, project_owner_id, project_owner_name)')
    .eq('verification_status', status);

  return (data || []).map((row: Record<string, unknown>) => {
    const req = row.voc_requests as Record<string, unknown>;
    return {
      id: row.id as string,
      application_number: row.request_id as string,
      project_id: (req?.project_id as string) || '',
      project_name: (req?.project_name as string) || '',
      project_owner_id: (req?.project_owner_id as string) || '',
      project_owner_name: (req?.project_owner_name as string) || '',
      ngo_id: row.agency_id as string,
      ngo_name: row.agency_name as string,
      verification_agency_id: row.agency_id as string,
      verification_agency_name: row.agency_name as string,
      assigned_at: row.created_at as string,
      verifier_id: null,
      verifier_name: row.assigned_verifier as string | null,
      submitted_date: row.created_at as string,
      status: mapDbStatus(row.verification_status as string),
      snapshot: null,
      field_audit_required: 'no',
      audit_date: row.audit_date as string | null,
      audit_notes: '',
      audit_form: null,
      audit_report: null,
      decision: null,
      decision_date: null,
      decision_notes: '',
      decision_verifier_name: null,
      digital_signature: null,
      blockchain_hash: null,
      carbon_passport: null,
      verification_certificate: null,
    };
  });
}

export async function getApplication(id: string): Promise<VerificationApplication | undefined> {
  const { data } = await supabase
    .from('voc_agency_requests')
    .select('*, voc_requests!inner(project_id, project_name, project_owner_id, project_owner_name, snapshot)')
    .eq('id', id)
    .maybeSingle();

  if (!data) return undefined;

  const req = data.voc_requests as Record<string, unknown>;
  const dbStatus = data.verification_status as string;
  const mappedStatus = mapDbStatus(dbStatus);

  // Build decision info from DB columns
  const decisionNotes = (data.decision_notes as string) || '';
  const decisionVerifierName = (data.decision_verifier_name as string) || null;
  const digitalSig = (data.digital_signature as string) || null;
  const bcHash = (data.blockchain_hash as string) || null;

  // Map terminal statuses to decision
  let decision: VerificationApplication['decision'] = null;
  let decisionDate: string | null = null;
  if (mappedStatus === 'approved') { decision = 'approve'; decisionDate = data.last_updated as string; }
  else if (mappedStatus === 'returned_for_revision') { decision = 'return_for_revision'; decisionDate = data.last_updated as string; }
  else if (mappedStatus === 'rejected') { decision = 'reject'; decisionDate = data.last_updated as string; }

  return {
    id: data.id,
    application_number: data.request_id,
    project_id: (req?.project_id as string) || '',
    project_name: (req?.project_name as string) || '',
    project_owner_id: (req?.project_owner_id as string) || '',
    project_owner_name: (req?.project_owner_name as string) || '',
    ngo_id: data.agency_id,
    ngo_name: data.agency_name,
    verification_agency_id: data.agency_id,
    verification_agency_name: data.agency_name,
    assigned_at: data.created_at,
    verifier_id: null,
    verifier_name: data.assigned_verifier,
    submitted_date: data.created_at,
    status: mappedStatus,
    snapshot: (req?.snapshot as ProjectSnapshot) || null,
    field_audit_required: 'no',
    audit_date: data.audit_date,
    audit_notes: '',
    audit_form: null,
    audit_report: null,
    decision,
    decision_date: decisionDate,
    decision_notes: decisionNotes,
    decision_verifier_name: decisionVerifierName,
    digital_signature: digitalSig,
    blockchain_hash: bcHash,
    carbon_passport: null,
    verification_certificate: null,
  };
}

export async function getApplicationsByStatusForAgency(status: ApplicationStatus, agencyId: string): Promise<VerificationApplication[]> {
  const { data } = await supabase
    .from('voc_agency_requests')
    .select('*, voc_requests!inner(project_id, project_name, project_owner_id, project_owner_name)')
    .eq('agency_id', agencyId)
    .eq('verification_status', status);

  return (data || []).map((row: Record<string, unknown>) => {
    const req = row.voc_requests as Record<string, unknown>;
    return {
      id: row.id as string,
      application_number: row.request_id as string,
      project_id: (req?.project_id as string) || '',
      project_name: (req?.project_name as string) || '',
      project_owner_id: (req?.project_owner_id as string) || '',
      project_owner_name: (req?.project_owner_name as string) || '',
      ngo_id: row.agency_id as string,
      ngo_name: row.agency_name as string,
      verification_agency_id: row.agency_id as string,
      verification_agency_name: row.agency_name as string,
      assigned_at: row.created_at as string,
      verifier_id: null,
      verifier_name: row.assigned_verifier as string | null,
      submitted_date: row.created_at as string,
      status: mapDbStatus(row.verification_status as string),
      snapshot: null,
      field_audit_required: 'no',
      audit_date: row.audit_date as string | null,
      audit_notes: '',
      audit_form: null,
      audit_report: null,
      decision: null,
      decision_date: null,
      decision_notes: '',
      decision_verifier_name: null,
      digital_signature: null,
      blockchain_hash: null,
      carbon_passport: null,
      verification_certificate: null,
    };
  });
}

export async function getActiveApplicationsForAgency(agencyId: string): Promise<VerificationApplication[]> {
  const { data } = await supabase
    .from('voc_agency_requests')
    .select('*, voc_requests!inner(project_id, project_name, project_owner_id, project_owner_name)')
    .eq('agency_id', agencyId)
    .in('verification_status', ['under_review', 'audit_scheduled', 'audit_completed']);

  return (data || []).map((row: Record<string, unknown>) => {
    const req = row.voc_requests as Record<string, unknown>;
    return {
      id: row.id as string,
      application_number: row.request_id as string,
      project_id: (req?.project_id as string) || '',
      project_name: (req?.project_name as string) || '',
      project_owner_id: (req?.project_owner_id as string) || '',
      project_owner_name: (req?.project_owner_name as string) || '',
      ngo_id: row.agency_id as string,
      ngo_name: row.agency_name as string,
      verification_agency_id: row.agency_id as string,
      verification_agency_name: row.agency_name as string,
      assigned_at: row.created_at as string,
      verifier_id: null,
      verifier_name: row.assigned_verifier as string | null,
      submitted_date: row.created_at as string,
      status: mapDbStatus(row.verification_status as string),
      snapshot: null,
      field_audit_required: 'no',
      audit_date: row.audit_date as string | null,
      audit_notes: '',
      audit_form: null,
      audit_report: null,
      decision: null,
      decision_date: null,
      decision_notes: '',
      decision_verifier_name: null,
      digital_signature: null,
      blockchain_hash: null,
      carbon_passport: null,
      verification_certificate: null,
    };
  });
}

export async function getCompletedApplicationsForAgency(agencyId: string): Promise<VerificationApplication[]> {
  return getHistoryApplicationsForAgency(agencyId);
}

// ── Agency Profile Management (Supabase) ────────────────────

export type AgencyProfileUpdate = {
  name?: string;
  logo_url?: string | null;
  cover_image?: string | null;
  description?: string;
  mission?: string;
  vision?: string;
  founded_year?: number;
  headquarters?: string;
  operating_regions?: string[];
  countries_served?: string[];
  states_covered?: string[];
  districts?: string[];
  expertise?: string[];
  services?: string[];
  supported_ecosystems?: string[];
  certifications?: AgencyCertification[];
  website?: string;
  email?: string;
  phone?: string;
  social_links?: Record<string, string>;
  projects_certified?: number;
  active_applications?: number;
  avg_verification_days?: number;
  years_of_operation?: number;
  available_audit_teams?: number;
  estimated_review_days?: number;
  availability?: AgencyAvailability;
  verification_status?: 'active' | 'pending' | 'inactive';
  accepts_new_applications?: boolean;
  paused?: boolean;
  recent_projects?: AgencyRecentProject[];
};

export async function updateAgencyProfile(
  agencyId: string,
  updates: AgencyProfileUpdate,
): Promise<VerificationAgency | undefined> {
  const { data, error } = await supabase
    .from('verification_agencies')
    .update(updates)
    .eq('id', agencyId)
    .select()
    .single();

  if (error) {
    console.error('[VOC] Failed to update agency profile:', error);
    throw new Error(`Failed to update agency profile: ${error.message}`);
  }

  return data ? mapAgencyFromDb(data) : undefined;
}

export async function getAgencyByProfileId(profileId: string): Promise<VerificationAgency | undefined> {
  const { data } = await supabase
    .from('verification_agencies')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();
  return data ? mapAgencyFromDb(data) : undefined;
}

// ── Agency Service Catalog (Supabase) ───────────────────────

function mapServiceFromDb(row: Record<string, unknown>): AgencyService {
  return {
    id: row.id as string,
    agency_id: row.agency_id as string,
    name: row.name as string,
    description: (row.description as string) || '',
    category: row.category as AgencyServiceCategory,
    price: Number(row.price) || 0,
    currency: (row.currency as string) || 'USD',
    price_unit: row.price_unit as AgencyServicePriceUnit,
    estimated_duration_days: row.estimated_duration_days != null ? Number(row.estimated_duration_days) : null,
    is_active: Boolean(row.is_active),
    display_order: Number(row.display_order) || 0,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getAgencyServices(agencyId: string): Promise<AgencyService[]> {
  const { data } = await supabase
    .from('agency_services')
    .select('*')
    .eq('agency_id', agencyId)
    .order('display_order', { ascending: true });

  return (data || []).map(mapServiceFromDb);
}

export async function getActiveAgencyServices(agencyId: string): Promise<AgencyService[]> {
  const { data } = await supabase
    .from('agency_services')
    .select('*')
    .eq('agency_id', agencyId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  return (data || []).map(mapServiceFromDb);
}

export async function getAgencyService(id: string): Promise<AgencyService | undefined> {
  const { data } = await supabase
    .from('agency_services')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  return data ? mapServiceFromDb(data) : undefined;
}

export async function createAgencyService(params: {
  agency_id: string;
  name: string;
  description?: string;
  category: AgencyServiceCategory;
  price: number;
  currency?: string;
  price_unit?: AgencyServicePriceUnit;
  estimated_duration_days?: number | null;
  is_active?: boolean;
  display_order?: number;
}): Promise<AgencyService> {
  const { data, error } = await supabase
    .from('agency_services')
    .insert({
      agency_id: params.agency_id,
      name: params.name,
      description: params.description || '',
      category: params.category,
      price: params.price,
      currency: params.currency || 'USD',
      price_unit: params.price_unit || 'per_project',
      estimated_duration_days: params.estimated_duration_days ?? null,
      is_active: params.is_active ?? true,
      display_order: params.display_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error('[VOC] Failed to create agency service:', error);
    throw new Error(`Failed to create service: ${error.message}`);
  }

  return mapServiceFromDb(data);
}

export async function updateAgencyService(
  serviceId: string,
  updates: Partial<{
    name: string;
    description: string;
    category: AgencyServiceCategory;
    price: number;
    currency: string;
    price_unit: AgencyServicePriceUnit;
    estimated_duration_days: number | null;
    is_active: boolean;
    display_order: number;
  }>,
): Promise<AgencyService | undefined> {
  const { data, error } = await supabase
    .from('agency_services')
    .update(updates)
    .eq('id', serviceId)
    .select()
    .single();

  if (error) {
    console.error('[VOC] Failed to update agency service:', error);
    throw new Error(`Failed to update service: ${error.message}`);
  }

  return data ? mapServiceFromDb(data) : undefined;
}

export async function deleteAgencyService(serviceId: string): Promise<void> {
  const { error } = await supabase
    .from('agency_services')
    .delete()
    .eq('id', serviceId);

  if (error) {
    console.error('[VOC] Failed to delete agency service:', error);
    throw new Error(`Failed to delete service: ${error.message}`);
  }
}

export async function toggleAgencyServiceActive(serviceId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('agency_services')
    .update({ is_active: isActive })
    .eq('id', serviceId);

  if (error) {
    console.error('[VOC] Failed to toggle service:', error);
    throw new Error(`Failed to toggle service: ${error.message}`);
  }
}

export async function reorderAgencyServices(
  agencyId: string,
  serviceIds: string[],
): Promise<void> {
  const updates = serviceIds.map((id, index) =>
    supabase
      .from('agency_services')
      .update({ display_order: index })
      .eq('id', id)
      .eq('agency_id', agencyId)
  );

  await Promise.all(updates);
}

// ── Agency Recent Projects (from DB) ────────────────────────

export async function getRecentProjectsForAgency(agencyId: string): Promise<{ project_name: string; status: string; date: string }[]> {
  const { data } = await supabase
    .from('voc_agency_requests')
    .select('agency_name, verification_status, created_at, voc_requests!inner(project_name)')
    .eq('agency_id', agencyId)
    .eq('verification_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(10);

  return (data || []).map((row: Record<string, unknown>) => {
    const req = row.voc_requests as Record<string, unknown>;
    return {
      project_name: (req?.project_name as string) || 'Unknown Project',
      status: row.verification_status as string,
      date: row.created_at as string,
    };
  });
}

// ── All Applications for Dashboard (Supabase) ───────────────

export async function getAllApplicationsForDashboard(): Promise<VerificationApplication[]> {
  const { data } = await supabase
    .from('voc_agency_requests')
    .select('*, voc_requests!inner(project_id, project_name, project_owner_id, project_owner_name)');

  return (data || []).map((row: Record<string, unknown>) => {
    const req = row.voc_requests as Record<string, unknown>;
    return {
      id: row.id as string,
      application_number: row.request_id as string,
      project_id: (req?.project_id as string) || '',
      project_name: (req?.project_name as string) || '',
      project_owner_id: (req?.project_owner_id as string) || '',
      project_owner_name: (req?.project_owner_name as string) || '',
      ngo_id: row.agency_id as string,
      ngo_name: row.agency_name as string,
      verification_agency_id: row.agency_id as string,
      verification_agency_name: row.agency_name as string,
      assigned_at: row.created_at as string,
      verifier_id: null,
      verifier_name: row.assigned_verifier as string | null,
      submitted_date: row.created_at as string,
      status: mapDbStatus(row.verification_status as string),
      snapshot: null,
      field_audit_required: 'no',
      audit_date: row.audit_date as string | null,
      audit_notes: '',
      audit_form: null,
      audit_report: null,
      decision: null,
      decision_date: null,
      decision_notes: '',
      decision_verifier_name: null,
      digital_signature: null,
      blockchain_hash: null,
      carbon_passport: null,
      verification_certificate: null,
    };
  });
}

function mapDbStatus(dbStatus: string): ApplicationStatus {
  switch (dbStatus) {
    case 'waiting': return 'submitted';
    case 'returned': return 'returned_for_revision';
    case 'approved': return 'approved';
    case 'rejected': return 'rejected';
    case 'under_review': return 'under_review';
    case 'audit_scheduled': return 'audit_scheduled';
    case 'audit_completed': return 'audit_completed';
    default: return dbStatus as ApplicationStatus;
  }
}

// Backward-compat alias — now fetches ALL statuses from Supabase
export async function getApplications(): Promise<VerificationApplication[]> {
  return getAllApplicationsForDashboard();
}

// Old-style functions kept for backward compat (now query voc_agency_requests)
export async function submitApplication(_params: Record<string, unknown>): Promise<VerificationApplication> {
  throw new Error('submitApplication is deprecated. Use sendVerificationRequests instead.');
}

export function updateApplicationStatus(_id: string, _status: ApplicationStatus): void {
  throw new Error('updateApplicationStatus is deprecated. Use decideAgencyRequest instead.');
}

export function startReview(_id: string, _verifierId: string, _verifierName: string): void {
  throw new Error('startReview is deprecated. Use assignVerifierToAgency instead.');
}

export function scheduleAudit(_id: string, _fieldAuditRequired: FieldAuditRequired, _auditDate: string | null, _auditNotes: string): void {
  throw new Error('scheduleAudit is deprecated. Use scheduleAgencyAudit instead.');
}

export function submitAuditForm(_id: string, _formData: AuditFormData): void {
  throw new Error('submitAuditForm is deprecated. Use the new voc_audit_reports table directly.');
}

export function submitDecision(_id: string, _decision: VerificationDecision, _notes: string): void {
  throw new Error('submitDecision is deprecated. Use decideAgencyRequest instead.');
}

export function getActiveApplications(): VerificationApplication[] {
  throw new Error('getActiveApplications is now async. Use getActiveApplicationsForAgency instead.');
}

export function getCompletedApplications(): VerificationApplication[] {
  throw new Error('getCompletedApplications is now async. Use getCompletedApplicationsForAgency instead.');
}

export function getApplicationCount(): number {
  throw new Error('getApplicationCount is now async.');
}

// ── Document & Evidence Verification (JSONB on voc_agency_requests) ──

export type DocumentVerificationStatus = 'pending' | 'verified' | 'needs_clarification' | 'rejected';
export type EvidenceVerificationStatus = 'pending' | 'approved' | 'needs_new_upload' | 'rejected';

export interface DocumentVerificationEntry {
  docId: string;
  status: DocumentVerificationStatus;
  remarks: string;
  verified_by: string;
  verified_at: string;
}

export interface EvidenceVerificationEntry {
  itemId: string;
  status: EvidenceVerificationStatus;
  remarks: string;
  verified_by: string;
  verified_at: string;
}

export async function getDocumentVerifications(agencyRequestId: string): Promise<DocumentVerificationEntry[]> {
  const { data } = await supabase
    .from('voc_agency_requests')
    .select('document_verifications')
    .eq('id', agencyRequestId)
    .maybeSingle();

  return (data?.document_verifications as DocumentVerificationEntry[]) || [];
}

export async function getEvidenceVerifications(agencyRequestId: string): Promise<EvidenceVerificationEntry[]> {
  const { data } = await supabase
    .from('voc_agency_requests')
    .select('evidence_verifications')
    .eq('id', agencyRequestId)
    .maybeSingle();

  return (data?.evidence_verifications as EvidenceVerificationEntry[]) || [];
}

export async function updateDocumentVerification(
  agencyRequestId: string,
  docId: string,
  status: DocumentVerificationStatus,
  remarks: string,
  verifiedBy: string,
): Promise<void> {
  // Get current verifications
  const current = await getDocumentVerifications(agencyRequestId);
  const entry: DocumentVerificationEntry = {
    docId,
    status,
    remarks,
    verified_by: verifiedBy,
    verified_at: new Date().toISOString(),
  };

  // Upsert: replace existing entry for this docId or add new
  const filtered = current.filter(v => v.docId !== docId);
  const updated = [...filtered, entry];

  await supabase
    .from('voc_agency_requests')
    .update({ document_verifications: updated, last_updated: new Date().toISOString() })
    .eq('id', agencyRequestId);
}

export async function updateEvidenceVerification(
  agencyRequestId: string,
  itemId: string,
  status: EvidenceVerificationStatus,
  remarks: string,
  verifiedBy: string,
): Promise<void> {
  const current = await getEvidenceVerifications(agencyRequestId);
  const entry: EvidenceVerificationEntry = {
    itemId,
    status,
    remarks,
    verified_by: verifiedBy,
    verified_at: new Date().toISOString(),
  };

  const filtered = current.filter(v => v.itemId !== itemId);
  const updated = [...filtered, entry];

  await supabase
    .from('voc_agency_requests')
    .update({ evidence_verifications: updated, last_updated: new Date().toISOString() })
    .eq('id', agencyRequestId);
}

// ── Enhanced Decision with Metadata ────────────────────────

export async function submitDecisionWithMetadata(params: {
  requestId: string;
  agencyId: string;
  agencyName?: string;
  decision: 'approved' | 'returned' | 'rejected';
  decisionNotes: string;
  decisionVerifierName: string;
  digitalSignature?: string;
  blockchainHash?: string;
  projectId: string;
  projectName: string;
  snapshot?: ProjectSnapshot | null;
  auditReport?: AuditReport | null;
  verifiedMetrics?: Record<string, unknown>;
}): Promise<void> {
  const dbUpdates: Record<string, unknown> = {
    verification_status: params.decision,
    decision_notes: params.decisionNotes,
    decision_verifier_name: params.decisionVerifierName,
    digital_signature: params.digitalSignature || null,
    blockchain_hash: params.blockchainHash || null,
    last_updated: new Date().toISOString(),
  };

  if (params.verifiedMetrics) {
    dbUpdates.verified_metrics = params.verifiedMetrics;
  }

  await supabase
    .from('voc_agency_requests')
    .update(dbUpdates)
    .eq('request_id', params.requestId)
    .eq('agency_id', params.agencyId);

  // Notify project owner
  const { data: req } = await supabase
    .from('voc_requests')
    .select('project_owner_id, project_name')
    .eq('id', params.requestId)
    .single();

  if (req) {
    const labelMap = { approved: 'Approved', returned: 'Returned for Revision', rejected: 'Rejected' };
    await sendNotification({
      title: `Project ${labelMap[params.decision]}`,
      body: `Your project "${params.projectName}" has been ${labelMap[params.decision].toLowerCase()} by the verification agency.`,
      type: `project_${params.decision}`,
      targetUserId: req.project_owner_id,
    });
  }

  // Log activity
  await logActivity({
    projectId: params.projectId,
    eventType: `verification_application_${params.decision === 'returned' ? 'returned' : params.decision}`,
    title: `Project ${label(params.decision)}`,
    description: `Verification ${params.decision} for "${params.projectName}". ${params.decisionNotes}`,
    actorName: params.decisionVerifierName,
    actorRole: 'Verifier',
    metadata: {
      decision: params.decision,
      decision_notes: params.decisionNotes,
      has_metrics: !!params.verifiedMetrics,
    },
  });

  // Update project status based on decision
  if (params.projectId) {
    const projectUpdates: Record<string, unknown> = {};

    if (params.decision === 'approved') {
      projectUpdates.verification_status = 'approved';
      projectUpdates.status = 'verified';

      // Sync verified metrics to project
      if (params.verifiedMetrics) {
        const vm = params.verifiedMetrics;
        if (typeof vm.area_hectares === 'number') projectUpdates.verified_area_hectares = vm.area_hectares;
        if (typeof vm.tree_count === 'number') projectUpdates.verified_tree_count = vm.tree_count;
        if (typeof vm.species_count === 'number') projectUpdates.verified_species_count = vm.species_count;
        if (typeof vm.carbon_sequestration === 'number') projectUpdates.verified_carbon_tonnes = vm.carbon_sequestration;
        if (typeof vm.biomass_carbon === 'number') projectUpdates.verified_biomass_carbon = vm.biomass_carbon;
        if (typeof vm.soil_organic_carbon === 'number') projectUpdates.verified_soil_organic_carbon = vm.soil_organic_carbon;
        if (typeof vm.biodiversity_index === 'number') projectUpdates.verified_biodiversity_index = vm.biodiversity_index;
        if (typeof vm.ecosystem_health === 'string') projectUpdates.verified_ecosystem_health = vm.ecosystem_health;
      }
    } else if (params.decision === 'returned') {
      projectUpdates.verification_status = 'pending';
    } else if (params.decision === 'rejected') {
      projectUpdates.verification_status = 'rejected';
    }

    if (Object.keys(projectUpdates).length > 0) {
      await supabase.from('projects').update(projectUpdates).eq('id', params.projectId);
    }
  }

  // Update voc_requests status to match decision
  const requestStatusMap = { approved: 'approved', returned: 'returned', rejected: 'rejected' };
  await supabase
    .from('voc_requests')
    .update({ verification_status: requestStatusMap[params.decision] })
    .eq('id', params.requestId);

  // On approve: create official records
  if (params.decision === 'approved') {
    // Create verification certificate official record
    await supabase.from('voc_official_records').insert({
      request_id: params.requestId,
      record_type: 'verification_certificate',
      title: 'Verification Certificate',
      description: `Verification Certificate for "${params.projectName}" — Approved by ${params.decisionVerifierName}`,
      verifier_name: params.decisionVerifierName,
      ngo_name: params.agencyName || '',
      file_name: `verification-certificate-${params.requestId}.pdf`,
    });

    // Create audit report official record if audit exists
    if (params.auditReport) {
      await supabase.from('voc_official_records').insert({
        request_id: params.requestId,
        record_type: 'audit_report',
        title: 'Audit Report',
        description: `Field audit report for "${params.projectName}" — Area: ${params.auditReport.area_verified.toLocaleString()} m², Trees: ${params.auditReport.tree_count.toLocaleString()}`,
        verifier_name: params.auditReport.auditor_name,
        ngo_name: '',
        file_name: `audit-report-${params.requestId}.pdf`,
      });
    }
  }

  function label(d: string) { return d === 'approved' ? 'Approved' : d === 'returned' ? 'Returned for Revision' : 'Rejected'; }
}
