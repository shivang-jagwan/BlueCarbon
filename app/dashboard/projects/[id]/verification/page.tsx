'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { getActiveApplicationForProject, submitApplication } from '@/lib/voc-services';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  DOCUMENT_CATEGORY_LABELS,
  type VerificationApplication,
  type ProjectSnapshot,
  type SnapshotDocument,
  type SnapshotDocumentCategory,
} from '@/lib/voc-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  FileText,
  Map,
  Camera,
  Image,
  FolderOpen,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Shield,
  Clock,
  Eye,
  Award,
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  File,
  CalendarDays,
  Upload,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, label: 'Project Summary', icon: FileText },
  { id: 2, label: 'Documents', icon: FolderOpen },
  { id: 3, label: 'Evidence', icon: Camera },
  { id: 4, label: 'Declaration', icon: Shield },
  { id: 5, label: 'Review & Submit', icon: Send },
];

const PROJECT_TYPE_LABELS: Record<string, string> = {
  mangrove: 'Mangrove Restoration',
  seagrass: 'Seagrass Conservation',
  salt_marsh: 'Salt Marsh Restoration',
  kelp_forest: 'Kelp Forest Restoration',
  mixed: 'Mixed Blue Carbon',
};

const ADDITIONAL_DOC_CATEGORIES: { value: SnapshotDocumentCategory; label: string }[] = [
  { value: 'land_ownership', label: 'Land Ownership' },
  { value: 'government_approval', label: 'Government Approval' },
  { value: 'environmental_clearance', label: 'Environmental Clearance' },
  { value: 'other', label: 'Other' },
];

