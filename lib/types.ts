export type UserRole = 'owner' | 'verifier' | 'partner';

export type AppRole =
  | 'project_owner'
  | 'verifier'
  | 'sustainability_partner'
  | 'admin';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type KycStatus = 'pending' | 'submitted' | 'verified' | 'rejected';

export type ProjectStatus =
  | 'draft'
  | 'registered'
  | 'in_verification'
  | 'verified'
  | 'rejected'
  | 'active'
  | 'paused'
  | 'completed';

export type VerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'expired';

export type ProjectType =
  | 'mangrove'
  | 'seagrass'
  | 'salt_marsh'
  | 'kelp_forest'
  | 'mixed';

export type OwnershipType = 'private' | 'government' | 'community' | 'leased';

export type MonitoringStatus = 'draft' | 'submitted' | 'reviewed' | 'approved';

export type SupportStatus = 'pending' | 'active' | 'completed' | 'terminated';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  organization: string | null;
  role: AppRole;
  approval_status: ApprovalStatus;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  phone: string | null;
  mobile_number: string | null;
  aadhaar_number: string | null;
  aadhaar_url: string | null;
  pan_number: string | null;
  passport_photo_url: string | null;
  state: string | null;
  district: string | null;
  village: string | null;
  pin_code: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  occupation: string | null;
  experience: string | null;
  primary_activity: string | null;
  kyc_status: KycStatus;
  profile_completed: boolean;
  organization_type: string | null;
  registration_number: string | null;
  website: string | null;
  designation: string | null;
  office_address: string | null;
  services_offered: string[] | null;
  team_members: Record<string, unknown> | null;
  rating: number | null;
  projects_verified_count: number | null;
  pricing_info: Record<string, unknown> | null;
  availability_status: 'accepting' | 'limited' | 'unavailable';
  languages_spoken: string[] | null;
  average_response_time: string | null;
  industry: string | null;
  cin: string | null;
  gst: string | null;
  esg_goals: string | null;
  csr_objectives: string | null;
  net_zero_target_year: number | null;
  sustainability_focus: string[] | null;
  annual_csr_budget: number | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  project_type: ProjectType;
  status: ProjectStatus;
  country: string | null;
  location_name: string | null;
  boundary_geojson: GeoJSON.FeatureCollection | null;
  area_hectares: number | null;
  perimeter_km: number | null;
  target_carbon_tonnes: number | null;
  verified_carbon_tonnes: number | null;
  start_date: string | null;
  end_date: string | null;
  verification_status: VerificationStatus;
  passport_issued_at: string | null;
  objectives: string | null;
  expected_duration_months: number | null;
  ownership_type: OwnershipType | null;
  survey_number: string | null;
  land_registry_url: string | null;
  cover_image_url: string | null;
  health_score: number | null;
  center_lat: number | null;
  center_lng: number | null;
  bounding_box: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  uploaded_by: string;
  file_name: string;
  file_type: string | null;
  category: string;
  storage_path: string;
  public_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface MonitoringReport {
  id: string;
  project_id: string;
  period_month: string;
  area_observed_hectares: number | null;
  ndvi_avg: number | null;
  carbon_estimate_tonnes: number | null;
  notes: string | null;
  status: MonitoringStatus;
  created_by: string;
  created_at: string;
}

