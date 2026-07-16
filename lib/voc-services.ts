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
  SnapshotDocumentCategory,
  SnapshotEvidence,
} from './voc-types';

const STORAGE_KEY = 'carbonrush_voc_applications';
const RECORDS_KEY = 'carbonrush_voc_records';
const REPORTS_KEY = 'carbonrush_voc_reports';

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

export function getCompletedApplications(): VerificationApplication[] {
  return applications.filter(a =>
    ['approved', 'returned_for_revision', 'rejected'].includes(a.status)
  );
}

export function getApplicationCount(): number {
  return applications.length;
}

// ── Submit Application (Bug 1 + Bug 2) ──────────────────────
export function submitApplication(params: {
  projectId: string;
  projectName: string;
  projectOwnerId: string;
  projectOwnerName: string;
  ngoId: string;
  ngoName: string;
  snapshot: ProjectSnapshot;
  additionalDocuments?: SnapshotDocument[];
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
  return app;
}

// ── Status Updates ──────────────────────────────────────────
export function updateApplicationStatus(id: string, status: ApplicationStatus): void {
  applications = applications.map(a => a.id === id ? { ...a, status } : a);
  persistApps();
}

export function startReview(id: string, verifierId: string, verifierName: string): void {
  applications = applications.map(a => a.id === id ? {
    ...a,
    status: 'under_review' as ApplicationStatus,
    verifier_id: verifierId,
    verifier_name: verifierName,
  } : a);
  persistApps();
}

// ── Audit Scheduling ────────────────────────────────────────
export function scheduleAudit(
  id: string,
  fieldAuditRequired: FieldAuditRequired,
  auditDate: string | null,
  auditNotes: string,
): void {
  applications = applications.map(a => a.id === id ? {
    ...a,
    field_audit_required: fieldAuditRequired,
    audit_date: auditDate,
    audit_notes: auditNotes,
    status: fieldAuditRequired === 'yes' && auditDate
      ? 'audit_scheduled' as ApplicationStatus
      : a.status,
  } : a);
  persistApps();
}

// ── Audit Form Submission ───────────────────────────────────
export function submitAuditForm(id: string, formData: AuditFormData): void {
  const app = applications.find(a => a.id === id);
  if (!app) return;

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
}

// ── Final Decision ──────────────────────────────────────────
export function submitDecision(
  id: string,
  decision: VerificationDecision,
  notes: string,
): void {
  const app = applications.find(a => a.id === id);
  if (!app) return;

  const verifierName = app.verifier_name || 'Unknown Verifier';
  const sig = `SIG-${verifierName.split(' ').pop()?.toUpperCase()}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`;

  const statusMap: Record<VerificationDecision, ApplicationStatus> = {
    approve: 'approved',
    return_for_revision: 'returned_for_revision',
    reject: 'rejected',
  };

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
