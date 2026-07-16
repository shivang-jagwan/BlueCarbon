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
} from './voc-types';
import { MOCK_VERIFICATION_AGENCIES } from './voc-mock-data';

const STORAGE_KEY = 'carbonrush_voc_applications';
const RECORDS_KEY = 'carbonrush_voc_records';
const REPORTS_KEY = 'carbonrush_voc_reports';
const NOTIFICATIONS_KEY = 'carbonrush_voc_notifications';
const ACTIVITY_KEY = 'carbonrush_voc_activity';

function loadFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(key: string, data: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* noop */ }
}

// ── In-memory store (hydrated from localStorage) ────────────
let applications: VerificationApplication[] = loadFromStorage(STORAGE_KEY);
let auditReports: AuditReport[] = loadFromStorage(REPORTS_KEY);
let officialRecords: OfficialRecord[] = loadFromStorage(RECORDS_KEY);

function persistApps() { saveToStorage(STORAGE_KEY, applications); }
function persistReports() { saveToStorage(REPORTS_KEY, auditReports); }
function persistRecords() { saveToStorage(RECORDS_KEY, officialRecords); }

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

function validateTransition(from: ApplicationStatus, to: ApplicationStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid state transition: ${from} → ${to}. Allowed: ${VALID_TRANSITIONS[from]?.join(', ') || 'none'}`);
  }
}

// ── Notifications (localStorage) ────────────────────────────
export interface VocabNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  target_user_id: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

let notifications: VocabNotification[] = loadFromStorage(NOTIFICATIONS_KEY);
function persistNotifications() { saveToStorage(NOTIFICATIONS_KEY, notifications); }

export function sendNotification(params: {
  title: string;
  body: string;
  type: string;
  targetUserId: string;
  link?: string;
}): VocabNotification {
  const n: VocabNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: params.title,
    body: params.body,
    type: params.type,
    target_user_id: params.targetUserId,
    link: params.link || null,
    read: false,
    created_at: new Date().toISOString(),
  };
  notifications = [n, ...notifications];
  persistNotifications();
  return n;
}

export function sendNotifications(params: {
  title: string;
  body: string;
  type: string;
  targetUserIds: string[];
  link?: string;
}): void {
  for (const uid of params.targetUserIds) {
    sendNotification({
      title: params.title,
      body: params.body,
      type: params.type,
      targetUserId: uid,
      link: params.link,
    });
  }
}

export function getNotificationsForUser(userId: string): VocabNotification[] {
  return notifications.filter(n => n.target_user_id === userId);
}

export function getUnreadNotificationCount(userId: string): number {
  return notifications.filter(n => n.target_user_id === userId && !n.read).length;
}

export function markNotificationRead(id: string): void {
  notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
  persistNotifications();
}

// ── Activity Log (localStorage) ─────────────────────────────
export interface VocabActivity {
  id: string;
  project_id: string;
  event_type: string;
  title: string;
  description: string;
  actor_name: string | null;
  actor_role: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

let activityLog: VocabActivity[] = loadFromStorage(ACTIVITY_KEY);
function persistActivity() { saveToStorage(ACTIVITY_KEY, activityLog); }

export function logActivity(params: {
  projectId: string;
  eventType: string;
  title: string;
  description?: string;
  actorName?: string;
  actorRole?: string;
  metadata?: Record<string, unknown>;
}): VocabActivity {
  const a: VocabActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    project_id: params.projectId,
    event_type: params.eventType,
    title: params.title,
    description: params.description || '',
    actor_name: params.actorName || null,
    actor_role: params.actorRole || null,
    metadata: params.metadata || null,
    created_at: new Date().toISOString(),
  };
  activityLog = [a, ...activityLog];
  persistActivity();
  return a;
}

export function getActivityForProject(projectId: string): VocabActivity[] {
  return activityLog.filter(a => a.project_id === projectId);
}

// ── Verification Agencies ───────────────────────────────────
export function getVerificationAgencies(): VerificationAgency[] {
  return MOCK_VERIFICATION_AGENCIES;
}

export function getVerificationAgency(id: string): VerificationAgency | undefined {
  return MOCK_VERIFICATION_AGENCIES.find(a => a.id === id);
}

export function getAgencyForProfile(profileId: string): VerificationAgency | undefined {
  return MOCK_VERIFICATION_AGENCIES.find(a => a.profile_id === profileId);
}

// ── Queries ─────────────────────────────────────────────────
export function getApplications(): VerificationApplication[] {
  return applications;
}

export function getApplication(id: string): VerificationApplication | undefined {
  return applications.find(a => a.id === id);
}

export function getApplicationsByStatus(status: ApplicationStatus): VerificationApplication[] {
  return applications.filter(a => a.status === status);
}

export function getApplicationsForProject(projectId: string): VerificationApplication[] {
  return applications.filter(a => a.project_id === projectId);
}

export function getApplicationsForAgency(agencyId: string): VerificationApplication[] {
  return applications.filter(a => a.verification_agency_id === agencyId);
}

export function getActiveApplicationForProject(projectId: string): VerificationApplication | undefined {
  return applications.find(a =>
    a.project_id === projectId &&
    ['submitted', 'under_review', 'audit_scheduled', 'audit_completed'].includes(a.status)
  );
}

export function hasActiveApplication(projectId: string): boolean {
  return getActiveApplicationForProject(projectId) !== undefined;
}

export function getActiveApplications(): VerificationApplication[] {
  return applications.filter(a =>
    ['submitted', 'under_review', 'audit_scheduled', 'audit_completed'].includes(a.status)
  );
}

export function getActiveApplicationsForAgency(agencyId: string): VerificationApplication[] {
  return applications.filter(a =>
    a.verification_agency_id === agencyId &&
    ['submitted', 'under_review', 'audit_scheduled', 'audit_completed'].includes(a.status)
  );
}

export function getCompletedApplications(): VerificationApplication[] {
  return applications.filter(a =>
    ['approved', 'returned_for_revision', 'rejected'].includes(a.status)
  );
}

export function getCompletedApplicationsForAgency(agencyId: string): VerificationApplication[] {
  return applications.filter(a =>
    a.verification_agency_id === agencyId &&
    ['approved', 'returned_for_revision', 'rejected'].includes(a.status)
  );
}

export function getApplicationCount(): number {
  return applications.length;
}

// ── Submit Application ──────────────────────────────────────
export function submitApplication(params: {
  projectId: string;
  projectName: string;
  projectOwnerId: string;
  projectOwnerName: string;
  ngoId: string;
  ngoName: string;
  verificationAgencyId: string;
  verificationAgencyName: string;
  snapshot: ProjectSnapshot;
  additionalDocuments?: SnapshotDocument[];
  ownerUserId?: string;
  agencyUserIds?: string[];
}): VerificationApplication {
  const appNumber = `APP-${new Date().getFullYear()}-${String(applications.length + 1).padStart(5, '0')}`;

  const allDocuments = [...params.snapshot.documents];
  if (params.additionalDocuments) {
    allDocuments.push(...params.additionalDocuments);
  }

  const app: VerificationApplication = {
    id: `va-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    application_number: appNumber,
    project_id: params.projectId,
    project_name: params.projectName,
    project_owner_id: params.projectOwnerId,
    project_owner_name: params.projectOwnerName,
    ngo_id: params.ngoId,
    ngo_name: params.ngoName,
    verification_agency_id: params.verificationAgencyId,
    verification_agency_name: params.verificationAgencyName,
    assigned_at: new Date().toISOString(),
    verifier_id: null,
    verifier_name: null,
    submitted_date: new Date().toISOString(),
    status: 'submitted',
    snapshot: {
      ...params.snapshot,
      documents: allDocuments,
      captured_at: new Date().toISOString(),
    },
    field_audit_required: 'no',
    audit_date: null,
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

  applications = [app, ...applications];
  persistApps();

  // Log activity
  logActivity({
    projectId: params.projectId,
    eventType: 'verification_application_submitted',
    title: 'Verification Application Submitted',
    description: `Application ${appNumber} submitted to ${params.verificationAgencyName}`,
    actorName: params.projectOwnerName,
    actorRole: 'Project Owner',
    metadata: { application_number: appNumber, agency_name: params.verificationAgencyName },
  });

  // Send notifications
  const targetIds: string[] = [];
  if (params.ownerUserId) targetIds.push(params.ownerUserId);
  if (params.agencyUserIds) targetIds.push(...params.agencyUserIds);
  if (targetIds.length > 0) {
    sendNotifications({
      title: 'Verification Application Submitted',
      body: `Application ${appNumber} for "${params.projectName}" has been submitted to ${params.verificationAgencyName}.`,
      type: 'verification_submitted',
      targetUserIds: targetIds,
      link: `/dashboard/verification/workspace/${app.id}`,
    });
  }

  return app;
}