export interface ProjectSupport {
  id: string;
  project_id: string;
  partner_id: string;
  amount_usd: number;
  carbon_credits_tonnes: number | null;
  status: SupportStatus;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  actor_id: string | null;
  event_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type VerificationRequestType = 'land' | 'project' | 'corporate' | 'monthly';
export type VerificationPriority = 'high' | 'medium' | 'low';
export type VerificationServiceRequestStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'changes_requested';
export type VerificationRequestStatus = VerificationServiceRequestStatus; // backward compat alias
export type VerificationDecision = 'approved' | 'rejected' | 'changes_requested';

export interface VerificationServiceRequest {
  id: string;
  project_id: string;
  verifier_id: string;
  request_type: VerificationRequestType;
  priority: VerificationPriority;
  status: VerificationServiceRequestStatus;
  due_date: string | null;
  corporate_partner_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}
export type VerificationRequest = VerificationServiceRequest; // backward compat alias

export interface CarbonPassport {
  id: string;
  project_id: string;
  issued_by: string;
  status: 'active' | 'revoked';
  certificate_url: string | null;
  created_at: string;
}

export interface ProjectPartnership {
  id: string;
  project_id: string;
  company_id: string;
  verifier_id: string;
  owner_id: string;
  status: 'pending_owner' | 'pending_verifier' | 'active' | 'rejected' | 'terminated';
  service_type: 'monthly' | 'quarterly' | 'annual' | 'lifecycle';
  start_date: string | null;
  started_at: string | null;
  ended_at: string | null;
  budget_usd: number | null;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationDecisionRecord {
  id: string;
  request_id: string;
  verifier_id: string;
  decision: VerificationDecision;
  remarks: string | null;
  justification: string | null;
  file_path: string | null;
  created_at: string;
}

export interface DiscussionComment {
  id: string;
  project_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  attachments: Record<string, unknown> | null;
  created_at: string;
}

export type CalendarEventType = 'verification' | 'monthly_monitoring' | 'site_visit' | 'drone_survey' | 'project_deadline' | 'meeting' | 'reminder' | 'support_review' | 'ngo_visit' | 'custom';
export type CalendarEventStatus = 'upcoming' | 'completed' | 'cancelled' | 'overdue';
export type CalendarEventPriority = 'high' | 'medium' | 'low';

export interface CalendarEvent {
  id: string;
  project_id: string | null;
  created_by: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  event_type: CalendarEventType | string;
  status: CalendarEventStatus;
  priority: CalendarEventPriority;
  start_date: string;
  end_date: string;
  all_day: boolean;
  location: string | null;
  meeting_link: string | null;
  color: string | null;
  notes: string | null;
  attachments: string[] | null;
  created_at: string;
  updated_at: string;
}

export namespace GeoJSON {
  export interface Position extends Array<number> {}
  export interface Point {
    type: 'Point';
    coordinates: Position;
  }
  export interface Polygon {
    type: 'Polygon';
    coordinates: Position[][];
  }
  export type Geometry = Point | Polygon;
  export interface Feature {
    type: 'Feature';
    geometry: Geometry;
    properties: Record<string, unknown> | null;
  }
  export interface FeatureCollection {
    type: 'FeatureCollection';
    features: Feature[];
  }
}

export const ROLE_LABELS: Record<AppRole, string> = {
  project_owner: 'Project Owner',
  verifier: 'Verifier',
  sustainability_partner: 'Sustainability Partner',
  admin: 'Administrator',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  project_owner:
    'Create and manage restoration projects, upload evidence, and track carbon impact.',
  verifier:
    'Review and verify projects, issue carbon passports, and ensure data integrity.',
  sustainability_partner:
    'Discover projects, compare impact, fund restoration, and monitor outcomes.',
  admin: 'Full platform administration and oversight.',
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  mangrove: 'Mangrove',
  seagrass: 'Seagrass',
  salt_marsh: 'Salt Marsh',
  kelp_forest: 'Kelp Forest',
  mixed: 'Mixed Ecosystem',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Draft',
  registered: 'Registered',
  in_verification: 'In Verification',
  verified: 'Verified',
  rejected: 'Rejected',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
};

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  not_submitted: 'Not Submitted',
  pending: 'Pending',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
};

export const OWNERSHIP_TYPE_LABELS: Record<OwnershipType, string> = {
  private: 'Private',
  government: 'Government',
  community: 'Community',
  leased: 'Leased',
};

export const MONITORING_STATUS_LABELS: Record<MonitoringStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  reviewed: 'Reviewed',
  approved: 'Approved',
};

export const PROJECT_TYPE_ICONS: Record<ProjectType, string> = {
  mangrove: 'Mangrove',
  seagrass: 'Seagrass',
  salt_marsh: 'Salt Marsh',
  kelp_forest: 'Kelp Forest',
  mixed: 'Mixed Ecosystem',
};

export function statusColor(status: ProjectStatus): string {
  const map: Record<ProjectStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    registered: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    in_verification: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    verified: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive',
    active: 'bg-success/10 text-success',
    paused: 'bg-muted text-muted-foreground',
    completed: 'bg-primary/10 text-primary',
  };
  return map[status] || 'bg-muted text-muted-foreground';
}

