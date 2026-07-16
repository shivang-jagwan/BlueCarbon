import { supabase } from '@/lib/supabase/client';
import type { ProjectActivity } from '@/lib/types';

export interface ProjectHistoryFilters {
  category?: string;
  event_type?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  actor_id?: string;
  organization_id?: string;
  company_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface ProjectHistoryResult {
  activities: ProjectActivity[];
  total: number;
  loading: boolean;
  error: string | null;
}

export async function logProjectActivity(params: {
  projectId: string;
  actorId?: string;
  eventType: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  organizationId?: string;
  companyId?: string;
  relatedDocumentId?: string;
  relatedReportId?: string;
  relatedVerificationId?: string;
  relatedPartnershipId?: string;
  activityStatus?: string;
  actorName?: string;
  actorRole?: string;
  organizationName?: string;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('project_activity')
    .insert({
      project_id: params.projectId,
      actor_id: params.actorId,
      event_type: params.eventType,
      title: params.title,
      description: params.description,
      metadata: params.metadata,
      organization_id: params.organizationId,
      company_id: params.companyId,
      related_document_id: params.relatedDocumentId,
      related_report_id: params.relatedReportId,
      related_verification_id: params.relatedVerificationId,
      related_partnership_id: params.relatedPartnershipId,
      activity_status: params.activityStatus,
      actor_name: params.actorName,
      actor_role: params.actorRole,
      organization_name: params.organizationName,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[ProjectHistory] Failed to log activity:', error);
    return null;
  }
  return data?.id ?? null;
}

export async function fetchProjectHistory(
  projectId: string,
  filters: ProjectHistoryFilters = {}
): Promise<ProjectHistoryResult> {
  let query = supabase
    .from('project_activity')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId);

  if (filters.category && filters.category !== 'all') {
    const categoryPatterns = getCategoryEventTypes(filters.category);
    if (categoryPatterns.length > 0) {
      query = query.in('event_type', categoryPatterns);
    }
  }

  if (filters.event_type) {
    query = query.eq('event_type', filters.event_type);
  }

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  if (filters.actor_id) {
    query = query.eq('actor_id', filters.actor_id);
  }

  if (filters.organization_id) {
    query = query.eq('organization_id', filters.organization_id);
  }

  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id);
  }

  if (filters.status) {
    query = query.eq('activity_status', filters.status);
  }

  const limit = Math.min(filters.limit || 50, 100);
  const offset = filters.offset || 0;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[ProjectHistory] Failed to fetch history:', error);
    return { activities: [], total: 0, loading: false, error: error.message };
  }

  return {
    activities: (data as ProjectActivity[]) || [],
    total: count || 0,
    loading: false,
    error: null,
  };
}

export function getCategoryEventTypes(category: string): string[] {
  const map: Record<string, string[]> = {
    documents: [
      'document_submitted', 'document_verified', 'document_rejected',
      'documents_requested', 'additional_documents_uploaded',
      'ownership_documents_uploaded', 'ownership_documents_submitted',
      'ownership_verified', 'ownership_rejected',
      'evidence_uploaded', 'evidence_approved', 'evidence_rejected',
    ],
    verifications: [
      'land_verification_requested', 'land_verification_approved', 'land_verification_rejected',
      'project_verification_requested', 'project_verification_approved', 'project_verification_rejected',
      'verification_requested', 'verification_approved', 'verification_rejected',
      'verification_started',
      'verifier_assigned',
      'verification_organization_accepted', 'verification_organization_declined',
      'audit_event',
    ],
    monitoring: [
      'monitoring_report_submitted', 'monitoring_report_approved', 'monitoring_report_rejected',
      'monitoring_report_updated',
      'monitoring_partnership_created',
      'satellite_report_generated',
      'drone_images_uploaded', 'drone_videos_uploaded',
    ],
    gallery: [
      'gallery_photos_uploaded', 'gallery_videos_uploaded',
      'evidence_uploaded',
      'drone_images_uploaded', 'drone_videos_uploaded',
      'satellite_report_generated',
    ],
    comments: [
      'comments_added', 'comments_replied',
    ],
    financial: [
      'company_supported_project', 'company_removed_support',
      'carbon_passport_issued', 'carbon_passport_revoked', 'carbon_passport_updated',
      'carbon_report_generated',
    ],
    project: [
      'project_created', 'project_updated', 'project_submitted',
      'boundary_created', 'boundary_updated', 'boundary_change_requested',
      'project_archived',
      'admin_override',
    ],
  };
  return map[category] || [];
}

