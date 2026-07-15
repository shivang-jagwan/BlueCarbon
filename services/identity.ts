'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import type {
  IdentityDocument,
  IdentityVerification,
  VerificationAttempt,
  SecurityEvent,
  IdentityDocumentType,
  IdentityDocumentCategory,
  IdentityDocumentVerificationStatus,
  IdentityVerificationStatus,
  SecurityEventType,
  AppRole,
} from '@/lib/types';

// ============================================================
// 1. Get or Create Identity Verification
// ============================================================

export async function getOrCreateIdentityVerification(userId: string, role: AppRole) {
  const supabase = await getSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from('identity_verifications')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!fetchError && existing) {
    return existing as IdentityVerification;
  }

  const { data: created, error: insertError } = await supabase
    .from('identity_verifications')
    .insert({
      user_id: userId,
      role,
      email_verified: false,
      phone_verified: false,
      identity_documents_submitted: false,
      identity_verified: false,
      organization_verified: false,
      organization_document_count: 0,
      status: 'pending',
      fraud_flags: null,
      duplicate_check_passed: null,
      suspicious_activity_detected: false,
      suspicious_activity_reasons: null,
      terms_accepted: false,
      privacy_policy_accepted: false,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Failed to create identity verification:', insertError);
    throw new Error('Failed to create identity verification');
  }
  return created as IdentityVerification;
}

// ============================================================
// 2. Get Identity Verification (full with documents)
// ============================================================

export async function getIdentityVerification(userId: string) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from('identity_verifications')
    .select('*, identity_documents(*)')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Failed to fetch identity verification:', error);
    throw new Error('Failed to fetch identity verification');
  }
  return data as IdentityVerification & { identity_documents: IdentityDocument[] };
}

// ============================================================
// 3. Upload Identity Document
// ============================================================

export async function uploadIdentityDocument(input: {
  userId: string;
  documentType: IdentityDocumentType;
  documentCategory: IdentityDocumentCategory;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  fileHash?: string | null;
  documentNumber?: string | null;
  issuingAuthority?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  issuingCountry?: string | null;
}) {
  const supabase = await getSupabaseServerClient();

  if (input.fileHash) {
    const { data: existingDoc } = await supabase
      .from('identity_documents')
      .select('id, user_id, file_name')
      .eq('file_hash', input.fileHash)
      .eq('is_current', true)
      .single();

    if (existingDoc && existingDoc.user_id !== input.userId) {
      throw new Error('This document has already been submitted by another user');
    }

    if (existingDoc && existingDoc.user_id === input.userId) {
      throw new Error('You have already uploaded this document');
    }
  }

  const versionResult = await supabase
    .from('identity_documents')
    .select('version')
    .eq('user_id', input.userId)
    .eq('document_type', input.documentType)
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion = (versionResult.data?.[0]?.version ?? 0) + 1;

  const { data: document, error: insertError } = await supabase
    .from('identity_documents')
    .insert({
      user_id: input.userId,
      document_type: input.documentType,
      document_category: input.documentCategory,
      file_name: input.fileName,
      file_size: input.fileSize,
      mime_type: input.mimeType,
      storage_path: input.storagePath,
      file_hash: input.fileHash ?? null,
      document_number: input.documentNumber ?? null,
      issuing_authority: input.issuingAuthority ?? null,
      issue_date: input.issueDate ?? null,
      expiry_date: input.expiryDate ?? null,
      issuing_country: input.issuingCountry ?? null,
      verification_status: 'submitted',
      version: nextVersion,
      is_current: true,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Failed to upload identity document:', insertError);
    throw new Error('Failed to upload identity document');
  }

  const { count: docCount } = await supabase
    .from('identity_documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', input.userId)
    .eq('is_current', true);

  const updatePayload: Record<string, unknown> = {
    identity_documents_submitted: true,
  };

  if (input.documentCategory === 'organization_proof') {
    const { count: orgDocCount } = await supabase
      .from('identity_documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', input.userId)
      .eq('document_category', 'organization_proof')
      .eq('is_current', true);

    updatePayload.organization_document_count = orgDocCount ?? 0;
  }

  await supabase
    .from('identity_verifications')
    .update(updatePayload)
    .eq('user_id', input.userId);

  return document as IdentityDocument;
}

// ============================================================
// 4. Get Identity Documents
// ============================================================

export async function getIdentityDocuments(userId: string) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from('identity_documents')
    .select('*')
    .eq('user_id', userId)
    .eq('is_current', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch identity documents:', error);
    throw new Error('Failed to fetch identity documents');
  }
  return (data || []) as IdentityDocument[];
}

// ============================================================
// 5. Verify Identity Document (admin approve/reject)
// ============================================================

