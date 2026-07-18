'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  FileText, Camera, Eye, Download, CheckCircle2, AlertTriangle, XCircle, Clock,
  ChevronDown, ChevronUp, Send, Loader2, RotateCcw, ExternalLink, FileImage,
  File,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DOCUMENT_CATEGORY_LABELS,
  type SnapshotDocument,
  type SnapshotDocumentCategory,
} from '@/lib/voc-types';
import type { DocumentVerificationStatus } from '@/lib/voc-services';

type DocStatus = DocumentVerificationStatus;

interface Props {
  documents: SnapshotDocument[];
  groundImages: SnapshotDocument[];
  droneImages: SnapshotDocument[];
  docVerifications: Record<string, { status: DocStatus; remarks: string; verified_by?: string; verified_at?: string }>;
  onVerifyDoc: (docId: string, status: DocStatus, remarks: string) => void;
  setDocVerifications: React.Dispatch<React.SetStateAction<Record<string, { status: DocStatus; remarks: string }>>>;
  isImmutable: boolean;
  projectOwnerId?: string;
  projectOwnerName?: string;
  projectName?: string;
}

const CATEGORY_GROUPS: { key: string; label: string; categories: SnapshotDocumentCategory[] }[] = [
  { key: 'land', label: 'Land Ownership', categories: ['land_ownership'] },
  { key: 'govt', label: 'Government Approvals', categories: ['government_approval', 'environmental_clearance'] },
  { key: 'identity', label: 'Identity & Supporting', categories: ['project_details', 'project_metadata', 'supporting_files'] },
  { key: 'other', label: 'Other Documents', categories: ['other', 'evidence'] },
];

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
  verified: { label: 'Verified', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  needs_clarification: { label: 'Needs Clarification', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
};

const DOC_ICONS: Record<SnapshotDocumentCategory, React.ElementType> = {
  land_ownership: FileText, government_approval: FileText, environmental_clearance: FileText,
  project_details: FileText, project_metadata: FileText, ground_images: Camera,
  drone_images: Camera, supporting_files: FileText, evidence: FileText, other: FileText,
};

function isImageType(fileType: string): boolean {
  return fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].some(ext => fileType.includes(ext));
}

function isPdfType(fileType: string): boolean {
  return fileType === 'application/pdf' || fileType.includes('pdf');
}

type ActionDialog = {
  type: 'verify' | 'clarify' | 'reject' | 'view';
  doc: SnapshotDocument;
};