export function getEventTypeLabel(eventType: string): string {
  const labels: Record<string, string> = {
    project_created: 'Project Created',
    project_updated: 'Project Updated',
    project_submitted: 'Project Submitted',
    project_archived: 'Project Archived',
    boundary_created: 'Boundary Created',
    boundary_updated: 'Boundary Updated',
    boundary_change_requested: 'Boundary Change Requested',
    document_submitted: 'Document Submitted',
    document_verified: 'Document Verified',
    document_rejected: 'Document Rejected',
    documents_requested: 'Documents Requested',
    additional_documents_uploaded: 'Additional Documents Uploaded',
    ownership_documents_uploaded: 'Ownership Documents Uploaded',
    ownership_documents_submitted: 'Ownership Documents Submitted',
    ownership_verified: 'Ownership Verified',
    ownership_rejected: 'Ownership Rejected',
    evidence_uploaded: 'Evidence Uploaded',
    evidence_approved: 'Evidence Approved',
    evidence_rejected: 'Evidence Rejected',
    land_verification_requested: 'Land Verification Requested',
    land_verification_approved: 'Land Verification Approved',
    land_verification_rejected: 'Land Verification Rejected',
    project_verification_requested: 'Project Verification Requested',
    project_verification_approved: 'Project Verification Approved',
    project_verification_rejected: 'Project Verification Rejected',
    verification_requested: 'Verification Requested',
    verification_approved: 'Verification Approved',
    verification_rejected: 'Verification Rejected',
    verification_started: 'Verification In Progress',
    verifier_assigned: 'Verifier Assigned',
    verification_organization_accepted: 'Verification Organization Accepted',
    verification_organization_declined: 'Verification Organization Declined',
    monitoring_report_submitted: 'Monitoring Report Submitted',
    monitoring_report_approved: 'Monitoring Report Approved',
    monitoring_report_rejected: 'Monitoring Report Rejected',
    monitoring_report_updated: 'Monitoring Report Updated',
    monitoring_partnership_created: 'Monitoring Partnership Active',
    satellite_report_generated: 'Satellite Report Generated',
    drone_images_uploaded: 'Drone Images Uploaded',
    drone_videos_uploaded: 'Drone Videos Uploaded',
    gallery_photos_uploaded: 'Gallery Photos Uploaded',
    gallery_videos_uploaded: 'Gallery Videos Uploaded',
    carbon_passport_issued: 'Carbon Passport Issued',
    carbon_passport_revoked: 'Carbon Passport Revoked',
    carbon_passport_updated: 'Carbon Passport Updated',
    carbon_report_generated: 'Carbon Report Generated',
    company_supported_project: 'Sustainability Partner Joined',
    company_removed_support: 'Partnership Terminated',
    comments_added: 'Comment Added',
    comments_replied: 'Comment Replied',
    audit_event: 'Audit Event',
    admin_override: 'Admin Override',
  };
  return labels[eventType] || eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getEventCategory(eventType: string): string {
  const docEvents = ['document_submitted', 'document_verified', 'document_rejected', 'documents_requested', 'additional_documents_uploaded', 'ownership_documents_uploaded', 'ownership_documents_submitted', 'ownership_verified', 'ownership_rejected', 'evidence_uploaded', 'evidence_approved', 'evidence_rejected'];
  const verifEvents = ['land_verification_requested', 'land_verification_approved', 'land_verification_rejected', 'project_verification_requested', 'project_verification_approved', 'project_verification_rejected', 'verification_requested', 'verification_approved', 'verification_rejected', 'verification_started', 'verifier_assigned', 'verification_organization_accepted', 'verification_organization_declined', 'audit_event'];
  const monEvents = ['monitoring_report_submitted', 'monitoring_report_approved', 'monitoring_report_rejected', 'monitoring_report_updated', 'monitoring_partnership_created', 'satellite_report_generated', 'drone_images_uploaded', 'drone_videos_uploaded'];
  const galleryEvents = ['gallery_photos_uploaded', 'gallery_videos_uploaded', 'satellite_report_generated'];
  const commentEvents = ['comments_added', 'comments_replied'];

  if (docEvents.includes(eventType)) return 'documents';
  if (verifEvents.includes(eventType)) return 'verifications';
  if (monEvents.includes(eventType)) return 'monitoring';
  if (galleryEvents.includes(eventType)) return 'gallery';
  if (commentEvents.includes(eventType)) return 'comments';
  return 'all';
}

export function getQuickActionUrl(activity: ProjectActivity): { label: string; url: string } | null {
  const projectId = activity.project_id;
  const meta = activity.metadata as Record<string, unknown> | null;

  switch (activity.event_type) {
    case 'monitoring_report_submitted':
    case 'monitoring_report_approved':
    case 'monitoring_report_rejected':
      return { label: 'View Report', url: `/dashboard/projects/${projectId}/monitoring` };
    case 'document_submitted':
    case 'document_verified':
    case 'document_rejected':
    case 'documents_requested':
    case 'additional_documents_uploaded':
      return { label: 'View Document', url: `/dashboard/projects/${projectId}/documents` };
    case 'evidence_uploaded':
    case 'evidence_approved':
    case 'evidence_rejected':
    case 'gallery_photos_uploaded':
    case 'gallery_videos_uploaded':
      return { label: 'Open Gallery', url: `/dashboard/projects/${projectId}/evidence` };
    case 'land_verification_requested':
    case 'land_verification_approved':
    case 'land_verification_rejected':
    case 'project_verification_requested':
    case 'project_verification_approved':
    case 'project_verification_rejected':
    case 'verification_requested':
    case 'verification_approved':
    case 'verification_rejected':
    case 'verification_started':
    case 'verifier_assigned':
      return { label: 'Open Verification', url: `/dashboard/projects/${projectId}/verification` };
    case 'satellite_report_generated':
    case 'drone_images_uploaded':
    case 'drone_videos_uploaded':
      return { label: 'View Report', url: `/dashboard/projects/${projectId}/monitoring` };
    default:
      return null;
  }
}