// ── Status Updates ──────────────────────────────────────────
export function updateApplicationStatus(id: string, status: ApplicationStatus): void {
  const app = applications.find(a => a.id === id);
  if (app) validateTransition(app.status, status);
  applications = applications.map(a => a.id === id ? { ...a, status } : a);
  persistApps();
}

export function startReview(id: string, verifierId: string, verifierName: string): void {
  const app = applications.find(a => a.id === id);
  if (!app) return;
  validateTransition(app.status, 'under_review');

  applications = applications.map(a => a.id === id ? {
    ...a,
    status: 'under_review' as ApplicationStatus,
    verifier_id: verifierId,
    verifier_name: verifierName,
  } : a);
  persistApps();

  // Log activity
  logActivity({
    projectId: app.project_id,
    eventType: 'verification_application_under_review',
    title: 'Application Under Review',
    description: `Application ${app.application_number} review started by ${verifierName}`,
    actorName: verifierName,
    actorRole: 'Verifier',
    metadata: { application_number: app.application_number },
  });

  // Send notifications
  sendNotifications({
    title: 'Review Started',
    body: `Your application ${app.application_number} for "${app.project_name}" is now under review by ${verifierName}.`,
    type: 'verification_under_review',
    targetUserIds: [app.project_owner_id],
    link: `/dashboard/projects/${app.project_id}/verification/view/${app.id}`,
  });
}

