import type {
  VerificationApplication,
  AuditReport,
  OfficialRecord,
  VOCAnalytics,
  VOCCalendarEvent,
  VerificationAgency,
} from './voc-types';

export const MOCK_VERIFICATION_AGENCIES: VerificationAgency[] = [
  {
    id: 'ngo-001',
    profile_id: 'verifier-001',
    name: 'BlueCarbon Research Institute',
    logo_url: null,
    rating: 4.8,
    projects_verified: 127,
    location: 'Mumbai, India',
    verification_status: 'active',
  },
  {
    id: 'ngo-002',
    profile_id: 'verifier-002',
    name: 'Coastal Restoration Alliance',
    logo_url: null,
    rating: 4.6,
    projects_verified: 89,
    location: 'Sri Lanka',
    verification_status: 'active',
  },
  {
    id: 'ngo-003',
    profile_id: 'verifier-003',
    name: 'Pacific Mangrove Foundation',
    logo_url: null,
    rating: 4.5,
    projects_verified: 64,
    location: 'Jakarta, Indonesia',
    verification_status: 'active',
  },
  {
    id: 'ngo-004',
    profile_id: 'verifier-004',
    name: 'Global Blue Carbon Network',
    logo_url: null,
    rating: 4.3,
    projects_verified: 42,
    location: 'Nairobi, Kenya',
    verification_status: 'active',
  },
  {
    id: 'ngo-005',
    profile_id: 'verifier-005',
    name: 'Wetlands Verification Corp',
    logo_url: null,
    rating: 4.1,
    projects_verified: 31,
    location: 'São Paulo, Brazil',
    verification_status: 'pending',
  },
];

export const MOCK_APPLICATIONS: VerificationApplication[] = [];
export const MOCK_AUDIT_REPORTS: AuditReport[] = [];
export const MOCK_OFFICIAL_RECORDS: OfficialRecord[] = [];

export const MOCK_ANALYTICS: VOCAnalytics = {
  total_applications: 0,
  approval_rate: 0,
  avg_verification_time_hours: 0,
  rejected_count: 0,
  returned_count: 0,
  audit_completion_rate: 0,
  by_status: [],
  by_month: [],
};

export const MOCK_CALENDAR_EVENTS: VOCCalendarEvent[] = [];
