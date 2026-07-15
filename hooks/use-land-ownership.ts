'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  ProjectLandDocument,
  LandDocumentVerificationStatus,
  LandDocumentAudit,
  OwnershipType,
} from '@/lib/types';

export function useLandDocuments(projectId: string | null | undefined) {
  const [documents, setDocuments] = useState<ProjectLandDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/land-documents?project_id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch {
      console.error('Failed to fetch land documents');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  return { documents, loading, refetch: fetchDocs };
}

export function useLandOwnershipStatus(projectId: string | null | undefined) {
  const [status, setStatus] = useState<{
    is_verified: boolean;
    total_documents: number;
    verified_documents: number;
    pending_documents: number;
    rejected_documents: number;
    required_types: string[];
    missing_types: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/land-documents/status?project_id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch {
      console.error('Failed to fetch land ownership status');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, loading, refetch: fetchStatus };
}

export function useLandDocumentAudit(projectId: string | null | undefined) {
  const [auditLogs, setAuditLogs] = useState<LandDocumentAudit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAudit = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/land-documents/audit?project_id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.audit || []);
      }
    } catch {
      console.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  return { auditLogs, loading, refetch: fetchAudit };
}

export function useCreateLandDocument() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: {
    project_id: string;
    owner_id: string;
    document_type: string;
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
  }): Promise<ProjectLandDocument | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/land-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to create land document');
      const data = await response.json();
      return data.document as ProjectLandDocument;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useUpdateLandDocument() {
  const [loading, setLoading] = useState(false);

  const update = async (
    id: string,
    input: Partial<{
      verification_status: LandDocumentVerificationStatus;
      rejection_reason: string;
      additional_documents_requested: string;
      verifier_remarks: string;
      document_number: string;
      issuing_authority: string;
      issue_date: string;
      expiry_date: string;
    }>
  ): Promise<ProjectLandDocument | null> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/land-documents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to update land document');
      const data = await response.json();
      return data.document as ProjectLandDocument;
    } catch (err) {
      console.error('Failed to update land document:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading };
}

export function useRequestLandVerification() {
  const [loading, setLoading] = useState(false);

  const requestVerification = async (id: string, remarks?: string): Promise<ProjectLandDocument | null> => {
    setLoading(true);
    try {
      const response = await fetch(`/api/land-documents/${id}/request-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
      });
      if (!response.ok) throw new Error('Failed to request verification');
      const data = await response.json();
      return data.document as ProjectLandDocument;
    } catch (err) {
      console.error('Failed to request verification:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { requestVerification, loading };
}