// ── Audit Scheduling ────────────────────────────────────────
export function scheduleAudit(
  id: string,
  fieldAuditRequired: FieldAuditRequired,
  auditDate: string | null,
  auditNotes: string,
): void {
  const app = applications.find(a => a.id === id);
  if (!app) return;

  const newStatus: ApplicationStatus =
    fieldAuditRequired === 'yes' && auditDate ? 'audit_scheduled' : app.status;

  if (newStatus !== app.status) {
    validateTransition(app.status, newStatus);
  }

  applications = applications.map(a => a.id === id ? {
    ...a,
    field_audit_required: fieldAuditRequired,
    audit_date: auditDate,
    audit_notes: auditNotes,
    status: newStatus,
  } : a);
  persistApps();

  if (newStatus === 'audit_scheduled') {
    logActivity({
      projectId: app.project_id,
      eventType: 'verification_audit_scheduled',
      title: 'Audit Scheduled',
      description: `Field audit scheduled for ${auditDate || 'TBD'}`,
      actorName: app.verifier_name || 'Verifier',
      actorRole: 'Verifier',
      metadata: { application_number: app.application_number, audit_date: auditDate },
    });

    sendNotifications({
      title: 'Audit Scheduled',
      body: `A field audit for "${app.project_name}" has been scheduled for ${auditDate || 'TBD'}.`,
      type: 'verification_audit_scheduled',
      targetUserIds: [app.project_owner_id],
      link: `/dashboard/projects/${app.project_id}/verification/view/${app.id}`,
    });
  }
}