export const VERIFICATION_REQUEST_TYPE_LABELS: Record<VerificationRequestType, string> = {
  land: 'Land Verification',
  project: 'Project Verification',
  corporate: 'Corporate Verification',
  monthly: 'Monthly Monitoring',
};

export const VERIFICATION_PRIORITY_LABELS: Record<VerificationPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const VERIF_REQUEST_STATUS_LABELS: Record<VerificationServiceRequestStatus, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  changes_requested: 'Changes Requested',
};

export const VERIFICATION_DECISION_LABELS: Record<VerificationDecision, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  changes_requested: 'Changes Requested',
};

export function verificationStatusColor(status: VerificationServiceRequestStatus): string {
  const map: Record<VerificationServiceRequestStatus, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    in_review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive',
    changes_requested: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  };
  return map[status] || 'bg-muted text-muted-foreground';
}

export function priorityColor(priority: VerificationPriority): string {
  const map: Record<VerificationPriority, string> = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-green-500',
  };
  return map[priority] || 'bg-muted';
}

export const ORGANIZATION_TYPES = [
  'Environmental NGO',
  'Government Forest Department',
  'Certified Carbon Auditor',
  'University / Research Institute',
  'Private Environmental Consultant',
  'Third-Party Verification Agency',
] as const;

export const VERIFICATION_SERVICES = [
  'Land Verification',
  'Project Verification',
  'Monthly Monitoring',
  'Carbon Assessment',
  'Drone Survey',
  'GIS Mapping',
  'Satellite Analysis',
] as const;

export const INDUSTRIES = [
  'Technology',
  'Banking & Finance',
  'Manufacturing',
  'Energy & Utilities',
  'Healthcare',
  'Retail & Consumer Goods',
  'Telecommunications',
  'Automotive',
  'Construction & Real Estate',
  'Agriculture',
  'Pharmaceuticals',
  'Aerospace & Defense',
  'Media & Entertainment',
  'Education',
  'Government Agency',
  'Non-Profit / Foundation',
  'Other',
] as const;

export const SUSTAINABILITY_FOCUS_AREAS = [
  'Carbon Offsetting',
  'Biodiversity Conservation',
  'Coastal Protection',
  'Community Development',
  'Water Security',
  'Climate Adaptation',
  'Mangrove Restoration',
  'Wetland Conservation',
  'Forest Restoration',
  'Marine Conservation',
  'Sustainable Livelihoods',
  'Disaster Risk Reduction',
] as const;

// ============================================================
// VERIFICATION EVIDENCE SYSTEM
// ============================================================

export type EvidenceType = 'photo' | 'video' | 'drone_image' | 'drone_video';
export type EvidenceValidationStatus = 'pending' | 'valid' | 'warning' | 'rejected';
export type GpsSource = 'device' | 'exif' | 'manual' | 'none';
export type AiProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface VerificationEvidence {
  id: string;
  project_id: string;
  verification_request_id: string | null;
  uploaded_by: string;
  photo_url: string | null;
  video_url: string | null;
  drone_image_url: string | null;
  drone_video_url: string | null;
  monitoring_notes: string | null;
  latitude: number | null;
  longitude: number | null;
  gps_accuracy_meters: number | null;
  gps_source: GpsSource | null;
  capture_timestamp: string | null;
  upload_timestamp: string;
  device_name: string | null;
  device_model: string | null;
  device_platform: string | null;
  exif_data: Record<string, unknown> | null;
  file_hash: string | null;
  file_size: number | null;
  mime_type: string | null;
  original_filename: string | null;
  storage_path: string;
  evidence_type: EvidenceType;
  validation_status: EvidenceValidationStatus;
  validation_notes: Record<string, unknown> | null;
  fraud_score: number;
  fraud_flags: string[] | null;
  ai_similarity_score: number | null;
  ai_notes: string | null;
  ai_status: AiProcessingStatus | null;
  created_at: string;
  updated_at: string;
}

export interface EvidenceValidationResult {
  status: EvidenceValidationStatus;
  fraud_score: number;
  fraud_flags: string[];
  validation_notes: Record<string, unknown>;
}

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface ProjectBoundary {
  boundary_geojson: GeoJSON.FeatureCollection | null;
  center_lat: number | null;
  center_lng: number | null;
  allowed_radius_meters?: number;
}

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  photo: 'Ground Photo',
  video: 'Video',
  drone_image: 'Drone Image',
  drone_video: 'Drone Video',
};