export async function verifyIdentityDocument(
  docId: string,
  verifiedBy: string,
  decision: 'verified' | 'rejected',
  reason?: string,
) {
  const supabase = await getSupabaseServerClient();

  const { data: document, error: fetchError } = await supabase
    .from('identity_documents')
    .select('*')
    .eq('id', docId)
    .single();

  if (fetchError) {
    console.error('Failed to fetch identity document:', fetchError);
    throw new Error('Failed to fetch identity document');
  }

  const updatePayload: Record<string, unknown> = {
    verification_status: decision,
    verified_by: verifiedBy,
    verified_at: new Date().toISOString(),
  };

  if (decision === 'rejected' && reason) {
    updatePayload.rejection_reason = reason;
  }

  const { error: updateError } = await supabase
    .from('identity_documents')
    .update(updatePayload)
    .eq('id', docId);

  if (updateError) {
    console.error('Failed to update identity document:', updateError);
    throw new Error('Failed to update identity document');
  }

  const { data: allDocs } = await supabase
    .from('identity_documents')
    .select('document_category, verification_status')
    .eq('user_id', document.user_id)
    .eq('is_current', true);

  if (allDocs) {
    const identityDocs = allDocs.filter(
      (d) => d.document_category === 'personal_identity',
    );
    const orgDocs = allDocs.filter(
      (d) => d.document_category === 'organization_proof',
    );

    const identityVerified =
      identityDocs.length > 0 &&
      identityDocs.every((d) => d.verification_status === 'verified');

    const orgVerified =
      orgDocs.length === 0 ||
      orgDocs.every((d) => d.verification_status === 'verified');

    const allVerified = identityVerified && orgVerified;

    const statusUpdate: Record<string, unknown> = {};
    let newStatus: IdentityVerificationStatus = 'pending';

    if (allVerified) {
      newStatus = 'fully_verified';
      statusUpdate.identity_verified = true;
      statusUpdate.identity_verified_at = new Date().toISOString();
      if (orgDocs.length > 0) {
        statusUpdate.organization_verified = true;
        statusUpdate.organization_verified_at = new Date().toISOString();
      }
    } else if (identityVerified) {
      newStatus = 'identity_verified';
      statusUpdate.identity_verified = true;
      statusUpdate.identity_verified_at = new Date().toISOString();
    }

    statusUpdate.status = newStatus;

    await supabase
      .from('identity_verifications')
      .update(statusUpdate)
      .eq('user_id', document.user_id);
  }

  const { data: updated } = await supabase
    .from('identity_documents')
    .select('*')
    .eq('id', docId)
    .single();

  return updated as IdentityDocument;
}

// ============================================================
// 6. Request Additional Documents
// ============================================================

export async function requestAdditionalDocuments(
  docId: string,
  requestedDocs: string,
  requestedBy: string,
) {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from('identity_documents')
    .update({
      verification_status: 'additional_required',
      additional_documents_requested: requestedDocs,
      verifier_notes: `Additional documents requested by ${requestedBy}: ${requestedDocs}`,
    })
    .eq('id', docId);

  if (error) {
    console.error('Failed to update identity document:', error);
    throw new Error('Failed to update identity document');
  }

  const { data: document } = await supabase
    .from('identity_documents')
    .select('user_id')
    .eq('id', docId)
    .single();

  if (document) {
    await supabase
      .from('identity_verifications')
      .update({ status: 'identity_submitted' })
      .eq('user_id', document.user_id);
  }
}

// ============================================================
// 7. Check for Duplicates
// ============================================================