// ── Audit Form Submission ───────────────────────────────────
export function submitAuditForm(id: string, formData: AuditFormData): void {
  const app = applications.find(a => a.id === id);
  if (!app) return;

  validateTransition(app.status, 'audit_completed');

  const report: AuditReport = {
    id: `report-${Date.now()}`,
    application_id: id,
    project_name: app.project_name,
    auditor_name: app.verifier_name || 'Unknown',
    audit_date: formData.completed_at,
    area_verified: formData.area_verified_sqm,
    tree_count: formData.tree_count,
    species_count: formData.species_count,
    site_condition: formData.site_condition,
    gps_validated: formData.gps_validated,
    gps_coordinates: formData.gps_coordinates,
    photos_count: formData.photos_uploaded,
    videos_count: formData.videos_uploaded,
    remarks: formData.remarks,
    final_observation: formData.final_observation,
    generated_at: new Date().toISOString(),
  };

  applications = applications.map(a => a.id === id ? {
    ...a,
    audit_form: formData,
    audit_report: report,
    status: 'audit_completed' as ApplicationStatus,
  } : a);

  auditReports = [report, ...auditReports];
  persistApps();
  persistReports();

  logActivity({
    projectId: app.project_id,
    eventType: 'verification_audit_completed',
    title: 'Audit Completed',
    description: `Field audit for "${app.project_name}" completed`,
    actorName: app.verifier_name || 'Verifier',
    actorRole: 'Verifier',
    metadata: { application_number: app.application_number },
  });
}