interface AdditionalDocument {
  id: string;
  name: string;
  category: SnapshotDocumentCategory;
  file_type: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function ActiveApplicationCard({ application, projectId }: { application: VerificationApplication; projectId: string }) {
  const router = useRouter();
  const statusColor = APPLICATION_STATUS_COLORS[application.status];

  return (
    <Card className="rounded-xl border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display">Active Verification Application</CardTitle>
          <Badge className={cn('border-0 text-xs font-semibold', statusColor)}>
            {APPLICATION_STATUS_LABELS[application.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Application Number</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">
              {application.application_number}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {APPLICATION_STATUS_LABELS[application.status]}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Submitted Date</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {formatDate(application.submitted_date)}
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Project Records Locked</p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Verification Application is under review. Project records are locked until the certification process is completed.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/projects/${projectId}/verification/view/${application.id}`)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View Application
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SuccessState({ applicationNumber }: { applicationNumber: string }) {
  return (
    <Card className="rounded-xl border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 font-display">
          Application Submitted
        </h3>
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300 max-w-md">
          Your verification application has been submitted successfully. The project snapshot has been created and certification-related records are now read-only.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 px-4 py-2.5">
          <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 font-mono">
            {applicationNumber}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function StepIndicator({ currentStep, steps }: { currentStep: number; steps: typeof STEPS }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        return (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors shrink-0',
                isActive && 'bg-primary/10 text-primary',
                isCompleted && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
                !isActive && !isCompleted && 'text-slate-400 dark:text-slate-600',
              )}
            >
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  isActive && 'bg-primary text-primary-foreground',
                  isCompleted && 'bg-emerald-500 text-white',
                  !isActive && !isCompleted && 'bg-slate-200 dark:bg-slate-800 text-slate-500',
                )}
              >
                {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.id}
              </div>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn('h-px w-4 shrink-0', isCompleted ? 'bg-emerald-300' : 'bg-slate-200 dark:bg-slate-800')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Step1ProjectSummary({ project }: { project: any }) {
  const summaryFields = [
    { label: 'Project Name', value: project?.name || '—' },
    { label: 'Project Type', value: PROJECT_TYPE_LABELS[project?.project_type] || project?.project_type || '—' },
    { label: 'Owner Name', value: project?.owner_name || '—' },
    { label: 'Area', value: project?.area_hectares ? `${project.area_hectares} hectares` : '—' },
    { label: 'Location', value: project?.location_name || '—' },
    { label: 'Description', value: project?.description || '—', full: true },
    { label: 'Current Status', value: project?.verification_status || '—' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {summaryFields.map((field) => (
          <div
            key={field.label}
            className={cn('space-y-1.5', field.full && 'sm:col-span-2')}
          >
            <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">{field.label}</Label>
            {field.full ? (
              <Textarea
                value={String(field.value)}
                readOnly
                className="min-h-[80px] resize-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            ) : (
              <Input
                value={String(field.value)}
                readOnly
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Step2Documents({
  projectDocuments,
  additionalDocs,
  onAddDoc,
  onRemoveDoc,
  onUploadFile,
  uploading,
}: {
  projectDocuments: SnapshotDocument[];
  additionalDocs: AdditionalDocument[];
  onAddDoc: (doc: AdditionalDocument) => void;
  onRemoveDoc: (id: string) => void;
  onUploadFile: (file: File, name: string, category: SnapshotDocumentCategory) => Promise<void>;
  uploading: boolean;
}) {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [showUploadForm, setShowUploadForm] = React.useState(false);
  const [newDocName, setNewDocName] = React.useState('');
  const [newDocCategory, setNewDocCategory] = React.useState<SnapshotDocumentCategory>('other');
  const [newDocFileType, setNewDocFileType] = React.useState('');
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadName, setUploadName] = React.useState('');
  const [uploadCategory, setUploadCategory] = React.useState<SnapshotDocumentCategory>('other');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function handleAdd() {
    if (!newDocName.trim()) return;
    onAddDoc({
      id: `add-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newDocName.trim(),
      category: newDocCategory,
      file_type: newDocFileType.trim() || 'Document',
    });
    setNewDocName('');
    setNewDocCategory('other');
    setNewDocFileType('');
    setShowAddForm(false);
  }

  async function handleUpload() {
    if (!uploadFile || !uploadName.trim()) return;
    await onUploadFile(uploadFile, uploadName.trim(), uploadCategory);
    setUploadFile(null);
    setUploadName('');
    setUploadCategory('other');
    setShowUploadForm(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadName(file.name.replace(/\.[^.]+$/, ''));
    setShowUploadForm(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="space-y-4">
      {projectDocuments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Project Documents</p>
          <div className="space-y-2">
            {projectDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <File className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {DOCUMENT_CATEGORY_LABELS[doc.category] || doc.category}
                    </Badge>
                    <span className="text-[10px] text-slate-400">{doc.file_type}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(doc.uploaded_date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {additionalDocs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Additional Documents</p>
          <div className="space-y-2">
            {additionalDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <File className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {DOCUMENT_CATEGORY_LABELS[doc.category] || doc.category}
                    </Badge>
                    <span className="text-[10px] text-slate-400">{doc.file_type}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveDoc(doc.id)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {projectDocuments.length === 0 && additionalDocs.length === 0 && (
        <div className="text-center py-8 text-sm text-slate-400">No documents found for this project.</div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading...' : 'Upload Document'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-2 border-dashed"
        >
          <Plus className="h-4 w-4" />
          Add Reference
        </Button>
      </div>

      {showUploadForm && uploadFile && (
        <Card className="border-dashed border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Upload File</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShowUploadForm(false); setUploadFile(null); }} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 flex items-center gap-2">
              <File className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{uploadFile.name}</span>
              <span className="text-[10px] text-slate-400 ml-auto shrink-0">{(uploadFile.size / 1024).toFixed(0)} KB</span>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Document Name</Label>
              <Input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="Enter document name" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Category</Label>
              <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as SnapshotDocumentCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADDITIONAL_DOC_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpload} disabled={!uploadName.trim() || uploading} className="gap-2" size="sm">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? 'Uploading...' : 'Upload & Attach'}
            </Button>
          </CardContent>
        </Card>
      )}

      {showAddForm && (
        <Card className="border-dashed border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Add Document Reference</p>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Document Name</Label>
              <Input
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="Enter document name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Category</Label>
                <Select value={newDocCategory} onValueChange={(v) => setNewDocCategory(v as SnapshotDocumentCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDITIONAL_DOC_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">File Type</Label>
                <Input
                  value={newDocFileType}
                  onChange={(e) => setNewDocFileType(e.target.value)}
                  placeholder="e.g. PDF, JPG"
                />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={!newDocName.trim()} className="gap-2" size="sm">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Step3Evidence({ galleryItems, onUploadEvidence, uploading }: { galleryItems: any[]; onUploadEvidence: (files: FileList) => Promise<void>; uploading: boolean }) {
  const imageCount = galleryItems.filter((g) => g.type === 'image').length;
  const videoCount = galleryItems.filter((g) => g.type === 'video').length;
  const docCount = galleryItems.filter((g) => g.type === 'document').length;
  const evidenceInputRef = React.useRef<HTMLInputElement>(null);

  async function handleEvidenceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await onUploadEvidence(files);
    if (evidenceInputRef.current) evidenceInputRef.current.value = '';
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
            <Image className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{imageCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Images</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{videoCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Videos</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{docCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Documents</p>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={evidenceInputRef}
        onChange={handleEvidenceUpload}
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx"
        multiple
      />
      <Button
        variant="outline"
        onClick={() => evidenceInputRef.current?.click()}
        disabled={uploading}
        className="gap-2"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? 'Uploading...' : 'Upload Evidence'}
      </Button>

      {galleryItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Evidence Items</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {galleryItems.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                {item.url && (
                  <div className="aspect-video bg-slate-100 dark:bg-slate-800">
                    {item.type === 'image' ? (
                      <img src={item.url} alt={item.title || ''} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {item.type === 'video' ? (
                          <Camera className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        ) : (
                          <File className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{item.title || 'Untitled'}</p>
                  {item.created_at && (
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(item.created_at)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {galleryItems.length === 0 && (
        <div className="text-center py-8 text-sm text-slate-400">No evidence items found for this project.</div>
      )}
    </div>
  );
}

function Step4Declaration({
  confirmed,
  onConfirmChange,
}: {
  confirmed: boolean;
  onConfirmChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Certification Declaration</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Please review and confirm the accuracy of all project information before submitting the verification application.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Important</p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            Once submitted, the verification application and all attached documents become immutable. This action cannot be undone.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
            <li className="flex items-center gap-2">
              <Lock className="h-3 w-3 shrink-0" />
              Project documents will be locked
            </li>
            <li className="flex items-center gap-2">
              <Lock className="h-3 w-3 shrink-0" />
              Evidence center will become read-only
            </li>
            <li className="flex items-center gap-2">
              <Lock className="h-3 w-3 shrink-0" />
              Application data snapshot will be frozen
            </li>
          </ul>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
        <Checkbox
          checked={confirmed}
          onCheckedChange={(checked) => onConfirmChange(checked === true)}
          className="mt-0.5"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300">
          I confirm that all information provided is accurate and complete. I understand that once submitted, the verification application and all attached documents become immutable.
        </span>
      </label>
    </div>
  );
}

function Step5Review({
  project,
  projectDocuments,
  additionalDocs,
  galleryItems,
}: {
  project: any;
  projectDocuments: SnapshotDocument[];
  additionalDocs: AdditionalDocument[];
  galleryItems: any[];
}) {
  const totalDocs = projectDocuments.length + additionalDocs.length;
  const imageCount = galleryItems.filter((g) => g.type === 'image').length;
  const videoCount = galleryItems.filter((g) => g.type === 'video').length;

  const reviewSections = [
    { label: 'Project Name', value: project?.name || '—' },
    { label: 'Project Type', value: PROJECT_TYPE_LABELS[project?.project_type] || '—' },
    { label: 'Area', value: project?.area_hectares ? `${project.area_hectares} ha` : '—' },
    { label: 'Location', value: project?.location_name || '—' },
    { label: 'Total Documents', value: `${totalDocs} (${projectDocuments.length} existing + ${additionalDocs.length} additional)` },
    { label: 'Evidence Items', value: `${galleryItems.length} (${imageCount} images, ${videoCount} videos)` },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        {reviewSections.map((section) => (
          <div key={section.label} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">{section.label}</span>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{section.value}</span>
          </div>
        ))}
      </div>

      {additionalDocs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Additional Documents</p>
          <div className="space-y-1">
            {additionalDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <File className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{doc.name}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">
                  {DOCUMENT_CATEGORY_LABELS[doc.category]}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
        <div className="flex items-start gap-3">
          <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Ready to Submit</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              By clicking &quot;Submit Verification Application&quot; below, you confirm all data is accurate and authorize the creation of an immutable project snapshot.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-72 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-4 w-96 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
      <div className="h-12 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="h-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 animate-pulse">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function VerificationSubmitPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { project, loading: projectLoading } = useProject(projectId);
  const { profile } = useAuth();

  const [activeApplication, setActiveApplication] = React.useState<VerificationApplication | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [step, setStep] = React.useState(1);
  const [projectDocuments, setProjectDocuments] = React.useState<SnapshotDocument[]>([]);
  const [galleryItems, setGalleryItems] = React.useState<any[]>([]);
  const [additionalDocs, setAdditionalDocs] = React.useState<AdditionalDocument[]>([]);
  const [confirmed, setConfirmed] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submittedApp, setSubmittedApp] = React.useState<VerificationApplication | null>(null);
  const [uploadingDoc, setUploadingDoc] = React.useState(false);
  const [uploadingEvidence, setUploadingEvidence] = React.useState(false);

  React.useEffect(() => {
    if (!projectId) return;
    const app = getActiveApplicationForProject(projectId);
    setActiveApplication(app || null);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    if (!projectId || activeApplication) return;
    (async () => {
      const { data: docs } = await supabase
        .from('project_documents_v2')
        .select('*')
        .eq('project_id', projectId);
      setProjectDocuments((docs as SnapshotDocument[]) || []);

      const { data: gallery } = await supabase
        .from('project_gallery_items')
        .select('*')
        .eq('project_id', projectId);
      setGalleryItems(gallery || []);
    })();
  }, [projectId, activeApplication]);

  function handleAddDoc(doc: AdditionalDocument) {
    setAdditionalDocs((prev) => [...prev, doc]);
  }

  function handleRemoveDoc(id: string) {
    setAdditionalDocs((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleUploadDocFile(file: File, name: string, category: SnapshotDocumentCategory) {
    if (!profile) return;
    setUploadingDoc(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${projectId}/docs/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('project-documents').getPublicUrl(filePath);

      const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document';

      const { data: docRecord, error: dbError } = await supabase
        .from('project_documents_v2')
        .insert({
          project_id: projectId,
          uploaded_by: profile.id,
          document_name: name,
          category: category,
          file_name: file.name,
          storage_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          status: 'uploaded',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      if (docRecord) {
        setProjectDocuments((prev) => [...prev, docRecord as SnapshotDocument]);
      }

      toast.success('Document uploaded successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleUploadEvidence(files: FileList) {
    if (!profile) return;
    setUploadingEvidence(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${projectId}/evidence/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${fileExt}`;
        const bucket = file.type.startsWith('video/') ? 'project-gallery' : 'project-gallery';

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

        const itemType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document';

        const { data: itemRecord, error: dbError } = await supabase
          .from('project_gallery_items')
          .insert({
            project_id: projectId,
            uploaded_by: profile.id,
            title: file.name,
            type: itemType,
            url: urlData.publicUrl,
            storage_path: filePath,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        if (itemRecord) {
          setGalleryItems((prev) => [...prev, itemRecord]);
        }
      }
      toast.success(`${files.length} file(s) uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload evidence');
    } finally {
      setUploadingEvidence(false);
    }
  }

  async function handleSubmit() {
    if (!project || !profile) return;
    setSubmitting(true);

    try {
      const snapshot: ProjectSnapshot = {
        project_name: project.name,
        project_type: project.project_type,
        location: project.location_name || '',
        latitude: project.center_lat || 0,
        longitude: project.center_lng || 0,
        area_hectares: project.area_hectares || 0,
        description: project.description || '',
        methodology: '',
        start_date: project.start_date || '',
        target_end_date: project.end_date || '',
        estimated_carbon_sequestration: project.target_carbon_tonnes || 0,
        ngo_name: '',
        owner_name: profile.full_name || '',
        owner_email: profile.email || '',
        owner_organization: '',
        documents: projectDocuments,
        ground_images: [],
        drone_images: [],
        supporting_files: [],
        evidence_items: [],
        captured_at: new Date().toISOString(),
      };

      const result = submitApplication({
        projectId: project.id,
        projectName: project.name,
        projectOwnerId: project.owner_id,
        projectOwnerName: profile.full_name || '',
        ngoId: '',
        ngoName: '',
        snapshot,
        additionalDocuments: additionalDocs.map((d) => ({
          id: d.id,
          name: d.name,
          category: d.category,
          file_type: d.file_type,
          file_size: '',
          uploaded_date: new Date().toISOString(),
          quality_score: 0,
          gps_available: false,
          metadata_available: false,
          ai_summary: {
            confidence_score: 0,
            missing_documents: [],
            quality_issues: [],
            duplicate_detected: false,
            gps_metadata: false,
            image_metadata: false,
            overall_assessment: '',
          },
        })),
      });

      setSubmittedApp(result);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit application:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || projectLoading) {
    return <LoadingSkeleton />;
  }

  if (submitted && submittedApp) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Submit Verification Application</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a snapshot of your project for certification review.
          </p>
        </div>
        <SuccessState applicationNumber={submittedApp.application_number} />
      </div>
    );
  }

  if (activeApplication) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Submit Verification Application</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a snapshot of your project for certification review.
          </p>
        </div>
        <ActiveApplicationCard application={activeApplication} projectId={projectId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Submit Verification Application</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a snapshot of your project for certification review.
        </p>
      </div>

      <StepIndicator currentStep={step} steps={STEPS} />

      <Card className="rounded-xl border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {React.createElement(STEPS[step - 1].icon, { className: 'h-4.5 w-4.5' })}
            </div>
            <div>
              <CardTitle className="text-base font-display">{STEPS[step - 1].label}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Step {step} of {STEPS.length}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && <Step1ProjectSummary project={project} />}
          {step === 2 && (
            <Step2Documents
              projectDocuments={projectDocuments}
              additionalDocs={additionalDocs}
              onAddDoc={handleAddDoc}
              onRemoveDoc={handleRemoveDoc}
              onUploadFile={handleUploadDocFile}
              uploading={uploadingDoc}
            />
          )}
          {step === 3 && <Step3Evidence galleryItems={galleryItems} onUploadEvidence={handleUploadEvidence} uploading={uploadingEvidence} />}
          {step === 4 && <Step4Declaration confirmed={confirmed} onConfirmChange={setConfirmed} />}
          {step === 5 && (
            <Step5Review
              project={project}
              projectDocuments={projectDocuments}
              additionalDocs={additionalDocs}
              galleryItems={galleryItems}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={step === 1}
          onClick={() => setStep((s) => s - 1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-3">
          {step < 5 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 4 && !confirmed}
              className="gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 h-11 px-6"
            >
              {submitting ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Verification Application
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
