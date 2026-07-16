'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import type {
  ProjectDocumentV2,
  DocumentCategory,
  DocumentWorkflowStatus,
} from '@/lib/types';
import {
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_STATUS_LABELS,
  documentStatusColor,
} from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  FileText,
  Upload,
  Download,
  Eye,
  ChevronRight,
  FolderOpen,
  Clock,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  File,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES: DocumentCategory[] = [
  'land_ownership',
  'government_approval',
  'environmental_clearance',
  'lease_agreement',
  'community_certificate',
  'project_proposal',
  'restoration_plan',
  'survey_document',
  'gis_report',
  'carbon_report',
  'other',
];

const ALL_CATEGORIES_KEY = '__all__';

export default function DocumentsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project } = useProject(projectId);
  const { profile } = useAuth();

  const [documents, setDocuments] = React.useState<ProjectDocumentV2[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState<string>(ALL_CATEGORIES_KEY);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [historyDoc, setHistoryDoc] = React.useState<ProjectDocumentV2 | null>(null);

  const fetchDocuments = React.useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const { data } = await supabase
      .from('project_documents_v2')
      .select('*')
      .eq('project_id', projectId)
      .order('category')
      .order('version', { ascending: false });
    setDocuments((data as ProjectDocumentV2[]) || []);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach((doc) => {
      counts[doc.category] = (counts[doc.category] || 0) + 1;
    });
    return counts;
  }, [documents]);

  const filteredDocs = React.useMemo(() => {
    if (selectedCategory === ALL_CATEGORIES_KEY) return documents;
    return documents.filter((doc) => doc.category === selectedCategory);
  }, [documents, selectedCategory]);

  const groupedDocs = React.useMemo(() => {
    const groups: Record<string, ProjectDocumentV2[]> = {};
    filteredDocs.forEach((doc) => {
      if (!groups[doc.category]) groups[doc.category] = [];
      groups[doc.category].push(doc);
    });
    return groups;
  }, [filteredDocs]);

  const handleDownload = async (doc: ProjectDocumentV2) => {
    try {
      const { data } = await supabase.storage
        .from('project-documents')
        .createSignedUrl(doc.storage_path, 60);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        toast.error('Could not generate download link');
      }
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Project Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organized by category with verification workflow
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <UploadDocumentDialog
              projectId={projectId}
              onClose={() => setIsUploadOpen(false)}
              onSuccess={() => {
                setIsUploadOpen(false);
                fetchDocuments();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Category Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
              Categories
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory(ALL_CATEGORIES_KEY)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                  selectedCategory === ALL_CATEGORIES_KEY
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  All Documents
                </span>
                <span className="text-xs text-muted-foreground">{documents.length}</span>
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                    selectedCategory === cat
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {DOCUMENT_CATEGORY_LABELS[cat]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {categoryCounts[cat] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <h3 className="font-semibold">No documents in this category yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload documents to get started with verification.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedDocs).map(([cat, catDocs]) => (
                <div key={cat}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                    {DOCUMENT_CATEGORY_LABELS[cat as DocumentCategory]}
                  </h3>
                  <div className="space-y-3">
                    {catDocs.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc}
                        onDownload={() => handleDownload(doc)}
                        onViewHistory={() => setHistoryDoc(doc)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Version History Drawer */}
      {historyDoc && (
        <VersionHistoryDrawer
          doc={historyDoc}
          allDocs={documents}
          onClose={() => setHistoryDoc(null)}
        />
      )}
    </div>
  );
}

function DocumentCard({
  doc,
  onDownload,
  onViewHistory,
}: {
  doc: ProjectDocumentV2;
  onDownload: () => void;
  onViewHistory: () => void;
}) {
  const statusIcon = (status: DocumentWorkflowStatus) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'rejected':
        return <XCircle className="h-3.5 w-3.5" />;
      case 'under_review':
        return <Clock className="h-3.5 w-3.5" />;
      case 'submitted':
        return <ShieldCheck className="h-3.5 w-3.5" />;
      case 'revision_requested':
        return <AlertTriangle className="h-3.5 w-3.5" />;
      default:
        return <File className="h-3.5 w-3.5" />;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600">
          <FileText className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium truncate">{doc.document_name}</p>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                documentStatusColor(doc.status)
              )}
            >
              {statusIcon(doc.status)}
              {DOCUMENT_STATUS_LABELS[doc.status]}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>Version: {doc.version}</span>
            <span>
              Uploaded: {new Date(doc.created_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            {doc.file_name && (
              <span>
                File: {doc.file_name}
                {doc.file_size ? ` (${formatFileSize(doc.file_size)})` : ''}
              </span>
            )}
          </div>
          {doc.verified_by && (
            <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
              <p>Verified by: {doc.verified_by}</p>
              {doc.verified_at && (
                <p>
                  Verification Date:{' '}
                  {new Date(doc.verified_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              )}
              {doc.verification_comments && (
                <p>Comments: {doc.verification_comments}</p>
              )}
            </div>
          )}
          {doc.rejection_reason && (
            <div className="mt-2 rounded-lg bg-red-50 dark:bg-red-900/10 p-2 text-xs text-red-700 dark:text-red-300">
              Rejection reason: {doc.rejection_reason}
            </div>
          )}
          {doc.description && (
            <p className="mt-2 text-xs text-muted-foreground">{doc.description}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
          onClick={onDownload}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={onViewHistory}
        >
          <Eye className="h-3.5 w-3.5" />
          View History
        </Button>
      </div>
    </div>
  );
}

function VersionHistoryDrawer({
  doc,
  allDocs,
  onClose,
}: {
  doc: ProjectDocumentV2;
  allDocs: ProjectDocumentV2[];
  onClose: () => void;
}) {
  const versions = React.useMemo(() => {
    return allDocs
      .filter(
        (d) =>
          d.category === doc.category &&
          d.document_name === doc.document_name
      )
      .sort((a, b) => b.version - a.version);
  }, [allDocs, doc]);

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            {doc.document_name} &mdash; {versions.length} version
            {versions.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-4">
          {versions.map((v, idx) => (
            <div
              key={v.id}
              className={cn(
                'rounded-xl border p-4',
                v.id === doc.id
                  ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Version {v.version}</span>
                  {idx === 0 && (
                    <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 text-xs font-medium">
                      Current
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                    documentStatusColor(v.status)
                  )}
                >
                  {DOCUMENT_STATUS_LABELS[v.status]}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                <p>
                  Uploaded:{' '}
                  {new Date(v.created_at).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                {v.file_name && <p>File: {v.file_name}</p>}
                {v.verified_by && <p>Verified by: {v.verified_by}</p>}
                {v.verification_comments && (
                  <p>Comments: {v.verification_comments}</p>
                )}
                {v.rejection_reason && (
                  <p className="text-red-600 dark:text-red-400">
                    Rejection: {v.rejection_reason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadDocumentDialog({
  projectId,
  onClose,
  onSuccess,
}: {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [category, setCategory] = React.useState<DocumentCategory | ''>('');
  const [documentName, setDocumentName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    if (!documentName.trim()) {
      toast.error('Document name is required');
      return;
    }
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${projectId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-documents')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('project_documents_v2')
        .insert({
          project_id: projectId,
          category,
          document_name: documentName.trim(),
          description: description.trim() || null,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          storage_path: filePath,
          public_url: urlData?.publicUrl || null,
          version: 1,
          status: 'uploaded',
        });

      if (insertError) throw insertError;

      toast.success('Document uploaded successfully');
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogDescription>
          Upload project documents for verification workflow.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {DOCUMENT_CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Document Name *</Label>
          <Input
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            placeholder="e.g. Land Registry Certificate"
          />
        </div>
        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the document..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>File (PDF, JPEG, PNG)</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900/20 dark:file:text-green-300"
          />
          {file && (
            <p className="text-xs text-muted-foreground">{file.name}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || !file || !category || !documentName.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </div>
    </>
  );
}