export function DocumentsTab({
  documents, groundImages, droneImages,
  docVerifications, onVerifyDoc, setDocVerifications, isImmutable,
  projectOwnerId, projectOwnerName, projectName,
}: Props) {
  const [selectedDocs, setSelectedDocs] = React.useState<Set<string>>(new Set());
  const [actionDialog, setActionDialog] = React.useState<ActionDialog | null>(null);
  const [actionReason, setActionReason] = React.useState('');
  const [actionComment, setActionComment] = React.useState('');
  const [expandedHistory, setExpandedHistory] = React.useState<Set<string>>(new Set());
  const [submittingAction, setSubmittingAction] = React.useState(false);
  const [imageLoadError, setImageLoadError] = React.useState(false);
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [blobLoading, setBlobLoading] = React.useState(false);

  const allDocs = [...documents, ...groundImages, ...droneImages];
  const totalDocs = allDocs.length;
  const verifiedCount = allDocs.filter(d => docVerifications[d.id]?.status === 'verified').length;
  const clarifyCount = allDocs.filter(d => docVerifications[d.id]?.status === 'needs_clarification').length;
  const rejectedCount = allDocs.filter(d => docVerifications[d.id]?.status === 'rejected').length;
  const pendingCount = totalDocs - verifiedCount - clarifyCount - rejectedCount;
  const allReviewed = totalDocs > 0 && pendingCount === 0;

  const docsByGroup = CATEGORY_GROUPS.map(g => ({
    ...g,
    docs: documents.filter(d => g.categories.includes(d.category)),
  })).filter(g => g.docs.length > 0);

  const viewDoc = actionDialog?.type === 'view' ? actionDialog.doc : null;

  React.useEffect(() => {
    if (!viewDoc?.url) { setBlobUrl(null); return; }
    let cancelled = false;
    setBlobLoading(true);
    setBlobUrl(null);
    setImageLoadError(false);
    fetch(viewDoc.url)
      .then(res => { if (!res.ok) throw new Error('fetch failed'); return res.blob(); })
      .then(blob => {
        if (cancelled) return;
        const type = blob.type || viewDoc.file_type || 'application/octet-stream';
        const url = URL.createObjectURL(new Blob([blob], { type }));
        setBlobUrl(url);
      })
      .catch(() => { if (!cancelled) setBlobUrl(null); })
      .finally(() => { if (!cancelled) setBlobLoading(false); });
    return () => { cancelled = true; };
  }, [viewDoc?.url, viewDoc?.file_type]);

  const toggleSelect = (id: string) => {
    setSelectedDocs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const allIds = allDocs.map(d => d.id);
    setSelectedDocs(prev => prev.size === allDocs.length ? new Set() : new Set(allIds));
  };

  const toggleHistory = (id: string) => {
    setExpandedHistory(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDownload = (doc: SnapshotDocument) => {
    if (!doc.url) { toast.error('Download not available — no file URL'); return; }
    const a = document.createElement('a');
    a.href = doc.url;
    a.download = doc.name;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleBulkAction = async (status: DocStatus) => {
    if (selectedDocs.size === 0) return;
    setSubmittingAction(true);
    try {
      for (const docId of Array.from(selectedDocs)) {
        await onVerifyDoc(docId, status, '');
      }
      toast.success(`${selectedDocs.size} document(s) marked as ${status.replace(/_/g, ' ')}`);
      setSelectedDocs(new Set());
    } catch { toast.error('Bulk action failed'); }
    setSubmittingAction(false);
  };

  const executeAction = async () => {
    if (!actionDialog) return;
    setSubmittingAction(true);
    try {
      if (actionDialog.type === 'verify') {
        await onVerifyDoc(actionDialog.doc.id, 'verified', actionComment);
      } else if (actionDialog.type === 'clarify') {
        await onVerifyDoc(actionDialog.doc.id, 'needs_clarification', actionReason);
      } else if (actionDialog.type === 'reject') {
        await onVerifyDoc(actionDialog.doc.id, 'rejected', actionReason);
      }
      toast.success(
        actionDialog.type === 'verify' ? 'Document verified' :
        actionDialog.type === 'clarify' ? 'Clarification requested — applicant notified' :
        'Document rejected — applicant notified'
      );
      setActionDialog(null);
      setActionReason('');
      setActionComment('');
    } catch { toast.error('Action failed'); }
    setSubmittingAction(false);
  };

  if (totalDocs === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No documents found in the application.</p>
      </div>
    );
  }

  function renderDocCard(doc: SnapshotDocument) {
    const verification = docVerifications[doc.id];
    const status: DocStatus = verification?.status || 'pending';
    const remarks = verification?.remarks || '';
    const verifiedBy = verification?.verified_by || '';
    const verifiedAt = verification?.verified_at || '';
    const Icon = DOC_ICONS[doc.category] || FileText;
    const cfg = STATUS_CONFIG[status];
    const StatusIcon = cfg.icon;
    const isChecked = selectedDocs.has(doc.id);
    const isHistoryExpanded = expandedHistory.has(doc.id);
    const hasHistory = status !== 'pending' || remarks;
    const hasFile = !!doc.url;

    return (
      <div key={doc.id} className={cn(
        'p-4 rounded-lg border transition-colors',
        isChecked ? 'border-primary/40 bg-primary/5' : 'border-border/60 hover:bg-muted/30',
      )}>
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isChecked}
            onCheckedChange={() => toggleSelect(doc.id)}
            disabled={isImmutable}
            className="mt-1 shrink-0"
          />
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium truncate">{doc.name}</p>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{doc.file_type}</Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700">
                {DOCUMENT_CATEGORY_LABELS[doc.category]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span>{doc.file_size}</span>
              <span>Uploaded: {doc.uploaded_date ? new Date(doc.uploaded_date).toLocaleDateString() : '—'}</span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={cn('text-[10px] border', cfg.color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {cfg.label}
              </Badge>
              {!hasFile && status === 'pending' && (
                <Badge variant="outline" className="text-[10px] border border-orange-200 bg-orange-50 text-orange-600">
                  No file
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                onClick={() => { setImageLoadError(false); setActionDialog({ type: 'view', doc }); }}>
                <Eye className="h-3 w-3" /> View
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                onClick={() => handleDownload(doc)} disabled={!hasFile}>
                <Download className="h-3 w-3" /> Download
              </Button>
              <Separator orientation="vertical" className="h-5 mx-0.5" />
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => { setActionComment(remarks); setActionDialog({ type: 'verify', doc }); }}
                disabled={isImmutable || status === 'verified'}
              >
                <CheckCircle2 className="h-3 w-3" /> Verify
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={() => { setActionReason(remarks); setActionDialog({ type: 'clarify', doc }); }}
                disabled={isImmutable || status === 'needs_clarification'}
              >
                <AlertTriangle className="h-3 w-3" /> Clarification
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => { setActionReason(remarks); setActionDialog({ type: 'reject', doc }); }}
                disabled={isImmutable || status === 'rejected'}
              >
                <XCircle className="h-3 w-3" /> Reject
              </Button>
            </div>

            {remarks && (
              <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                {remarks}
              </div>
            )}

            {hasHistory && (
              <button
                onClick={() => toggleHistory(doc.id)}
                className="mt-2 flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                {isHistoryExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {isHistoryExpanded ? 'Hide' : 'Show'} history
              </button>
            )}
            {isHistoryExpanded && (
              <div className="mt-1 ml-1 pl-3 border-l-2 border-primary/20 space-y-1 text-[11px]">
                {status !== 'pending' && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <StatusIcon className="h-3 w-3" />
                    <span>Status: <strong className="text-foreground">{cfg.label}</strong></span>
                  </div>
                )}
                {verifiedBy && <div className="text-muted-foreground">By: {verifiedBy}</div>}
                {verifiedAt && <div className="text-muted-foreground">At: {new Date(verifiedAt).toLocaleString()}</div>}
                {remarks && <div className="text-muted-foreground">Comment: {remarks}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderDocumentPreview(doc: SnapshotDocument) {
    const fileType = doc.file_type || '';

    if (blobLoading) {
      return (
        <div className="rounded-lg border bg-muted/30 p-8 text-center min-h-[300px] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading document...</span>
        </div>
      );
    }

    if (!doc.url && !blobUrl) {
      return (
        <div className="rounded-lg border bg-muted/30 p-8 text-center">
          <File className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No file available for preview.</p>
          <p className="text-xs text-muted-foreground mt-1">File: {doc.name}</p>
        </div>
      );
    }

    if (!blobUrl) {
      return (
        <div className="rounded-lg border bg-muted/30 p-8 text-center">
          <File className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Could not load document for preview.</p>
          {doc.url && (
            <a href={doc.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
              Open in new tab <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      );
    }

    if (isImageType(fileType)) {
      if (imageLoadError) {
        return (
          <div className="rounded-lg border bg-muted/30 p-8 text-center">
            <FileImage className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Image could not be loaded.</p>
            <a href={doc.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
              Open in new tab <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        );
      }
      return (
        <div className="rounded-lg border bg-black/5 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={blobUrl}
            alt={doc.name}
            className="max-w-full max-h-[500px] object-contain"
            onError={() => setImageLoadError(true)}
          />
        </div>
      );
    }

    if (isPdfType(fileType)) {
      return (
        <div className="rounded-lg border overflow-hidden min-h-[400px]">
          <object
            data={blobUrl}
            type="application/pdf"
            className="w-full h-[500px]"
          >
            <div className="p-8 text-center text-sm text-muted-foreground">
              PDF preview not supported in this browser.
              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline ml-2 inline-flex items-center gap-1">
                Open in new tab <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </object>
        </div>
      );
    }

    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center">
        <File className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Preview not available for this file type ({fileType}).</p>
        <a href={doc.url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
          Open in new tab <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-lg font-bold">{totalDocs}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3 text-center">
          <p className="text-lg font-bold text-emerald-600">{verifiedCount}</p>
          <p className="text-[10px] text-emerald-600">Verified</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-3 text-center">
          <p className="text-lg font-bold text-amber-600">{clarifyCount}</p>
          <p className="text-[10px] text-amber-600">Clarification</p>
        </div>
        <div className="rounded-lg bg-red-50 p-3 text-center">
          <p className="text-lg font-bold text-red-600">{rejectedCount}</p>
          <p className="text-[10px] text-red-600">Rejected</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-lg font-bold">{pendingCount}</p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </div>
      </div>

      {!isImmutable && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/20">
          <Checkbox
            checked={selectedDocs.size === allDocs.length && allDocs.length > 0}
            onCheckedChange={toggleAll}
          />
          <span className="text-xs text-muted-foreground">
            {selectedDocs.size === 0 ? 'Select documents' : `${selectedDocs.size} selected`}
          </span>
          <div className="flex-1" />
          {selectedDocs.size > 0 && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-emerald-200 text-emerald-700"
                onClick={() => handleBulkAction('verified')} disabled={submittingAction}>
                {submittingAction ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                Approve Selected
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-red-200 text-red-700"
                onClick={() => handleBulkAction('rejected')} disabled={submittingAction}>
                {submittingAction ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                Reject Selected
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1"
                onClick={() => setSelectedDocs(new Set())}>
                <RotateCcw className="h-3 w-3" /> Clear
              </Button>
            </div>
          )}
        </div>
      )}

      {allReviewed && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          All documents have been reviewed.
        </div>
      )}

      {docsByGroup.map(group => (
        <Card key={group.key} className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {group.label}
              <Badge variant="outline" className="text-[10px]">{group.docs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.docs.map(renderDocCard)}
          </CardContent>
        </Card>
      ))}

      {groundImages.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" /> Ground Images ({groundImages.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {groundImages.map(renderDocCard)}
          </CardContent>
        </Card>
      )}

      {droneImages.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" /> Drone Images ({droneImages.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {droneImages.map(renderDocCard)}
          </CardContent>
        </Card>
      )}

      {/* View Dialog */}
      <Dialog open={actionDialog?.type === 'view'} onOpenChange={open => { if (!open) { setActionDialog(null); setImageLoadError(false); if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); } } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewDoc?.name || 'Document Preview'}</DialogTitle>
            {viewDoc && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-[10px]">{viewDoc.file_type}</Badge>
                <span className="text-xs">{viewDoc.file_size}</span>
                {viewDoc.uploaded_date && (
                  <span className="text-xs">Uploaded {new Date(viewDoc.uploaded_date).toLocaleDateString()}</span>
                )}
              </div>
            )}
          </DialogHeader>

          {viewDoc && (
            <div className="space-y-4">
              {renderDocumentPreview(viewDoc)}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Category</span>
                  <p>{DOCUMENT_CATEGORY_LABELS[viewDoc.category]}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Uploaded By</span>
                  <p>{projectOwnerName || '—'}</p>
                </div>
              </div>

              {viewDoc.url && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => handleDownload(viewDoc)}>
                    <Download className="h-3 w-3" /> Download
                  </Button>
                  <a href={viewDoc.url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="gap-1">
                      <ExternalLink className="h-3 w-3" /> Open in New Tab
                    </Button>
                  </a>
                </div>
              )}

              {docVerifications[viewDoc.id]?.remarks && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <span className="text-muted-foreground">Comment: </span>{docVerifications[viewDoc.id].remarks}
                </div>
              )}

              {!isImmutable && (
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1"
                    onClick={() => { setActionComment(''); setActionDialog({ type: 'verify', doc: viewDoc }); }}>
                    <CheckCircle2 className="h-3 w-3" /> Verify
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 border-amber-200 text-amber-700"
                    onClick={() => { setActionReason(''); setActionDialog({ type: 'clarify', doc: viewDoc }); }}>
                    <AlertTriangle className="h-3 w-3" /> Needs Clarification
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 border-red-200 text-red-700"
                    onClick={() => { setActionReason(''); setActionDialog({ type: 'reject', doc: viewDoc }); }}>
                    <XCircle className="h-3 w-3" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify / Clarify / Reject Action Dialogs */}
      {actionDialog && actionDialog.type !== 'view' && (
        <Dialog open={true} onOpenChange={open => { if (!open) { setActionDialog(null); setActionReason(''); setActionComment(''); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {actionDialog.type === 'verify' ? 'Approve Document' :
                 actionDialog.type === 'clarify' ? 'Request Clarification' :
                 'Reject Document'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {actionDialog.type === 'verify' ? 'Approve this document?' :
                 actionDialog.type === 'clarify' ? 'Request clarification from the applicant.' :
                 'Reject this document. The applicant will be notified.'}
              </p>

              {actionDialog.type === 'verify' ? (
                <div className="space-y-2">
                  <Label className="text-sm">Comment (optional)</Label>
                  <Textarea value={actionComment} onChange={e => setActionComment(e.target.value)}
                    placeholder="Ownership matches submitted details." rows={2} className="resize-none" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm">Reason *</Label>
                  <Textarea value={actionReason} onChange={e => setActionReason(e.target.value)}
                    placeholder={actionDialog.type === 'clarify' ? 'Please upload page 2.' : 'Land document is expired.'}
                    rows={3} className="resize-none" />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => { setActionDialog(null); setActionReason(''); setActionComment(''); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={executeAction} disabled={submittingAction || (actionDialog.type !== 'verify' && !actionReason.trim())}
                className={cn(
                  actionDialog.type === 'verify' && 'bg-emerald-600 hover:bg-emerald-700',
                  actionDialog.type === 'reject' && 'bg-red-600 hover:bg-red-700',
                  actionDialog.type === 'clarify' && 'bg-amber-600 hover:bg-amber-700',
                )}>
                {submittingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  actionDialog.type === 'verify' ? <><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</> :
                  actionDialog.type === 'clarify' ? <><Send className="h-4 w-4 mr-1" /> Send Request</> :
                  <><XCircle className="h-4 w-4 mr-1" /> Reject</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
