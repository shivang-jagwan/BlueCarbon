// ============================================================
// VERIFICATION OPERATIONS CENTER (VOC) — Types
// Version 3: Application-Based Verification Architecture
// ============================================================

// ── Application Status ──────────────────────────────────────
export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'audit_scheduled'
  | 'audit_completed'
  | 'approved'
  | 'returned_for_revision'
  | 'rejected';

export type VerificationDecision = 'approve' | 'return_for_revision' | 'reject';

export type FieldAuditRequired = 'yes' | 'no';

// ── Document Categories ─────────────────────────────────────
export type SnapshotDocumentCategory =
  | 'project_details'
  | 'project_metadata'
  | 'land_ownership'
  | 'government_approval'
  | 'environmental_clearance'
  | 'ground_images'
  | 'drone_images'
  | 'supporting_files'
  | 'evidence'
  | 'other';

// ── Verification Agency (NGO) ──────────────────────────────
export type AgencyAvailability = 'accepting' | 'limited' | 'fully_booked';
export type SortOption = 'experience' | 'projects' | 'speed' | 'newest' | 'alphabetical';

export interface AgencyCertification {
  name: string;
  icon?: string;
}

export interface AgencyRecentProject {
  project_name: string;
  status: 'approved' | 'returned' | 'rejected';
  date: string;
}

export interface VerificationAgency {
  id: string;
  profile_id: string;
  name: string;
  logo_url: string | null;
  registration_number: string;
  description: string;
  mission: string;
  founded_year: number;
  headquarters: string;
  operating_regions: string[];
  countries_served: string[];
  states_covered: string[];
  expertise: string[];
  services: string[];
  supported_ecosystems: string[];
  certifications: AgencyCertification[];
  // Capacity metrics
  projects_certified: number;
  active_applications: number;
  avg_verification_days: number;
  years_of_operation: number;
  available_audit_teams: number;
  estimated_review_days: number;
  // Availability
  availability: AgencyAvailability;
  verification_status: 'active' | 'pending' | 'inactive';
  // Fields for future architecture
  profile_id_internal: string;
  verifier_ids: string[];
  audit_team_ids: string[];
  regional_office_ids: string[];
  accepts_new_applications: boolean;
  paused: boolean;
  // Recent projects
  recent_projects: AgencyRecentProject[];
}

// ── Verification Application ────────────────────────────────
export interface VerificationApplication {
  id: string;
  application_number: string;
  project_id: string;
  project_name: string;
  project_owner_id: string;
  project_owner_name: string;
  ngo_id: string;
  ngo_name: string;
  verification_agency_id: string;
  verification_agency_name: string;
  assigned_at: string | null;
  verifier_id: string | null;
  verifier_name: string | null;
  submitted_date: string;
  status: ApplicationStatus;
  snapshot: ProjectSnapshot;
  // Audit
  field_audit_required: FieldAuditRequired;
  audit_date: string | null;
  audit_notes: string;
  audit_form: AuditFormData | null;
  audit_report: AuditReport | null;
  // Decision
  decision: VerificationDecision | null;
  decision_date: string | null;
  decision_notes: string;
  decision_verifier_name: string | null;
  digital_signature: string | null;
  blockchain_hash: string | null;
  // Generated artifacts (on approval)
  carbon_passport: CarbonPassport | null;
  verification_certificate: VerificationCertificate | null;
}

// ── Project Snapshot (Frozen at submission) ─────────────────
export interface ProjectSnapshot {
  project_name: string;
  project_type: string;
  location: string;
  latitude: number;
  longitude: number;
  area_hectares: number;
  description: string;
  methodology: string;
  start_date: string;
  target_end_date: string;
  estimated_carbon_sequestration: number;
  ngo_name: string;
  owner_name: string;
  owner_email: string;
  owner_organization: string;
  documents: SnapshotDocument[];
  ground_images: SnapshotDocument[];
  drone_images: SnapshotDocument[];
  supporting_files: SnapshotDocument[];
  evidence_items: SnapshotEvidence[];
  captured_at: string;
}

// ── Snapshot Document ───────────────────────────────────────
export interface SnapshotDocument {
  id: string;
  name: string;
  category: SnapshotDocumentCategory;
  file_type: string;
  file_size: string;
  uploaded_date: string;
  quality_score: number;
  gps_available: boolean;
  metadata_available: boolean;
  ai_summary: AIAnalysisSummary;
}

export interface SnapshotEvidence {
  id: string;
  title: string;
  description: string;
  type: string;
  location: string;
  date_collected: string;
}

// ── AI Analysis ─────────────────────────────────────────────
export interface AIAnalysisSummary {
  confidence_score: number;
  missing_documents: string[];
  quality_issues: string[];
  duplicate_detected: boolean;
  gps_metadata: boolean;
  image_metadata: boolean;
  overall_assessment: string;
}

