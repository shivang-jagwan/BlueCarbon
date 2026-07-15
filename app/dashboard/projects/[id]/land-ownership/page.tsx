'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useProject } from '@/hooks/use-projects';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  LandOwnershipCard,
  LandOwnershipStatusBadge,
  LandOwnershipDocumentsTable,
} from '@/components/land-ownership/LandOwnershipCard';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectLandDocument } from '@/lib/types';

export default function LandOwnershipPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuth();
  const { project, loading } = useProject(projectId);
  const [documents, setDocuments] = React.useState<ProjectLandDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = React.useState(true);
  const [selectedDoc, setSelectedDoc] = React.useState<ProjectLandDocument | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [additionalDocs, setAdditionalDocs] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchDocuments = React.useCallback(async () => {
    setLoadingDocs(true);
    try {
      const response = await fetch(`/api/land-documents?project_id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch {
      console.error('Failed to fetch land documents');
    } finally {
      setLoadingDocs(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleVerify = async (docId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/land-documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_status: 'verified',
          verified_by: user?.id,
        }),
      });
      if (!response.ok) throw new Error('Failed to verify document');
      toast.success('Document verified successfully');
      await fetchDocuments();
      setSelectedDoc(null);
    } catch {
      toast.error('Failed to verify document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (docId: string) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(`/api/land-documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_status: 'rejected',
          rejection_reason: rejectReason.trim(),
        }),
      });
      if (!response.ok) throw new Error('Failed to reject document');
      toast.success('Document rejected');
      await fetchDocuments();
      setSelectedDoc(null);
      setRejectReason('');
    } catch {
      toast.error('Failed to reject document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestAdditional = async (docId: string) => {
    if (!additionalDocs.trim()) {
      toast.error('Please specify what additional documents are needed');
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(`/api/land-documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_status: 'additional_required',
          additional_documents_requested: additionalDocs.trim(),
        }),
      });
      if (!response.ok) throw new Error('Failed to request additional documents');
      toast.success('Additional documents requested');
      await fetchDocuments();
      setSelectedDoc(null);
      setAdditionalDocs('');
    } catch {
      toast.error('Failed to request additional documents');
    } finally {
      setActionLoading(false);
    }
  };

  const verifiedCount = documents.filter(d => d.verification_status === 'verified').length;
  const pendingCount = documents.filter(d => d.verification_status === 'submitted').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Land Ownership Verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and verify land ownership documents for this project
          </p>
        </div>
        <LandOwnershipStatusBadge
          isVerified={verifiedCount >= 2 && pendingCount === 0}
          totalDocuments={documents.length}
          verifiedDocuments={verifiedCount}
          pendingDocuments={pendingCount}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{documents.length}</p>
              <p className="text-xs text-muted-foreground">Total Documents</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{verifiedCount}</p>
              <p className="text-xs text-muted-foreground">Verified</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </div>
          </div>
        </Card>
      </div>

      {loadingDocs ? (
        <div className="flex items-center justify-center py-12">
          <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No land documents uploaded</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The project owner has not uploaded any land ownership documents yet
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <LandOwnershipCard
              key={doc.id}
              document={doc}
              showActions={doc.verification_status === 'submitted'}
              onVerify={(id) => {
                setSelectedDoc(doc);
                handleVerify(id);
              }}
              onReject={(id) => {
                setSelectedDoc(doc);
              }}
              onRequestAdditional={(id) => {
                setSelectedDoc(doc);
              }}
            />
          ))}
        </div>
      )}

      {selectedDoc && (selectedDoc.verification_status === 'submitted') && (
        <Card className="p-6 border-l-4 border-l-primary">
          <h3 className="font-semibold mb-4">Review: {selectedDoc.file_name || 'Untitled Document'}</h3>
          <div className="space-y-4">
            <div>
              <Label>Reject with reason</Label>
              <Textarea
                placeholder="Provide a reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1.5"
              />
              <Button
                variant="destructive"
                size="sm"
                className="mt-2"
                disabled={!rejectReason.trim() || actionLoading}
                onClick={() => handleReject(selectedDoc.id)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject Document
              </Button>
            </div>
            <div>
              <Label>Request additional documents</Label>
              <Textarea
                placeholder="Describe what additional documents are needed..."
                value={additionalDocs}
                onChange={(e) => setAdditionalDocs(e.target.value)}
                className="mt-1.5"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={!additionalDocs.trim() || actionLoading}
                onClick={() => handleRequestAdditional(selectedDoc.id)}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Request Additional
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDoc(null);
                setRejectReason('');
                setAdditionalDocs('');
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