// ── Final Decision ──────────────────────────────────────────
export function submitDecision(
  id: string,
  decision: VerificationDecision,
  notes: string,
): void {
  const app = applications.find(a => a.id === id);
  if (!app) return;

  const statusMap: Record<VerificationDecision, ApplicationStatus> = {
    approve: 'approved',
    return_for_revision: 'returned_for_revision',
    reject: 'rejected',
  };

  validateTransition(app.status, statusMap[decision]);

  const verifierName = app.verifier_name || 'Unknown Verifier';
  const sig = `SIG-${verifierName.split(' ').pop()?.toUpperCase()}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;

  let updatedApp: VerificationApplication = {
    ...app,
    status: statusMap[decision],
    decision,
    decision_date: new Date().toISOString(),
    decision_notes: notes,
    decision_verifier_name: verifierName,
    digital_signature: sig,
    blockchain_hash: `0x${Math.random().toString(16).slice(2, 6)}...pending`,
  };

  if (decision === 'approve') {
    updatedApp.verification_certificate = {
      id: `cert-${Date.now()}`,
      certificate_number: `CERT-${app.application_number.replace('APP-', '')}`,
      application_id: id,
      project_name: app.project_name,
      project_owner: app.project_owner_name,
      ngo: app.ngo_name,
      verifier: verifierName,
      decision: 'approve',
      issued_date: new Date().toISOString(),
      verified_documents: app.snapshot.documents.map(d => d.name),
      reviewer_notes: notes,
      digital_signature: sig,
      blockchain_hash: updatedApp.blockchain_hash || '0x...pending',
    };

    updatedApp.carbon_passport = {
      id: `passport-${Date.now()}`,
      passport_number: `CP-${app.application_number.replace('APP-', '')}`,
      application_id: id,
      project_name: app.project_name,
      project_owner: app.project_owner_name,
      ngo: app.ngo_name,
      carbon_credits_tonnes: Math.round(app.snapshot.estimated_carbon_sequestration * 0.85),
      methodology: app.snapshot.methodology,
      valid_from: new Date().toISOString(),
      valid_until: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      issued_date: new Date().toISOString(),
      issued_by: verifierName,
      digital_signature: sig,
      blockchain_hash: updatedApp.blockchain_hash || '0x...pending',
    };
  }

  applications = applications.map(a => a.id === id ? updatedApp : a);

  if (decision === 'approve' && updatedApp.verification_certificate && updatedApp.carbon_passport) {
    const records: OfficialRecord[] = [
      {
        id: `rec-${Date.now()}-cert`,
        application_id: id,
        record_type: 'verification_certificate',
        title: `Verification Certificate — ${app.project_name}`,
        description: `Certificate ${updatedApp.verification_certificate.certificate_number} issued`,
        created_date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        verifier_name: verifierName,
        ngo_name: app.ngo_name,
        status: 'active',
        file_name: `${updatedApp.verification_certificate.certificate_number}.pdf`,
      },
      {
        id: `rec-${Date.now()}-passport`,
        application_id: id,
        record_type: 'carbon_passport',
        title: `Carbon Passport — ${app.project_name}`,
        description: `Passport ${updatedApp.carbon_passport.passport_number} — ${updatedApp.carbon_passport.carbon_credits_tonnes} tCO₂e`,
        created_date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        verifier_name: verifierName,
        ngo_name: app.ngo_name,
        status: 'active',
        file_name: `${updatedApp.carbon_passport.passport_number}.pdf`,
      },
    ];
    if (app.audit_report) {
      records.push({
        id: `rec-${Date.now()}-audit`,
        application_id: id,
        record_type: 'audit_report',
        title: `Audit Report — ${app.project_name}`,
        description: `Field audit completed by ${verifierName}`,
        created_date: new Date().toISOString(),
        timestamp: app.audit_report.generated_at,
        verifier_name: verifierName,
        ngo_name: app.ngo_name,
        status: 'active',
        file_name: `AUDIT-${app.application_number.replace('APP-', '')}.pdf`,
      });
    }
    officialRecords = [...records, ...officialRecords];
    persistRecords();
  }

  persistApps();

  // ── Activity + Notifications for decision ─────────────────
  const eventTypeMap: Record<VerificationDecision, string> = {
    approve: 'verification_application_approved',
    return_for_revision: 'verification_application_returned',
    reject: 'verification_application_rejected',
  };
  const titleMap: Record<VerificationDecision, string> = {
    approve: 'Verification Application Approved',
    return_for_revision: 'Application Returned for Revision',
    reject: 'Verification Application Rejected',
  };
  const descMap: Record<VerificationDecision, string> = {
    approve: `Application ${app.application_number} approved. Carbon Passport and Certificate issued.`,
    return_for_revision: `Application ${app.application_number} returned for revision.`,
    reject: `Application ${app.application_number} rejected.`,
  };

  logActivity({
    projectId: app.project_id,
    eventType: eventTypeMap[decision],
    title: titleMap[decision],
    description: descMap[decision],
    actorName: verifierName,
    actorRole: 'Verifier',
    metadata: { application_number: app.application_number, decision },
  });

  sendNotifications({
    title: titleMap[decision],
    body: descMap[decision],
    type: decision === 'approve' ? 'verification_approved' : decision === 'return_for_revision' ? 'verification_returned' : 'verification_rejected',
    targetUserIds: [app.project_owner_id],
    link: `/dashboard/projects/${app.project_id}/verification/view/${app.id}`,
  });

  if (decision === 'approve') {
    sendNotifications({
      title: 'Carbon Passport Generated',
      body: `A Carbon Passport (${updatedApp.carbon_passport?.passport_number}) has been issued for "${app.project_name}".`,
      type: 'carbon_passport_generated',
      targetUserIds: [app.project_owner_id],
      link: `/dashboard/projects/${app.project_id}/verification/view/${app.id}`,
    });

    logActivity({
      projectId: app.project_id,
      eventType: 'carbon_passport_issued',
      title: 'Carbon Passport Issued',
      description: `Carbon Passport ${updatedApp.carbon_passport?.passport_number} issued — ${updatedApp.carbon_passport?.carbon_credits_tonnes} tCO₂e`,
      actorName: verifierName,
      actorRole: 'Verifier',
      metadata: {
        passport_number: updatedApp.carbon_passport?.passport_number,
        carbon_credits: updatedApp.carbon_passport?.carbon_credits_tonnes,
      },
    });
  }
}

// ── Official Records ────────────────────────────────────────
export function getOfficialRecords(): OfficialRecord[] {
  return officialRecords;
}

export function getOfficialRecordsForProject(projectId: string): OfficialRecord[] {
  const appIds = applications.filter(a => a.project_id === projectId).map(a => a.id);
  return officialRecords.filter(r => appIds.includes(r.application_id));
}

// ── Audit Reports ───────────────────────────────────────────
export function getAuditReports(): AuditReport[] {
  return auditReports;
}

export function getAuditReportForApplication(applicationId: string): AuditReport | undefined {
  return auditReports.find(r => r.application_id === applicationId);
}

// ── History ─────────────────────────────────────────────────
export function getHistoryApplications(): VerificationApplication[] {
  return applications.filter(a =>
    ['approved', 'returned_for_revision', 'rejected'].includes(a.status)
  );
}

export function getHistoryApplicationsForAgency(agencyId: string): VerificationApplication[] {
  return applications.filter(a =>
    a.verification_agency_id === agencyId &&
    ['approved', 'returned_for_revision', 'rejected'].includes(a.status)
  );
}