export const EVIDENCE_STATUS_LABELS: Record<EvidenceValidationStatus, string> = {
  pending: 'Pending Review',
  valid: 'Validated',
  warning: 'Warning',
  rejected: 'Rejected',
};

export const EVIDENCE_STATUS_COLORS: Record<EvidenceValidationStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  valid: 'bg-success/10 text-success',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  rejected: 'bg-destructive/10 text-destructive',
};

export function fraudScoreLabel(score: number): string {
  if (score <= 20) return 'Low Risk';
  if (score <= 50) return 'Medium Risk';
  return 'High Risk';
}

export function fraudScoreColor(score: number): string {
  if (score <= 20) return 'bg-success/10 text-success';
  if (score <= 50) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-destructive/10 text-destructive';
}

// ============================================================
// AI DECISION SUPPORT SYSTEM
// ============================================================

export type AiAnalysisType =
  | 'registration_review'
  | 'verification_review'
  | 'monitoring_review'
  | 'carbon_assessment'
  | 'evidence_validation'
  | 'land_ownership';

export type AiRecommendation =
  | 'recommend_approval'
  | 'recommend_changes'
  | 'recommend_rejection'
  | 'insufficient_data'
  | 'needs_more_evidence'
  | 'low_confidence';

export type AiRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AiAnalysis {
  id: string;
  project_id: string;
  verification_request_id: string | null;
  analysis_type: AiAnalysisType;
  confidence_score: number;
  recommendation: AiRecommendation;
  reasoning: string | null;
  risk_level: AiRiskLevel;
  evidence_used: Record<string, unknown> | null;
  detected_risks: Record<string, unknown> | null;
  observations: Record<string, unknown> | null;
  vegetation_score: number | null;
  carbon_estimate: number | null;
  similarity_score: number | null;
  gps_consistency_score: number | null;
  ownership_verification_score: number | null;
  ai_model: string | null;
  ai_version: string | null;
  processing_time_ms: number | null;
  notes: string | null;
  verifier_agreed_with_ai: boolean | null;
  verifier_override_reason: string | null;
  created_at: string;
  updated_at: string;
}

export const AI_ANALYSIS_TYPE_LABELS: Record<AiAnalysisType, string> = {
  registration_review: 'Registration Review',
  verification_review: 'Verification Review',
  monitoring_review: 'Monitoring Review',
  carbon_assessment: 'Carbon Assessment',
  evidence_validation: 'Evidence Validation',
  land_ownership: 'Land Ownership',
};

export const AI_RECOMMENDATION_LABELS: Record<AiRecommendation, string> = {
  recommend_approval: 'Recommend Approval',
  recommend_changes: 'Recommend Changes',
  recommend_rejection: 'Recommend Rejection',
  insufficient_data: 'Insufficient Data',
  needs_more_evidence: 'Needs More Evidence',
  low_confidence: 'Low Confidence',
};

export const AI_RISK_LEVEL_LABELS: Record<AiRiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
};

export function aiRecommendationColor(rec: AiRecommendation): string {
  const map: Record<AiRecommendation, string> = {
    recommend_approval: 'bg-success/10 text-success',
    recommend_changes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    recommend_rejection: 'bg-destructive/10 text-destructive',
    insufficient_data: 'bg-muted text-muted-foreground',
    needs_more_evidence: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    low_confidence: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  };
  return map[rec] || 'bg-muted text-muted-foreground';
}

export function aiRiskLevelColor(level: AiRiskLevel): string {
  const map: Record<AiRiskLevel, string> = {
    low: 'bg-success/10 text-success',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    critical: 'bg-destructive/10 text-destructive',
  };
  return map[level] || 'bg-muted text-muted-foreground';
}

// ============================================================
// LAND OWNERSHIP VERIFICATION SYSTEM
// ============================================================

export type LandDocumentType =
  | 'land_ownership_record'
  | 'sale_deed'
  | 'property_registration'
  | 'government_authorization'
  | 'department_approval'
  | 'community_resolution'
  | 'village_council_letter'
  | 'forest_committee_approval'
  | 'lease_agreement'
  | 'land_use_permission'
  | 'tax_receipt'
  | 'encumbrance_certificate'
  | 'other';

export type LandDocumentVerificationStatus =
  | 'pending'
  | 'submitted'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'additional_required';

