'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import type {
  ProjectLandDocument,
  LandDocumentType,
  LandDocumentVerificationStatus,
  LandDocumentAudit,
  LandDocumentAction,
  OwnershipType,
} from '@/lib/types';

export async function getLandDocumentsByProject(projectId: string): Promise<ProjectLandDocument[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('project_land_documents')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_current', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch land documents:', error);
    return [];
  }
  return (data || []) as ProjectLandDocument[];
}

export async function getLandDocumentById(id: string): Promise<ProjectLandDocument | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('project_land_documents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch land document:', error);
    return null;
  }
  return data as ProjectLandDocument;
}

export async function createLandDocument(input: {
  project_id: string;
  owner_id: string;
  document_type: LandDocumentType;
  ownership_type: OwnershipType;
  document_number?: string;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date?: string;
  document_url?: string;
  storage_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  file_hash?: string;
}): Promise<ProjectLandDocument> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('project_land_documents')
    .insert({
      project_id: input.project_id,
      owner_id: input.owner_id,
      document_type: input.document_type,
      ownership_type: input.ownership_type,
      document_number: input.document_number || null,
      issuing_authority: input.issuing_authority || null,
      issue_date: input.issue_date || null,
      expiry_date: input.expiry_date || null,
      document_url: input.document_url || null,
      storage_path: input.storage_path || null,
      file_name: input.file_name || null,
      file_size: input.file_size || null,
      mime_type: input.mime_type || null,
      file_hash: input.file_hash || null,
      verification_status: 'pending',
      is_current: true,
      version: 1,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create land document:', error);
    throw new Error('Failed to create land document');
  }
  return data as ProjectLandDocument;
}

export async function updateLandDocument(
  id: string,
  input: Partial<{
    verification_status: LandDocumentVerificationStatus;
    verified_by: string;
    rejection_reason: string;
    additional_documents_requested: string;
    verifier_remarks: string;
    document_number: string;
    issuing_authority: string;
    issue_date: string;
    expiry_date: string;
  }>
): Promise<ProjectLandDocument> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('project_land_documents')
    .update({
      ...input,
      verified_at: input.verification_status === 'verified' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update land document:', error);
    throw new Error('Failed to update land document');
  }
  return data as ProjectLandDocument;
}

export async function requestVerification(id: string, remarks?: string): Promise<ProjectLandDocument> {
  return updateLandDocument(id, {
    verification_status: 'submitted',
    verifier_remarks: remarks,
  });
}

export async function verifyLandDocument(id: string, verifiedBy: string, remarks?: string): Promise<ProjectLandDocument> {
  return updateLandDocument(id, {
    verification_status: 'verified',
    verified_by: verifiedBy,
    verifier_remarks: remarks,
  });
}

export async function rejectLandDocument(id: string, reason: string): Promise<ProjectLandDocument> {
  return updateLandDocument(id, {
    verification_status: 'rejected',
    rejection_reason: reason,
  });
}

export async function requestAdditionalDocuments(id: string, requestedDocs: string): Promise<ProjectLandDocument> {
  return updateLandDocument(id, {
    verification_status: 'additional_required',
    additional_documents_requested: requestedDocs,
  });
}

export async function deleteLandDocument(id: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from('project_land_documents')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete land document:', error);
    throw new Error('Failed to delete land document');
  }
}

export async function getLandOwnershipVerificationStatus(projectId: string): Promise<{
  is_verified: boolean;
  total_documents: number;
  verified_documents: number;
  pending_documents: number;
  rejected_documents: number;
  required_types: LandDocumentType[];
  missing_types: LandDocumentType[];
}> {
  const supabase = await getSupabaseServerClient();
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('ownership_type')
    .eq('id', projectId)
    .single();

  if (projectError || !project) {
    return {
      is_verified: false,
      total_documents: 0,
      verified_documents: 0,
      pending_documents: 0,
      rejected_documents: 0,
      required_types: [],
      missing_types: [],
    };
  }

  const { data, error } = await supabase
    .from('project_land_documents')
    .select('document_type, verification_status')
    .eq('project_id', projectId)
    .eq('is_current', true);

  if (error || !data) {
    return {
      is_verified: false,
      total_documents: 0,
      verified_documents: 0,
      pending_documents: 0,
      rejected_documents: 0,
      required_types: [],
      missing_types: [],
    };
  }

  const docs = data as { document_type: string; verification_status: string }[];
  const totalDocuments = docs.length;
  const verifiedDocuments = docs.filter(d => d.verification_status === 'verified').length;
  const pendingDocuments = docs.filter(d => d.verification_status === 'pending' || d.verification_status === 'submitted').length;
  const rejectedDocuments = docs.filter(d => d.verification_status === 'rejected').length;

  const requiredTypes: LandDocumentType[] = [];
  switch (project.ownership_type as OwnershipType) {
    case 'private':
      requiredTypes.push('land_ownership_record', 'tax_receipt');
      break;
    case 'government':
      requiredTypes.push('government_authorization', 'department_approval');
      break;
    case 'community':
      requiredTypes.push('community_resolution', 'village_council_letter');
      break;
    case 'leased':
      requiredTypes.push('lease_agreement', 'land_use_permission');
      break;
    default:
      requiredTypes.push('land_ownership_record');
  }

  const uploadedTypes = new Set(docs.map(d => d.document_type as LandDocumentType));
  const missingTypes = requiredTypes.filter(t => !uploadedTypes.has(t));

  const isVerified = verifiedDocuments >= requiredTypes.length && rejectedDocuments === 0;

  return {
    is_verified: isVerified,
    total_documents: totalDocuments,
    verified_documents: verifiedDocuments,
    pending_documents: pendingDocuments,
    rejected_documents: rejectedDocuments,
    required_types: requiredTypes,
    missing_types: missingTypes,
  };
}

export async function getLandDocumentAudit(projectId: string): Promise<LandDocumentAudit[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('land_document_audit')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch land document audit:', error);
    return [];
  }
  return (data || []) as LandDocumentAudit[];
}

export async function createLandDocumentAudit(input: {
  project_id: string;
  document_id?: string;
  actor_id: string;
  action: LandDocumentAction;
  old_status?: string;
  new_status?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from('land_document_audit')
    .insert({
      project_id: input.project_id,
      document_id: input.document_id || null,
      actor_id: input.actor_id,
      action: input.action,
      old_status: input.old_status || null,
      new_status: input.new_status || null,
      reason: input.reason || null,
      metadata: input.metadata || null,
    });

  if (error) {
    console.error('Failed to create audit log:', error);
  }
}

export async function getAllLandDocumentsAdmin(options?: {
  verification_status?: LandDocumentVerificationStatus;
  ownership_type?: OwnershipType;
  page?: number;
  limit?: number;
}): Promise<{ documents: ProjectLandDocument[]; total: number }> {
  const supabase = await getSupabaseServerClient();
  const page = options?.page || 1;
  const limit = Math.min(options?.limit || 20, 100);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('project_land_documents')
    .select('*', { count: 'exact' })
    .eq('is_current', true);

  if (options?.verification_status) {
    query = query.eq('verification_status', options.verification_status);
  }
  if (options?.ownership_type) {
    query = query.eq('ownership_type', options.ownership_type);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch admin land documents:', error);
    return { documents: [], total: 0 };
  }

  return {
    documents: (data || []) as ProjectLandDocument[],
    total: count || 0,
  };
}
