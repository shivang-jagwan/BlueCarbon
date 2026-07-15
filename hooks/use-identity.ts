'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  IdentityVerification,
  IdentityDocument,
  IdentityVerificationStatus,
  IdentityDocumentType,
  AppRole,
} from '@/lib/types';

export function useIdentityVerification(userId: string | null) {
  const [verification, setVerification] = useState<IdentityVerification | null>(null);
  const [loading, setLoading] = useState(true);

  const loadVerification = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await globalThis.fetch(`/api/identity?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setVerification(data.verification || null);
      }
    } catch {
      console.error('Failed to fetch identity verification');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadVerification();
  }, [loadVerification]);

  return { verification, loading, refetch: loadVerification };
}

export function useIdentityDocuments(userId: string | null) {
  const [documents, setDocuments] = useState<IdentityDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await globalThis.fetch(`/api/identity/documents?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch {
      console.error('Failed to fetch identity documents');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return { documents, loading, refetch: loadDocuments };
}

export function useIdentityStats() {
  const [stats, setStats] = useState<{
    total_users: number;
    verified_users: number;
    pending_users: number;
    rejected_users: number;
    suspended_users: number;
    by_status: Record<IdentityVerificationStatus, number>;
    by_role: Record<AppRole, number>;
    documents_pending: number;
    documents_verified: number;
    documents_rejected: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await globalThis.fetch('/api/identity/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch {
      console.error('Failed to fetch identity stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading };
}

export function useAllIdentityVerificationsAdmin(filters?: {
  status?: IdentityVerificationStatus;
  role?: AppRole;
  search?: string;
  page?: number;
}) {
  const [verifications, setVerifications] = useState<IdentityVerification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.role) params.set('role', filters.role);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.page !== undefined) params.set('page', String(filters.page));
      const qs = params.toString();
      const url = `/api/identity/admin${qs ? `?${qs}` : ''}`;
      const response = await globalThis.fetch(url);
      if (response.ok) {
        const data = await response.json();
        setVerifications(data.verifications || []);
        setTotal(data.total || 0);
      }
    } catch {
      console.error('Failed to fetch admin identity verifications');
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.role, filters?.search, filters?.page]);

  useEffect(() => {
    loadVerifications();
  }, [loadVerifications]);

  return { verifications, total, loading, refetch: loadVerifications };
}

export function useUploadIdentityDocument() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (input: {
    user_id: string;
    document_type: IdentityDocumentType;
    document_category?: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
    storage_path: string;
    document_number?: string;
    issuing_authority?: string;
    issue_date?: string;
    expiry_date?: string;
    issuing_country?: string;
  }): Promise<IdentityDocument | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await globalThis.fetch('/api/identity/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to upload identity document');
      const data = await response.json();
      return data.document as IdentityDocument;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { upload, loading, error };
}

export function useVerifyIdentityDocument() {
  const [loading, setLoading] = useState(false);

  const verify = async (
    documentId: string,
    input: {
      verification_status: 'verified' | 'rejected';
      verifier_notes?: string;
      rejection_reason?: string;
    }
  ): Promise<IdentityDocument | null> => {
    setLoading(true);
    try {
      const response = await globalThis.fetch(`/api/identity/documents/${documentId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to verify identity document');
      const data = await response.json();
      return data.document as IdentityDocument;
    } catch (err) {
      console.error('Failed to verify identity document:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { verify, loading };
}

export function useCheckDuplicates() {
  const [loading, setLoading] = useState(false);

  const check = async (input: {
    user_id?: string;
    document_type?: IdentityDocumentType;
    document_number?: string;
    email?: string;
    phone?: string;
  }): Promise<{
    is_duplicate: boolean;
    duplicates: Array<{ user_id: string; reason: string }>;
    fraud_score: number;
  } | null> => {
    setLoading(true);
    try {
      const response = await globalThis.fetch('/api/identity/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to check duplicates');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to check duplicates:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { check, loading };
}

export function useUpdateIdentityStatus() {
  const [loading, setLoading] = useState(false);

  const update = async (
    userId: string,
    input: {
      status: IdentityVerificationStatus;
      admin_notes?: string;
      reviewed_by?: string;
    }
  ): Promise<IdentityVerification | null> => {
    setLoading(true);
    try {
      const response = await globalThis.fetch(`/api/identity/admin/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to update identity status');
      const data = await response.json();
      return data.verification as IdentityVerification;
    } catch (err) {
      console.error('Failed to update identity status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading };
}