export interface ProjectLandDocument {
  id: string;
  project_id: string;
  owner_id: string;
  document_type: LandDocumentType;
  ownership_type: OwnershipType;
  document_number: string | null;
  issuing_authority: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
  storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  file_hash: string | null;
  verification_status: LandDocumentVerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  additional_documents_requested: string | null;
  verifier_remarks: string | null;
  version: number;
  replaced_by: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export type LandDocumentAction =
  | 'document_uploaded'
  | 'document_replaced'
  | 'verification_requested'
  | 'ownership_verified'
  | 'ownership_rejected'
  | 'ownership_expired'
  | 'additional_documents_requested'
  | 'document_downloaded'
  | 'admin_override'
  | 'status_change';

export interface LandDocumentAudit {
  id: string;
  project_id: string;
  document_id: string | null;
  actor_id: string;
  action: LandDocumentAction;
  old_status: string | null;
  new_status: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const LAND_DOCUMENT_TYPE_LABELS: Record<LandDocumentType, string> = {
  land_ownership_record: 'Land Ownership Record',
  sale_deed: 'Sale Deed',
  property_registration: 'Property Registration',
  government_authorization: 'Government Authorization',
  department_approval: 'Department Approval',
  community_resolution: 'Community Resolution',
  village_council_letter: 'Village Council Letter',
  forest_committee_approval: 'Forest Committee Approval',
  lease_agreement: 'Lease Agreement',
  land_use_permission: 'Land Use Permission',
  tax_receipt: 'Tax Receipt',
  encumbrance_certificate: 'Encumbrance Certificate',
  other: 'Other',
};

export const LAND_DOC_STATUS_LABELS: Record<LandDocumentVerificationStatus, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  verified: 'Verified',
  rejected: 'Rejected',
  expired: 'Expired',
  additional_required: 'Additional Required',
};

export const LAND_DOC_STATUS_COLORS: Record<LandDocumentVerificationStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  verified: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  additional_required: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export const LAND_DOC_ACTION_LABELS: Record<LandDocumentAction, string> = {
  document_uploaded: 'Document Uploaded',
  document_replaced: 'Document Replaced',
  verification_requested: 'Verification Requested',
  ownership_verified: 'Ownership Verified',
  ownership_rejected: 'Ownership Rejected',
  ownership_expired: 'Ownership Expired',
  additional_documents_requested: 'Additional Documents Requested',
  document_downloaded: 'Document Downloaded',
  admin_override: 'Admin Override',
  status_change: 'Status Change',
};

export type ExtendedOwnershipType = OwnershipType | 'forest_department' | 'other';

// ============================================================
// FEATURE 1: RISK-BASED DUAL VERIFICATION
// ============================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type VerificationReviewStatus = 'assigned' | 'in_review' | 'submitted' | 'under_conflict_review' | 'finalized';
export type VerificationReviewRecommendation = 'approved' | 'rejected' | 'changes_requested' | 'pending';
export type ConflictStatus = 'detected' | 'admin_review' | 'third_review_requested' | 'resolved' | 'escalated';
export type ConflictSeverity = 'minor' | 'moderate' | 'major' | 'critical';

export interface ProjectRiskAssessment {
  id: string;
  project_id: string;
  ownership_risk: number;
  document_risk: number;
  size_risk: number;
  carbon_risk: number;
  funding_risk: number;
  ai_fraud_risk: number;
  evidence_risk: number;
  dispute_risk: number;
  admin_escalation: boolean;
  total_risk_score: number;
  risk_level: RiskLevel;
  required_verifiers: number;
  admin_review_required: boolean;
  calculated_by: 'system' | 'admin' | 'manual';
  calculation_reasoning: string | null;
  last_assessed_at: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationReview {
  id: string;
  project_id: string;
  verification_request_id: string | null;
  risk_assessment_id: string | null;
  verifier_id: string;
  verifier_org_id: string | null;
  reviewer_number: number;
  status: VerificationReviewStatus;
  vegetation_score: number | null;
  carbon_estimate: number | null;
  boundary_area_hectares: number | null;
  evidence_quality_score: number | null;
  monitoring_notes: string | null;
  recommendation: VerificationReviewRecommendation;
  findings: Record<string, unknown> | null;
  conditions: Record<string, unknown> | null;
  anomalies: Record<string, unknown> | null;
  overall_confidence: number | null;
  reviewer_remarks: string | null;
  is_in_conflict: boolean;
  conflict_id: string | null;
  submitted_at: string | null;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationConflict {
  id: string;
  project_id: string;
  review_1_id: string;
  review_2_id: string;
  verifier_1_id: string;
  verifier_2_id: string;
  conflict_fields: Record<string, unknown>;
  recommendation_mismatch: boolean;
  severity: ConflictSeverity;
  status: ConflictStatus;
  admin_id: string | null;
  admin_decision: VerificationDecision | null;
  admin_remarks: string | null;
  third_review_id: string | null;
  resolution_reasoning: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DualVerificationSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, unknown>;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: 'bg-success/10 text-success',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  critical: 'bg-destructive/10 text-destructive',
};

export const CONFLICT_STATUS_LABELS: Record<ConflictStatus, string> = {
  detected: 'Detected',
  admin_review: 'Admin Review',
  third_review_requested: 'Third Review Requested',
  resolved: 'Resolved',
  escalated: 'Escalated',
};

export const CONFLICT_SEVERITY_LABELS: Record<ConflictSeverity, string> = {
  minor: 'Minor',
  moderate: 'Moderate',
  major: 'Major',
  critical: 'Critical',
};

// ============================================================
// FEATURE 2: IMMUTABLE AUDIT LOGS
// ============================================================

export type AuditSeverity = 'info' | 'warning' | 'critical' | 'security';
export type AuditAction =
  | 'user_login' | 'user_logout' | 'user_register' | 'profile_update'
  | 'project_created' | 'project_updated' | 'boundary_changed'
  | 'document_uploaded' | 'evidence_uploaded'
  | 'verification_started' | 'verification_submitted' | 'verification_decision'
  | 'ownership_verified' | 'project_published'
  | 'support_created' | 'monitoring_partnership_created'
  | 'passport_issued' | 'report_generated'
  | 'admin_override' | 'permission_change'
  | 'identity_document_uploaded' | 'identity_verified' | 'identity_rejected'
  | 'account_locked' | 'account_suspended' | 'account_activated'
  | 'risk_assessment_calculated' | 'dual_verification_assigned'
  | 'conflict_detected' | 'conflict_resolved'
  | 'security_event' | 'rate_limit_exceeded';

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string | null;
  role: string | null;
  session_id: string | null;
  action: AuditAction;
  severity: AuditSeverity;
  resource_type: string;
  resource_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  reason: string | null;
  ip_address: string | null;
  device: string | null;
  browser: string | null;
  location: Record<string, unknown> | null;
  checksum: string;
  created_at: string;
}

export interface AuditRetentionPolicy {
  id: string;
  resource_type: string;
  retention_days: number;
  archive_after_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const AUDIT_SEVERITY_LABELS: Record<AuditSeverity, string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
  security: 'Security',
};

export const AUDIT_SEVERITY_COLORS: Record<AuditSeverity, string> = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  critical: 'bg-destructive/10 text-destructive',
  security: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

// ============================================================
// FEATURE 3: ENTERPRISE IDENTITY VERIFICATION
// ============================================================

export type IdentityDocumentType =
  | 'government_id' | 'passport' | 'driving_license' | 'aadhaar' | 'pan_card'
  | 'organization_certificate' | 'registration_document' | 'tax_registration'
  | 'gst_certificate' | 'authorization_letter' | 'board_resolution'
  | 'business_license' | 'incorporation_certificate' | 'memorandum'
  | 'articles_of_association' | 'proof_of_address' | 'bank_statement'
  | 'other';

export type IdentityDocumentCategory = 'personal_identity' | 'organization_proof' | 'authorization' | 'other';
export type IdentityDocumentVerificationStatus =
  'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 'expired' | 'additional_required';

export type IdentityVerificationStatus =
  | 'pending' | 'email_verified' | 'phone_verified' | 'identity_submitted'
  | 'identity_verified' | 'organization_submitted' | 'organization_verified'
  | 'fully_verified' | 'rejected' | 'suspended';

export type VerificationAttemptType =
  | 'email_verification' | 'phone_otp' | 'identity_upload'
  | 'organization_upload' | 'login' | 'password_reset'
  | 'duplicate_check' | 'fraud_scan';

export type SecurityEventType =
  | 'failed_login' | 'successful_login' | 'account_locked'
  | 'account_unlocked' | 'password_changed' | 'brute_force_detected'
  | 'session_expired' | 'unauthorized_access' | 'rate_limit_exceeded'
  | 'suspicious_ip' | 'concurrent_session';

export interface IdentityDocument {
  id: string;
  user_id: string;
  document_type: IdentityDocumentType;
  document_category: IdentityDocumentCategory;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string;
  file_hash: string | null;
  document_number: string | null;
  issuing_authority: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  issuing_country: string | null;
  verification_status: IdentityDocumentVerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  additional_documents_requested: string | null;
  verifier_notes: string | null;
  version: number;
  replaced_by: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface IdentityVerification {
  id: string;
  user_id: string;
  role: AppRole;
  email_verified: boolean;
  email_verified_at: string | null;
  phone_verified: boolean;
  phone_verified_at: string | null;
  identity_documents_submitted: boolean;
  identity_verified: boolean;
  identity_verified_at: string | null;
  organization_verified: boolean;
  organization_verified_at: string | null;
  organization_document_count: number;
  status: IdentityVerificationStatus;
  fraud_flags: Record<string, unknown> | null;
  duplicate_check_passed: boolean | null;
  suspicious_activity_detected: boolean;
  suspicious_activity_reasons: Record<string, unknown> | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  privacy_policy_accepted: boolean;
  created_at: string;
  updated_at: string;
}

export interface VerificationAttempt {
  id: string;
  user_id: string | null;
  attempt_type: VerificationAttemptType;
  status: 'success' | 'failed' | 'blocked' | 'flagged';
  fraud_score: number;
  fraud_reasons: Record<string, unknown> | null;
  duplicate_of_user_id: string | null;
  ip_address: string | null;
  device: string | null;
  browser: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SecurityEvent {
  id: string;
  user_id: string | null;
  event_type: SecurityEventType;
  severity: AuditSeverity;
  ip_address: string | null;
  device: string | null;
  browser: string | null;
  details: Record<string, unknown> | null;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export const IDENTITY_DOC_TYPE_LABELS: Record<IdentityDocumentType, string> = {
  government_id: 'Government ID',
  passport: 'Passport',
  driving_license: 'Driving License',
  aadhaar: 'Aadhaar Card',
  pan_card: 'PAN Card',
  organization_certificate: 'Organization Certificate',
  registration_document: 'Registration Document',
  tax_registration: 'Tax Registration',
  gst_certificate: 'GST Certificate',
  authorization_letter: 'Authorization Letter',
  board_resolution: 'Board Resolution',
  business_license: 'Business License',
  incorporation_certificate: 'Incorporation Certificate',
  memorandum: 'Memorandum',
  articles_of_association: 'Articles of Association',
  proof_of_address: 'Proof of Address',
  bank_statement: 'Bank Statement',
  other: 'Other',
};

export const IDENTITY_STATUS_LABELS: Record<IdentityVerificationStatus, string> = {
  pending: 'Pending',
  email_verified: 'Email Verified',
  phone_verified: 'Phone Verified',
  identity_submitted: 'Identity Submitted',
  identity_verified: 'Identity Verified',
  organization_submitted: 'Organization Submitted',
  organization_verified: 'Organization Verified',
  fully_verified: 'Fully Verified',
  rejected: 'Rejected',
  suspended: 'Suspended',
};

export const IDENTITY_STATUS_COLORS: Record<IdentityVerificationStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  email_verified: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  phone_verified: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  identity_submitted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  identity_verified: 'bg-success/10 text-success',
  organization_submitted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  organization_verified: 'bg-success/10 text-success',
  fully_verified: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  suspended: 'bg-destructive/10 text-destructive',
};

export const SECURITY_EVENT_LABELS: Record<SecurityEventType, string> = {
  failed_login: 'Failed Login',
  successful_login: 'Successful Login',
  account_locked: 'Account Locked',
  account_unlocked: 'Account Unlocked',
  password_changed: 'Password Changed',
  brute_force_detected: 'Brute Force Detected',
  session_expired: 'Session Expired',
  unauthorized_access: 'Unauthorized Access',
  rate_limit_exceeded: 'Rate Limit Exceeded',
  suspicious_ip: 'Suspicious IP',
  concurrent_session: 'Concurrent Session',
};
