import type {
  VerificationApplication,
  AuditReport,
  OfficialRecord,
  VOCAnalytics,
  VOCCalendarEvent,
} from './voc-types';

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