export async function checkForDuplicates(userId: string, fileHash?: string) {
  const supabase = await getSupabaseServerClient();
  const flags: string[] = [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, phone, mobile_number, organization, aadhaar_number, pan_number')
    .eq('id', userId)
    .single();

  if (profile?.email) {
    const { data: emailProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', profile.email)
      .neq('id', userId);

    if (emailProfiles && emailProfiles.length > 0) {
      flags.push('duplicate_email');
    }
  }

  const phone = profile?.phone || profile?.mobile_number;
  if (phone) {
    const { data: phoneProfiles } = await supabase
      .from('profiles')
      .select('id')
      .or(`phone.eq.${phone},mobile_number.eq.${phone}`)
      .neq('id', userId);

    if (phoneProfiles && phoneProfiles.length > 0) {
      flags.push('duplicate_phone');
    }
  }

  if (profile?.aadhaar_number) {
    const { data: aadhaarProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('aadhaar_number', profile.aadhaar_number)
      .neq('id', userId);

    if (aadhaarProfiles && aadhaarProfiles.length > 0) {
      flags.push('duplicate_aadhaar');
    }
  }

  if (profile?.pan_number) {
    const { data: panProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('pan_number', profile.pan_number)
      .neq('id', userId);

    if (panProfiles && panProfiles.length > 0) {
      flags.push('duplicate_pan');
    }
  }

  if (fileHash) {
    const { data: hashDocs } = await supabase
      .from('identity_documents')
      .select('id, user_id')
      .eq('file_hash', fileHash)
      .eq('is_current', true)
      .neq('user_id', userId);

    if (hashDocs && hashDocs.length > 0) {
      flags.push('duplicate_document_file');
    }
  }

  const { data: userDocs } = await supabase
    .from('identity_documents')
    .select('document_number')
    .eq('user_id', userId)
    .eq('is_current', true)
    .not('document_number', 'is', null);

  if (userDocs) {
    for (const doc of userDocs) {
      if (doc.document_number) {
        const { data: duplicateDocs } = await supabase
          .from('identity_documents')
          .select('id, user_id')
          .eq('document_number', doc.document_number)
          .eq('is_current', true)
          .neq('user_id', userId);

        if (duplicateDocs && duplicateDocs.length > 0) {
          flags.push('duplicate_document_number');
          break;
        }
      }
    }
  }

  if (profile?.organization) {
    const { data: orgProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization', profile.organization)
      .neq('id', userId)
      .limit(10);

    if (orgProfiles && orgProfiles.length > 2) {
      flags.push('suspicious_organization_density');
    }
  }

  const duplicateCheckPassed = flags.length === 0;

  await supabase
    .from('identity_verifications')
    .update({
      fraud_flags: flags.length > 0 ? { flags, checked_at: new Date().toISOString() } : null,
      duplicate_check_passed: duplicateCheckPassed,
      suspicious_activity_detected: flags.length > 0,
      suspicious_activity_reasons:
        flags.length > 0 ? { reasons: flags, checked_at: new Date().toISOString() } : null,
    })
    .eq('user_id', userId);

  return {
    passed: duplicateCheckPassed,
    flags,
  };
}

// ============================================================
// 8. Log Verification Attempt
// ============================================================

export async function logVerificationAttempt(input: {
  userId?: string | null;
  attemptType: string;
  status: 'success' | 'failed' | 'blocked' | 'flagged';
  fraudScore?: number;
  fraudReasons?: Record<string, unknown> | null;
  duplicateOfUserId?: string | null;
  ipAddress?: string | null;
  device?: string | null;
  browser?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const supabase = await getSupabaseServerClient();

  const { data: attempt, error } = await supabase
    .from('verification_attempts')
    .insert({
      user_id: input.userId ?? null,
      attempt_type: input.attemptType,
      status: input.status,
      fraud_score: input.fraudScore ?? 0,
      fraud_reasons: input.fraudReasons ?? null,
      duplicate_of_user_id: input.duplicateOfUserId ?? null,
      ip_address: input.ipAddress ?? null,
      device: input.device ?? null,
      browser: input.browser ?? null,
      metadata: input.metadata ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to log verification attempt:', error);
    throw new Error('Failed to log verification attempt');
  }

  if ((input.fraudScore ?? 0) >= 70) {
    await supabase.from('security_events').insert({
      user_id: input.userId ?? null,
      event_type: 'unauthorized_access',
      severity: input.fraudScore! >= 90 ? 'critical' : 'warning',
      ip_address: input.ipAddress ?? null,
      device: input.device ?? null,
      browser: input.browser ?? null,
      details: {
        source: 'verification_attempt',
        attempt_type: input.attemptType,
        fraud_score: input.fraudScore,
        fraud_reasons: input.fraudReasons,
      },
    });
  }

  return attempt as VerificationAttempt;
}

// ============================================================
// 9. Get Security Events (filtered)
// ============================================================

export async function getSecurityEvents(filters?: {
  userId?: string;
  eventType?: SecurityEventType;
  severity?: string;
  resolved?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from('security_events')
    .select('*', { count: 'exact' });

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters?.eventType) {
    query = query.eq('event_type', filters.eventType);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.resolved !== undefined) {
    query = query.eq('resolved', filters.resolved);
  }
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const limit = Math.min(filters?.limit ?? 50, 100);
  const offset = filters?.offset ?? 0;

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch security events:', error);
    throw new Error('Failed to fetch security events');
  }

  return {
    events: (data || []) as SecurityEvent[],
    total: count ?? 0,
    limit,
    offset,
  };
}

// ============================================================
// 10. Log Security Event
// ============================================================

export async function logSecurityEvent(input: {
  userId?: string | null;
  eventType: SecurityEventType;
  severity: 'info' | 'warning' | 'critical' | 'security';
  ipAddress?: string | null;
  device?: string | null;
  browser?: string | null;
  details?: Record<string, unknown> | null;
}) {
  const supabase = await getSupabaseServerClient();

  const { data: event, error } = await supabase
    .from('security_events')
    .insert({
      user_id: input.userId ?? null,
      event_type: input.eventType,
      severity: input.severity,
      ip_address: input.ipAddress ?? null,
      device: input.device ?? null,
      browser: input.browser ?? null,
      details: input.details ?? null,
      resolved: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to log security event:', error);
    throw new Error('Failed to log security event');
  }
  return event as SecurityEvent;
}

// ============================================================
// 11. Resolve Security Event
// ============================================================

export async function resolveSecurityEvent(eventId: string, resolvedBy: string) {
  const supabase = await getSupabaseServerClient();

  const { data: event, error } = await supabase
    .from('security_events')
    .update({
      resolved: true,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Failed to resolve security event:', error);
    throw new Error('Failed to resolve security event');
  }
  return event as SecurityEvent;
}

// ============================================================
// 12. Get Identity Verification Stats
// ============================================================

export async function getIdentityVerificationStats() {
  const supabase = await getSupabaseServerClient();

  const { count: totalUsers } = await supabase
    .from('identity_verifications')
    .select('*', { count: 'exact', head: true });

  const { data: allVerifications } = await supabase
    .from('identity_verifications')
    .select('status, identity_verified, organization_verified, suspicious_activity_detected, duplicate_check_passed');

  const statusCounts: Record<string, number> = {};
  let pendingReview = 0;
  let fullyVerified = 0;
  let suspicious = 0;
  let failedDuplicateCheck = 0;

  for (const v of allVerifications || []) {
    statusCounts[v.status] = (statusCounts[v.status] || 0) + 1;

    if (v.status === 'identity_submitted' || v.status === 'organization_submitted') {
      pendingReview++;
    }
    if (v.status === 'fully_verified') {
      fullyVerified++;
    }
    if (v.suspicious_activity_detected) {
      suspicious++;
    }
    if (v.duplicate_check_passed === false) {
      failedDuplicateCheck++;
    }
  }

  const { count: pendingDocs } = await supabase
    .from('identity_documents')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'submitted');

  const { count: unresolvedEvents } = await supabase
    .from('security_events')
    .select('*', { count: 'exact', head: true })
    .eq('resolved', false);

  return {
    totalUsers: totalUsers ?? 0,
    byStatus: statusCounts,
    pendingDocumentReviews: pendingDocs ?? 0,
    pendingVerifications: pendingReview,
    fullyVerified,
    suspiciousAccounts: suspicious,
    failedDuplicateChecks: failedDuplicateCheck,
    unresolvedSecurityEvents: unresolvedEvents ?? 0,
  };
}

// ============================================================
// 13. Get All Identity Verifications (admin query)
// ============================================================

export async function getAllIdentityVerificationsAdmin(filters?: {
  status?: IdentityVerificationStatus;
  role?: AppRole;
  search?: string;
  suspiciousOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const supabase = await getSupabaseServerClient();

  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) throw new Error('Not authenticated');

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminUser.id)
    .single();

  if (adminProfile?.role !== 'admin') throw new Error('Unauthorized');

  let query = supabase
    .from('identity_verifications')
    .select('*, profiles(full_name, email, organization, phone)', { count: 'exact' });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.role) {
    query = query.eq('role', filters.role);
  }
  if (filters?.suspiciousOnly) {
    query = query.eq('suspicious_activity_detected', true);
  }

  const limit = Math.min(filters?.limit ?? 25, 100);
  const offset = filters?.offset ?? 0;

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch identity verifications:', error);
    throw new Error('Failed to fetch identity verifications');
  }

  let results = data || [];

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    results = results.filter((v: Record<string, unknown>) => {
      const profile = v.profiles as Record<string, unknown> | null;
      return (
        (profile?.full_name as string)?.toLowerCase().includes(search) ||
        (profile?.email as string)?.toLowerCase().includes(search) ||
        (profile?.organization as string)?.toLowerCase().includes(search)
      );
    });
  }

  return {
    verifications: results as (IdentityVerification & {
      profiles: { full_name: string | null; email: string; organization: string | null; phone: string | null } | null;
    })[],
    total: count ?? 0,
    limit,
    offset,
  };
}

// ============================================================
// 14. Update Identity Verification Status (admin)
// ============================================================

export async function updateIdentityVerificationStatus(
  userId: string,
  status: IdentityVerificationStatus,
  reviewedBy: string,
  notes?: string,
) {
  const supabase = await getSupabaseServerClient();

  const updatePayload: Record<string, unknown> = {
    status,
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
  };

  if (notes) {
    updatePayload.admin_notes = notes;
  }

  if (status === 'fully_verified') {
    updatePayload.identity_verified = true;
    updatePayload.identity_verified_at = new Date().toISOString();
  }

  if (status === 'suspended' || status === 'rejected') {
    updatePayload.suspicious_activity_detected = true;
  }

  const { data: updated, error } = await supabase
    .from('identity_verifications')
    .update(updatePayload)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update identity verification status:', error);
    throw new Error('Failed to update identity verification status');
  }
  return updated as IdentityVerification;
}
