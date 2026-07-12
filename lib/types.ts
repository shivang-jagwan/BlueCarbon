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