// ── Audit Form ──────────────────────────────────────────────
export interface AuditFormData {
  area_verified_sqm: number;
  tree_count: number;
  species_count: number;
  site_condition: 'excellent' | 'good' | 'fair' | 'poor';
  gps_validated: boolean;
  gps_coordinates: string;
  photos_uploaded: number;
  videos_uploaded: number;
  remarks: string;
  final_observation: string;
  completed_at: string;
}

// ── Audit Report ────────────────────────────────────────────
export interface AuditReport {
  id: string;
  application_id: string;
  project_name: string;
  auditor_name: string;
  audit_date: string;
  area_verified: number;
  tree_count: number;
  species_count: number;
  site_condition: string;
  gps_validated: boolean;
  gps_coordinates: string;
  photos_count: number;
  videos_count: number;
  remarks: string;
  final_observation: string;
  generated_at: string;
}

// ── Carbon Passport ─────────────────────────────────────────
export interface CarbonPassport {
  id: string;
  passport_number: string;
  application_id: string;
  project_name: string;
  project_owner: string;
  ngo: string;
  carbon_credits_tonnes: number;
  methodology: string;
  valid_from: string;
  valid_until: string;
  issued_date: string;
  issued_by: string;
  digital_signature: string;
  blockchain_hash: string;
}

// ── Verification Certificate ────────────────────────────────
export interface VerificationCertificate {
  id: string;
  certificate_number: string;
  application_id: string;
  project_name: string;
  project_owner: string;
  ngo: string;
  verifier: string;
  decision: VerificationDecision;
  issued_date: string;
  verified_documents: string[];
  reviewer_notes: string;
  digital_signature: string;
  blockchain_hash: string;
}

// ── Official Record ─────────────────────────────────────────
export interface OfficialRecord {
  id: string;
  application_id: string;
  record_type: 'carbon_passport' | 'verification_certificate' | 'audit_report' | 'ngo_approval' | 'supporting_document' | 'verification_history';
  title: string;
  description: string;
  created_date: string;
  timestamp: string;
  verifier_name: string;
  ngo_name: string;
  status: 'active' | 'archived';
  file_name: string;
}

// ── Analytics ───────────────────────────────────────────────
export interface VOCAnalytics {
  total_applications: number;
  approval_rate: number;
  avg_verification_time_hours: number;
  rejected_count: number;
  returned_count: number;
  audit_completion_rate: number;
  by_status: { status: string; count: number }[];
  by_month: { month: string; approved: number; rejected: number; returned: number }[];
}

// ── Calendar Event ──────────────────────────────────────────
export interface VOCCalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'audit' | 'review' | 'deadline' | 'completed';
  application_id: string;
  project_name: string;
}

// ── Label Maps ──────────────────────────────────────────────
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  audit_scheduled: 'Audit Scheduled',
  audit_completed: 'Audit Completed',
  approved: 'Approved',
  returned_for_revision: 'Returned for Revision',
  rejected: 'Rejected',
};

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-indigo-100 text-indigo-700',
  audit_scheduled: 'bg-purple-100 text-purple-700',
  audit_completed: 'bg-cyan-100 text-cyan-700',
  approved: 'bg-emerald-100 text-emerald-700',
  returned_for_revision: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
};

export const APPLICATION_STATUS_DOT_COLORS: Record<ApplicationStatus, string> = {
  draft: 'bg-slate-400',
  submitted: 'bg-blue-500',
  under_review: 'bg-indigo-500',
  audit_scheduled: 'bg-purple-500',
  audit_completed: 'bg-cyan-500',
  approved: 'bg-emerald-500',
  returned_for_revision: 'bg-amber-500',
  rejected: 'bg-red-500',
};

export const DECISION_LABELS: Record<VerificationDecision, string> = {
  approve: 'Approved',
  return_for_revision: 'Returned for Revision',
  reject: 'Rejected',
};

export const DECISION_COLORS: Record<VerificationDecision, string> = {
  approve: 'bg-emerald-100 text-emerald-700',
  return_for_revision: 'bg-amber-100 text-amber-700',
  reject: 'bg-red-100 text-red-700',
};

export const DOCUMENT_CATEGORY_LABELS: Record<SnapshotDocumentCategory, string> = {
  project_details: 'Project Details',
  project_metadata: 'Project Metadata',
  land_ownership: 'Land Ownership',
  government_approval: 'Government Approval',
  environmental_clearance: 'Environmental Clearance',
  ground_images: 'Ground Images',
  drone_images: 'Drone Images',
  supporting_files: 'Supporting Files',
  evidence: 'Evidence',
  other: 'Other',
};

export const OFFICIAL_RECORD_TYPE_LABELS: Record<OfficialRecord['record_type'], string> = {
  carbon_passport: 'Carbon Passport',
  verification_certificate: 'Verification Certificate',
  audit_report: 'Audit Report',
  ngo_approval: 'NGO Approval Letter',
  supporting_document: 'Supporting Document',
  verification_history: 'Verification History',
};
