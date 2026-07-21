'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import {
  getApplicationsForProject,
  getVerificationAgencies,
  getCarbonPassportApplicationsForProject,
  sendVerificationRequests,
  applyForCarbonPassport,
  getAuditReportForRequest,
} from '@/lib/voc-services';
import type {
  VerificationAgency,
  CarbonPassportApplication,
  CarbonPassportStatus,
  ProjectSnapshot,
  SnapshotDocument,
  SnapshotDocumentCategory,
  AuditReport,
} from '@/lib/voc-types';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  DOCUMENT_CATEGORY_LABELS,
  CARBON_PASSPORT_STATUS_LABELS,
  CARBON_PASSPORT_STATUS_COLORS,
  type VerificationApplication,
} from '@/lib/voc-types';
import { AgencyMultiSelect } from '@/components/verification/AgencyMultiSelect';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  ShieldCheck,
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
  Building2,
  Key,
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  RefreshCw,
  BarChart3,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Constants ──────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Project Summary', icon: FileText },
  { id: 2, label: 'Select Agency', icon: Building2 },
  { id: 3, label: 'Documents', icon: FolderOpen },
  { id: 4, label: 'Evidence', icon: Camera },
  { id: 5, label: 'Declaration', icon: Shield },
  { id: 6, label: 'Review & Submit', icon: Send },
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

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Verifications' },
  { value: 'active', label: 'Active' },
  { value: 'approved', label: 'Approved' },
  { value: 'returned', label: 'Returned' },
  { value: 'rejected', label: 'Rejected' },
] as const;

type StatusFilter = typeof STATUS_FILTER_OPTIONS[number]['value'];

// ── Types ──────────────────────────────────────────────────────

interface AdditionalDocument {
  id: string;
  name: string;
  category: SnapshotDocumentCategory;
  file_type: string;
}

interface EnrichedCard {
  application: VerificationApplication;
  passportStatus: CarbonPassportStatus;
  passportAppId: string | null;
  auditReport: AuditReport | null;
}

// ── Helpers ────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getStatusGroup(status: string): 'active' | 'approved' | 'returned' | 'rejected' {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'returned_for_revision') return 'returned';
  return 'active';
}

function getStatusBorderColor(status: string): string {
  const group = getStatusGroup(status);
  if (group === 'active') return 'border-l-blue-500';
  if (group === 'approved') return 'border-l-emerald-500';
  if (group === 'returned') return 'border-l-amber-500';
  return 'border-l-red-500';
}

// ── ProjectStatusBanner ────────────────────────────────────────

function ProjectStatusBanner({
  project,
  applications,
  passportApps,
}: {
  project: any;
  applications: VerificationApplication[];
  passportApps: CarbonPassportApplication[];
}) {
  const router = useRouter();
  const hasVerified = applications.some(a => a.status === 'approved');
  const latestVerified = applications
    .filter(a => a.status === 'approved')
    .sort((a, b) => new Date(b.submitted_date).getTime() - new Date(a.submitted_date).getTime())[0];
  const latestPassport = passportApps[0];
  const passportStatus = latestPassport?.status || 'none';

  return (
    <Card className="rounded-xl border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className={cn(
        'p-5',
        hasVerified
          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20'
          : project?.verification_status === 'rejected'
            ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20'
            : 'bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/20',
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
              hasVerified ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-slate-100 dark:bg-slate-800',
            )}>
              {hasVerified ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              ) : project?.verification_status === 'rejected' ? (
                <X className="h-6 w-6 text-red-600 dark:text-red-400" />
              ) : (
                <Shield className="h-6 w-6 text-slate-400" />
              )}
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                {hasVerified ? 'Project Verified' : project?.verification_status === 'rejected' ? 'Verification Rejected' : 'Verification Pending'}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                {project?.name || 'Untitled Project'} &middot; {PROJECT_TYPE_LABELS[project?.project_type] || project?.project_type || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">{applications.length} Verification{applications.length !== 1 ? 's' : ''}</span>
            </div>
            {latestVerified && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <CalendarDays className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">Latest: {formatDate(latestVerified.submitted_date)}</span>
              </div>
            )}
            {latestVerified && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-blue-700 dark:text-blue-400 font-medium">{latestVerified.ngo_name}</span>
              </div>
            )}
            {passportStatus !== 'none' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <Key className="h-3.5 w-3.5 text-purple-600" />
                <Badge className={cn('text-[10px] border-0', CARBON_PASSPORT_STATUS_COLORS[passportStatus])}>
                  {CARBON_PASSPORT_STATUS_LABELS[passportStatus]}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── VerificationHistoryCard ────────────────────────────────────

function VerificationHistoryCard({
  card,
  isExpanded,
  onToggleExpand,
  onResubmit,
  onApplyPassport,
  onViewPassport,
  onViewDetails,
  hasAnyActivePassport,
}: {
  card: EnrichedCard;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onResubmit: (app: VerificationApplication) => void;
  onApplyPassport: (agencyRequestId: string, agencyName: string, requestId: string) => void;
  onViewPassport: () => void;
  onViewDetails: (applicationId: string) => void;
  hasAnyActivePassport: boolean;
}) {
  const { application: app, passportStatus, passportAppId, auditReport } = card;
  const statusColor = APPLICATION_STATUS_COLORS[app.status];
  const borderColor = getStatusBorderColor(app.status);
  const group = getStatusGroup(app.status);
  const isReturned = app.status === 'returned_for_revision';
  const isRejected = app.status === 'rejected';
  const isApproved = app.status === 'approved';
  const isActive = group === 'active';

  return (
    <Card className={cn('rounded-xl border-slate-200 dark:border-slate-800 border-l-4 transition-all', borderColor)}>
      <div
        className="cursor-pointer"
        onClick={onToggleExpand}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-display font-semibold">{app.ngo_name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{app.application_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn('border-0 text-xs font-semibold', statusColor)}>
                {APPLICATION_STATUS_LABELS[app.status]}
              </Badge>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </div>
        </CardHeader>
      </div>

      {/* Quick Stats Row */}
      <div className="px-6 pb-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" /> {formatDate(app.submitted_date)}
          </span>
          {app.verifier_name && (
            <span className="flex items-center gap-1">
              <ClipboardCheck className="h-3 w-3" /> {app.verifier_name}
            </span>
          )}
          {auditReport && (
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" /> Audit: {auditReport.tree_count} trees, {auditReport.area_verified} ha
            </span>
          )}
          {isApproved && passportStatus !== 'none' && (
            <Badge className={cn('text-[10px] border-0', CARBON_PASSPORT_STATUS_COLORS[passportStatus])}>
              <Key className="h-2.5 w-2.5 mr-0.5" /> {CARBON_PASSPORT_STATUS_LABELS[passportStatus]}
            </Badge>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          <Separator />

          {/* Decision Notes (inline remarks) */}
          {app.decision_notes && (
            <div className={cn(
              'rounded-lg p-4 border',
              isReturned ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' :
              isRejected ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
              'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
            )}>
              <div className="flex items-start gap-2">
                <MessageSquare className={cn(
                  'h-4 w-4 mt-0.5 shrink-0',
                  isReturned ? 'text-amber-600' : isRejected ? 'text-red-600' : 'text-blue-600',
                )} />
                <div>
                  <p className={cn(
                    'text-xs font-semibold mb-1',
                    isReturned ? 'text-amber-800 dark:text-amber-200' :
                    isRejected ? 'text-red-800 dark:text-red-200' :
                    'text-blue-800 dark:text-blue-200',
                  )}>
                    Verifier Remarks
                  </p>
                  <p className={cn(
                    'text-sm',
                    isReturned ? 'text-amber-700 dark:text-amber-300' :
                    isRejected ? 'text-red-700 dark:text-red-300' :
                    'text-blue-700 dark:text-blue-300',
                  )}>
                    {app.decision_notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Audit Report Metrics */}
          {auditReport && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> Field Audit Report
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-[10px] font-medium text-slate-500">Area Verified</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{auditReport.area_verified} ha</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-[10px] font-medium text-slate-500">Tree Count</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{auditReport.tree_count.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-[10px] font-medium text-slate-500">Species</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{auditReport.species_count}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-[10px] font-medium text-slate-500">Carbon Stock</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{auditReport.estimated_carbon_stock.toLocaleString()} t</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-[10px] font-medium text-slate-500">Biodiversity Index</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{auditReport.biodiversity_index.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-[10px] font-medium text-slate-500">Site Condition</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">{auditReport.site_condition}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-[10px] font-medium text-slate-500">Photos</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{auditReport.photos_count}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
                  <p className="text-[10px] font-medium text-slate-500">GPS Validated</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{auditReport.gps_validated ? 'Yes' : 'No'}</p>
                </div>
              </div>
              {auditReport.risks && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1">Risks Identified</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">{auditReport.risks}</p>
                </div>
              )}
              {auditReport.corrective_actions && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">Corrective Actions</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">{auditReport.corrective_actions}</p>
                </div>
              )}
            </div>
          )}

          {/* Certificate & Passport Status */}
          {(isApproved || app.verification_certificate) && (
            <div className="flex flex-wrap gap-2">
              {app.verification_certificate && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <Award className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    Certificate: {app.verification_certificate.certificate_number}
                  </span>
                </div>
              )}
              {app.carbon_passport && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                  <Key className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-800 dark:text-purple-200">
                    Passport: {app.carbon_passport.passport_number}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onViewDetails(app.id); }}
              className="gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" /> View Details
            </Button>

            {isApproved && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onViewDetails(app.id); }}
                  className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  <Award className="h-3.5 w-3.5" /> View Certificate
                </Button>
                {auditReport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onViewDetails(app.id); }}
                    className="gap-1.5 text-blue-700 border-blue-300 hover:bg-blue-50"
                  >
                    <FileText className="h-3.5 w-3.5" /> View Audit Report
                  </Button>
                )}
                {(passportStatus === 'none' || passportStatus === 'rejected') && !hasAnyActivePassport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onApplyPassport(app.verification_agency_id, app.ngo_name, app.application_number); }}
                    className="gap-1.5 text-purple-700 border-purple-300 hover:bg-purple-50"
                  >
                    <Key className="h-3.5 w-3.5" /> Apply for Passport
                  </Button>
                )}
                {(passportStatus === 'requested' || passportStatus === 'under_processing') && (
                  <Badge className={cn('text-xs border-0', CARBON_PASSPORT_STATUS_COLORS[passportStatus])}>
                    <Clock className="h-3 w-3 mr-1" /> {CARBON_PASSPORT_STATUS_LABELS[passportStatus]}
                  </Badge>
                )}
                {passportStatus === 'issued' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onViewPassport(); }}
                    className="gap-1.5 text-purple-700 border-purple-300 hover:bg-purple-50"
                  >
                    <Key className="h-3.5 w-3.5" /> View Passport
                  </Button>
                )}
              </>
            )}

            {(isReturned || isRejected) && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onResubmit(app); }}
                className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Resubmit
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ── StepIndicator (kept as-is) ────────────────────────────────

function StepIndicator({ currentStep, steps }: { currentStep: number; steps: typeof STEPS }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        return (
          <React.Fragment key={step.id}>
            <div className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors shrink-0',
              isActive && 'bg-primary/10 text-primary',
              isCompleted && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
              !isActive && !isCompleted && 'text-slate-400 dark:text-slate-600',
            )}>
              <div className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                isActive && 'bg-primary text-primary-foreground',
                isCompleted && 'bg-emerald-500 text-white',
                !isActive && !isCompleted && 'bg-slate-200 dark:bg-slate-800 text-slate-500',
              )}>
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

// ── Step1: Project Summary ─────────────────────────────────────

function Step1ProjectSummary({ project, readOnly, snapshot }: { project: any; readOnly?: boolean; snapshot?: ProjectSnapshot | null }) {
  const data = snapshot || project;
  const summaryFields = [
    { label: 'Project Name', value: data?.project_name || data?.name || '---' },
    { label: 'Project Type', value: PROJECT_TYPE_LABELS[data?.project_type] || data?.project_type || '---' },
    { label: 'Owner Name', value: data?.owner_name || '---' },
    { label: 'Area', value: data?.area_hectares ? `${data.area_hectares} hectares` : '---' },
    { label: 'Location', value: data?.location_name || data?.location || '---' },
    { label: 'Description', value: data?.description || '---', full: true },
    { label: 'Current Status', value: readOnly ? 'Read-only snapshot' : (project?.verification_status || '---') },
  ];
  return (
    <div className="space-y-4">
      {readOnly && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          Showing read-only snapshot data from previous verification. To change project details, edit the project directly.
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {summaryFields.map((field) => (
          <div key={field.label} className={cn('space-y-1.5', field.full && 'sm:col-span-2')}>
            <Label className="text-xs font-medium text-slate-500 dark:text-slate-400">{field.label}</Label>
            {field.full ? (
              <Textarea value={String(field.value)} readOnly className="min-h-[80px] resize-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
            ) : (
              <Input value={String(field.value)} readOnly className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Step2: Agency Selection ────────────────────────────────────

function Step2AgencySelection({
  selectedAgencies,
  onChange,
  initialAgencyIds,
}: {
  selectedAgencies: VerificationAgency[];
  onChange: (agencies: VerificationAgency[]) => void;
  initialAgencyIds?: string[];
}) {
  return (
    <div className="space-y-3">
      {initialAgencyIds && initialAgencyIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          Original agencies pre-selected. You may change them before submitting.
        </div>
      )}
      <AgencyMultiSelect selected={selectedAgencies} onChange={onChange} maxSelections={5} />
    </div>
  );
}

// ── Step3: Documents ───────────────────────────────────────────

function Step2Documents({
  projectDocuments,
  additionalDocs,
  onAddDoc,
  onRemoveDoc,
  onUploadFile,
  uploading,
  resubmitMode,
  resubmitSnapshotDocs,
  decisionNotes,
  keptDocIds,
  onToggleKeepDoc,
}: {
  projectDocuments: SnapshotDocument[];
  additionalDocs: AdditionalDocument[];
  onAddDoc: (doc: AdditionalDocument) => void;
  onRemoveDoc: (id: string) => void;
  onUploadFile: (file: File, name: string, category: SnapshotDocumentCategory) => Promise<void>;
  uploading: boolean;
  resubmitMode?: boolean;
  resubmitSnapshotDocs?: SnapshotDocument[];
  decisionNotes?: string;
  keptDocIds?: Set<string>;
  onToggleKeepDoc?: (docId: string) => void;
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
    setNewDocName(''); setNewDocCategory('other'); setNewDocFileType(''); setShowAddForm(false);
  }

  async function handleUpload() {
    if (!uploadFile || !uploadName.trim()) return;
    await onUploadFile(uploadFile, uploadName.trim(), uploadCategory);
    setUploadFile(null); setUploadName(''); setUploadCategory('other'); setShowUploadForm(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadName(file.name.replace(/\.[^.]+$/, ''));
    setShowUploadForm(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const snapshotDocs = resubmitSnapshotDocs || [];
  const allDocs = [...projectDocuments, ...additionalDocs];

  return (
    <div className="space-y-4">
      {/* Decision notes for resubmit */}
      {resubmitMode && decisionNotes && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Verifier Remarks</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">{decisionNotes}</p>
          </div>
        </div>
      )}

      {/* Snapshot docs (resubmit mode — read-only with keep/replace) */}
      {resubmitMode && snapshotDocs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Previous Documents (Snapshot)</p>
          <div className="space-y-2">
            {snapshotDocs.map((doc) => (
              <div
                key={doc.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-all',
                  keptDocIds?.has(doc.id)
                    ? 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                    : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/30 opacity-60',
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
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
                {onToggleKeepDoc && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      'text-[10px] cursor-pointer',
                      keptDocIds?.has(doc.id) ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-red-50 text-red-700 border-red-300',
                    )} onClick={() => onToggleKeepDoc(doc.id)}>
                      {keptDocIds?.has(doc.id) ? 'Keeping' : 'Discarded'}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current project docs */}
      {allDocs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {resubmitMode ? 'New Documents' : 'Project Documents'}
          </p>
          <div className="space-y-2">
            {allDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3">
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
                    {'uploaded_date' in doc && <span className="text-[10px] text-slate-400">{formatDate((doc as SnapshotDocument).uploaded_date)}</span>}
                  </div>
                </div>
                {!resubmitMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveDoc(doc.id)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {allDocs.length === 0 && snapshotDocs.length === 0 && (
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
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading...' : resubmitMode ? 'Upload Replacement' : 'Upload Document'}
        </Button>
        {!resubmitMode && (
          <Button variant="outline" onClick={() => setShowAddForm(!showAddForm)} className="gap-2 border-dashed">
            <Plus className="h-4 w-4" />
            Add Reference
          </Button>
        )}
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

      {showAddForm && !resubmitMode && (
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
              <Input value={newDocName} onChange={(e) => setNewDocName(e.target.value)} placeholder="Enter document name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Category</Label>
                <Select value={newDocCategory} onValueChange={(v) => setNewDocCategory(v as SnapshotDocumentCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ADDITIONAL_DOC_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">File Type</Label>
                <Input value={newDocFileType} onChange={(e) => setNewDocFileType(e.target.value)} placeholder="e.g. PDF, JPG" />
              </div>
            </div>
            <Button onClick={handleAdd} disabled={!newDocName.trim()} className="gap-2" size="sm">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Step4: Evidence ────────────────────────────────────────────

function Step3Evidence({
  galleryItems,
  onUploadEvidence,
  uploading,
  resubmitMode,
  resubmitSnapshotEvidence,
  decisionNotes,
  keptEvidenceIds,
  onToggleKeepEvidence,
}: {
  galleryItems: any[];
  onUploadEvidence: (files: FileList) => Promise<void>;
  uploading: boolean;
  resubmitMode?: boolean;
  resubmitSnapshotEvidence?: any[];
  decisionNotes?: string;
  keptEvidenceIds?: Set<string>;
  onToggleKeepEvidence?: (id: string) => void;
}) {
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

  const snapshotEvidence = resubmitSnapshotEvidence || [];

  return (
    <div className="space-y-5">
      {/* Decision notes for resubmit */}
      {resubmitMode && decisionNotes && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <MessageSquare className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">Verifier Remarks</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">{decisionNotes}</p>
          </div>
        </div>
      )}

      {/* Snapshot evidence (resubmit mode — read-only with keep/replace) */}
      {resubmitMode && snapshotEvidence.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Previous Evidence (Snapshot)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {snapshotEvidence.map((item: any) => (
              <div
                key={item.id}
                className={cn(
                  'overflow-hidden rounded-lg border transition-all',
                  keptEvidenceIds?.has(item.id)
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/30 opacity-60',
                )}
              >
                {item.url && (
                  <div className="aspect-video bg-slate-100 dark:bg-slate-800">
                    <img src={item.url} alt={item.title || ''} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{item.title || item.file_name || 'Untitled'}</p>
                  {onToggleKeepEvidence && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] cursor-pointer mt-1',
                        keptEvidenceIds?.has(item.id) ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-red-50 text-red-700 border-red-300',
                      )}
                      onClick={() => onToggleKeepEvidence(item.id)}
                    >
                      {keptEvidenceIds?.has(item.id) ? 'Keeping' : 'Discarded'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current evidence stats */}
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
      <Button variant="outline" onClick={() => evidenceInputRef.current?.click()} disabled={uploading} className="gap-2">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? 'Uploading...' : resubmitMode ? 'Upload New Evidence' : 'Upload Evidence'}
      </Button>

      {galleryItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {resubmitMode ? 'New Evidence Items' : 'Evidence Items'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {galleryItems.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
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

      {galleryItems.length === 0 && snapshotEvidence.length === 0 && (
        <div className="text-center py-8 text-sm text-slate-400">No evidence items found for this project.</div>
      )}
    </div>
  );
}

// ── Step5: Declaration ─────────────────────────────────────────

function Step4Declaration({ confirmed, onConfirmChange }: { confirmed: boolean; onConfirmChange: (v: boolean) => void }) {
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
            <li className="flex items-center gap-2"><Lock className="h-3 w-3 shrink-0" /> Project documents will be locked</li>
            <li className="flex items-center gap-2"><Lock className="h-3 w-3 shrink-0" /> Evidence center will become read-only</li>
            <li className="flex items-center gap-2"><Lock className="h-3 w-3 shrink-0" /> Application data snapshot will be frozen</li>
          </ul>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
        <Checkbox checked={confirmed} onCheckedChange={(checked) => onConfirmChange(checked === true)} className="mt-0.5" />
        <span className="text-sm text-slate-700 dark:text-slate-300">
          I confirm that all information provided is accurate and complete. I understand that once submitted, the verification application and all attached documents become immutable.
        </span>
      </label>
    </div>
  );
}

// ── Step6: Review ──────────────────────────────────────────────

function Step5Review({
  project,
  projectDocuments,
  additionalDocs,
  galleryItems,
  selectedAgencies,
  resubmitMode,
}: {
  project: any;
  projectDocuments: SnapshotDocument[];
  additionalDocs: AdditionalDocument[];
  galleryItems: any[];
  selectedAgencies: VerificationAgency[];
  resubmitMode?: boolean;
}) {
  const totalDocs = projectDocuments.length + additionalDocs.length;
  const imageCount = galleryItems.filter((g) => (g.media_type || g.type) === 'image').length;
  const videoCount = galleryItems.filter((g) => (g.media_type || g.type) === 'video').length;
  const agencyNames = selectedAgencies.map(a => a.name).join(', ') || '—';

  const reviewSections = [
    { label: 'Project Name', value: project?.name || '—' },
    { label: 'Project Type', value: PROJECT_TYPE_LABELS[project?.project_type] || '—' },
    { label: 'Area', value: project?.area_hectares ? `${project.area_hectares} ha` : '—' },
    { label: 'Location', value: project?.location_name || '—' },
    { label: 'Verification Agencies', value: agencyNames },
    { label: 'Total Documents', value: `${totalDocs} (${projectDocuments.length} existing + ${additionalDocs.length} additional)` },
    { label: 'Evidence Items', value: `${galleryItems.length} (${imageCount} images, ${videoCount} videos)` },
  ];

  return (
    <div className="space-y-5">
      {resubmitMode && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
          <RefreshCw className="h-3.5 w-3.5 shrink-0" />
          This is a resubmission. A new verification request will be created alongside the previous record.
        </div>
      )}
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

// ── LoadingSkeleton ────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="space-y-2">
        <div className="h-8 w-72 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-4 w-96 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-40 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-10 w-56 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-10 w-32 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 animate-pulse">
          <div className="space-y-3">
            <div className="h-4 w-48 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── EmptyState ─────────────────────────────────────────────────

function EmptyState({ onRequestVerification }: { onRequestVerification: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
        <Shield className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No Verification Records</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        This project has not been submitted for verification yet. Request verification to start the MRV process with a certified agency.
      </p>
      <Button onClick={onRequestVerification} className="mt-6 gap-2">
        <Plus className="h-4 w-4" /> Request Verification
      </Button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function VerificationSubmitPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { project, loading: projectLoading } = useProject(projectId);
  const { profile, user } = useAuth();

  // Data state
  const [applications, setApplications] = React.useState<VerificationApplication[]>([]);
  const [passportApps, setPassportApps] = React.useState<CarbonPassportApplication[]>([]);
  const [passportStatusMap, setPassportStatusMap] = React.useState<Record<string, CarbonPassportStatus>>({});
  const [auditReports, setAuditReports] = React.useState<Record<string, AuditReport>>({});
  const [loading, setLoading] = React.useState(true);

  // UI state
  const [showWizard, setShowWizard] = React.useState(false);
  const [expandedCardId, setExpandedCardId] = React.useState<string | null>(null);
  const [filterStatus, setFilterStatus] = React.useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortOldest, setSortOldest] = React.useState(false);

  // Wizard state
  const [step, setStep] = React.useState(1);
  const [selectedAgencies, setSelectedAgencies] = React.useState<VerificationAgency[]>([]);
  const [projectDocuments, setProjectDocuments] = React.useState<SnapshotDocument[]>([]);
  const [galleryItems, setGalleryItems] = React.useState<any[]>([]);
  const [additionalDocs, setAdditionalDocs] = React.useState<AdditionalDocument[]>([]);
  const [confirmed, setConfirmed] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [uploadingDoc, setUploadingDoc] = React.useState(false);
  const [uploadingEvidence, setUploadingEvidence] = React.useState(false);

  // Resubmit state
  const [resubmitMode, setResubmitMode] = React.useState(false);
  const [resubmitSnapshot, setResubmitSnapshot] = React.useState<ProjectSnapshot | null>(null);
  const [resubmitDecisionNotes, setResubmitDecisionNotes] = React.useState('');
  const [resubmitOriginalAgencyId, setResubmitOriginalAgencyId] = React.useState<string | null>(null);
  const [keptDocIds, setKeptDocIds] = React.useState<Set<string>>(new Set());
  const [keptEvidenceIds, setKeptEvidenceIds] = React.useState<Set<string>>(new Set());

  // Passport dialog
  const [passportDialogOpen, setPassportDialogOpen] = React.useState(false);
  const [passportTarget, setPassportTarget] = React.useState<{ agencyRequestId: string; agencyName: string; requestId: string } | null>(null);
  const [applyingPassport, setApplyingPassport] = React.useState(false);

  // ── Data Fetching ─────────────────────────────────────────────

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [apps, pApps] = await Promise.all([
          getApplicationsForProject(projectId),
          getCarbonPassportApplicationsForProject(projectId),
        ]);

        // Fetch passport status per agency request
        const agencyIds = apps.map(a => a.id);
        let psMap: Record<string, CarbonPassportStatus> = {};
        if (agencyIds.length > 0) {
          const { data: agencyRows } = await supabase
            .from('voc_agency_requests')
            .select('id, carbon_passport_status')
            .in('id', agencyIds);
          (agencyRows || []).forEach((row: any) => {
            psMap[row.id] = (row.carbon_passport_status as CarbonPassportStatus) || 'none';
          });
        }

        // Fetch audit reports for completed/approved applications
        const arMap: Record<string, AuditReport> = {};
        const reportApps = apps.filter(a => ['audit_completed', 'approved'].includes(a.status));
        await Promise.all(
          reportApps.map(async (a) => {
            try {
              const report = await getAuditReportForRequest(a.id);
              if (report) arMap[a.id] = report;
            } catch { /* skip */ }
          })
        );

        if (!cancelled) {
          setApplications(apps);
          setPassportApps(pApps);
          setPassportStatusMap(psMap);
          setAuditReports(arMap);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  // ── Filtered & Sorted Applications ────────────────────────────

  const filteredApplications = React.useMemo(() => {
    let result = [...applications];

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(a => {
        const group = getStatusGroup(a.status);
        if (filterStatus === 'active') return group === 'active';
        if (filterStatus === 'approved') return group === 'approved';
        if (filterStatus === 'returned') return group === 'returned';
        if (filterStatus === 'rejected') return group === 'rejected';
        return true;
      });
    }

    // Search by agency name or request number
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.ngo_name.toLowerCase().includes(q) ||
        a.application_number.toLowerCase().includes(q) ||
        a.verifier_name?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      const da = new Date(a.submitted_date).getTime();
      const db = new Date(b.submitted_date).getTime();
      return sortOldest ? da - db : db - da;
    });

    return result;
  }, [applications, filterStatus, searchQuery, sortOldest]);

  // Group filtered applications
  const groupedApplications = React.useMemo(() => {
    const groups: { label: string; items: EnrichedCard[] }[] = [];
    const active: EnrichedCard[] = [];
    const approved: EnrichedCard[] = [];
    const returned: EnrichedCard[] = [];
    const rejected: EnrichedCard[] = [];

    filteredApplications.forEach(a => {
      const card: EnrichedCard = {
        application: a,
        passportStatus: passportStatusMap[a.id] || 'none',
        passportAppId: null,
        auditReport: auditReports[a.id] || null,
      };
      const group = getStatusGroup(a.status);
      if (group === 'active') active.push(card);
      else if (group === 'approved') approved.push(card);
      else if (group === 'returned') returned.push(card);
      else rejected.push(card);
    });

    if (active.length > 0) groups.push({ label: 'Active', items: active });
    if (approved.length > 0) groups.push({ label: 'Approved', items: approved });
    if (returned.length > 0) groups.push({ label: 'Returned', items: returned });
    if (rejected.length > 0) groups.push({ label: 'Rejected', items: rejected });

    return groups;
  }, [filteredApplications, passportStatusMap, auditReports]);

  // Global passport guard: true if ANY agency already has an active passport request
  const hasAnyActivePassport = React.useMemo(
    () => Object.values(passportStatusMap).some(s => s === 'requested' || s === 'under_processing'),
    [passportStatusMap]
  );

  // ── Handlers ──────────────────────────────────────────────────

  function handleRequestVerification() {
    setResubmitMode(false);
    setResubmitSnapshot(null);
    setResubmitDecisionNotes('');
    setResubmitOriginalAgencyId(null);
    setKeptDocIds(new Set());
    setKeptEvidenceIds(new Set());
    setStep(1);
    setShowWizard(true);
  }

  async function handleResubmit(app: VerificationApplication) {
    try {
      // Fetch the snapshot from the previous request
      const { data: req } = await supabase
        .from('voc_requests')
        .select('snapshot')
        .eq('id', app.application_number)
        .maybeSingle();

      const snapshot = (req?.snapshot as ProjectSnapshot) || null;

      setResubmitMode(true);
      setResubmitSnapshot(snapshot);
      setResubmitDecisionNotes(app.decision_notes || '');
      setResubmitOriginalAgencyId(app.ngo_id);

      // Pre-select the original agency
      if (app.ngo_id) {
        const agencies = await getVerificationAgencies();
        const original = agencies.find(a => a.id === app.ngo_id);
        if (original) setSelectedAgencies([original]);
      }

      // Keep all snapshot docs/evidence by default
      if (snapshot) {
        setKeptDocIds(new Set((snapshot.documents || []).map(d => d.id)));
        setKeptEvidenceIds(new Set((snapshot.evidence_items || []).map(e => e.id)));
      }

      setStep(1);
      setShowWizard(true);
      toast.info('Resubmission mode: snapshot loaded. Review and update sections as needed.');
    } catch (err) {
      toast.error('Failed to load previous snapshot');
    }
  }

  function handleToggleKeepDoc(docId: string) {
    setKeptDocIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  }

  function handleToggleKeepEvidence(id: string) {
    setKeptEvidenceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddDoc(doc: AdditionalDocument) {
    setAdditionalDocs(prev => [...prev, doc]);
  }

  function handleRemoveDoc(id: string) {
    setAdditionalDocs(prev => prev.filter(d => d.id !== id));
  }

  async function handleUploadDocFile(file: File, name: string, category: SnapshotDocumentCategory) {
    setUploadingDoc(true);
    try {
      const filePath = `${projectId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data: record, error: insertError } = await supabase
        .from('project_documents_v2')
        .insert({
          project_id: projectId,
          uploaded_by: user?.id || profile?.id,
          document_name: name,
          category,
          mime_type: file.type,
          file_size: file.size,
          storage_path: filePath,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      if (record) {
        setProjectDocuments(prev => [...prev, {
          id: record.id,
          name: record.document_name,
          category: record.category,
          file_type: record.mime_type || 'document',
          file_size: `${Math.round((record.file_size || 0) / 1024)} KB`,
          uploaded_date: record.created_at,
          quality_score: 80,
          gps_available: false,
          metadata_available: false,
          ai_summary: {
            confidence_score: 80, missing_documents: [], quality_issues: [],
            duplicate_detected: false, gps_metadata: false, image_metadata: false,
            overall_assessment: 'Uploaded',
          },
          storage_path: filePath,
        }]);
      }
      toast.success('Document uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload');
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleUploadEvidence(files: FileList) {
    setUploadingEvidence(true);
    try {
      for (const file of Array.from(files)) {
        const filePath = `${projectId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('project-gallery')
          .upload(filePath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;

        const { data: record } = await supabase
          .from('project_gallery_items')
          .insert({
            project_id: projectId,
            file_name: file.name,
            caption: file.name,
            media_type: file.type.startsWith('video') ? 'video' : 'image',
            storage_path: filePath,
            mime_type: file.type,
          })
          .select()
          .single();

        if (record) {
          setGalleryItems(prev => [...prev, {
            id: record.id,
            title: record.caption || record.file_name,
            type: record.media_type,
            url: undefined,
            storage_path: filePath,
            created_at: record.created_at,
          }]);
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
    if (!project || !profile || selectedAgencies.length === 0) return;
    setSubmitting(true);
    try {
      // Build documents array
      const snapshotDocs: SnapshotDocument[] = [];

      // Keeped snapshot docs (resubmit mode)
      if (resubmitMode && resubmitSnapshot) {
        for (const doc of resubmitSnapshot.documents || []) {
          if (keptDocIds.has(doc.id)) {
            snapshotDocs.push(doc);
          }
        }
      }

      // Current project docs
      for (const doc of projectDocuments) {
        const storagePath = doc.storage_path as string | undefined;
        let url = doc.url;
        if (!url && storagePath) {
          const { data: signed } = await supabase.storage.from('project-documents').createSignedUrl(storagePath, 3600);
          url = signed?.signedUrl;
        }
        snapshotDocs.push({
          id: doc.id || Math.random().toString(),
          name: doc.name,
          category: doc.category,
          file_type: doc.file_type,
          file_size: doc.file_size,
          uploaded_date: doc.uploaded_date,
          quality_score: 80,
          gps_available: false,
          metadata_available: false,
          ai_summary: {
            confidence_score: 80, missing_documents: [], quality_issues: [],
            duplicate_detected: false, gps_metadata: false, image_metadata: false,
            overall_assessment: 'Included',
          },
          url,
          storage_path: storagePath,
        });
      }

      // Additional docs
      for (const doc of additionalDocs) {
        snapshotDocs.push({
          id: doc.id,
          name: doc.name,
          category: doc.category,
          file_type: doc.file_type,
          file_size: '0 KB',
          uploaded_date: new Date().toISOString(),
          quality_score: 70,
          gps_available: false,
          metadata_available: false,
          ai_summary: {
            confidence_score: 70, missing_documents: [], quality_issues: [],
            duplicate_detected: false, gps_metadata: false, image_metadata: false,
            overall_assessment: 'Reference document',
          },
        });
      }

      // Build evidence array
      const snapshotEvidence: any[] = [];

      // Kept snapshot evidence (resubmit mode)
      if (resubmitMode && resubmitSnapshot) {
        for (const item of resubmitSnapshot.evidence_items || []) {
          if (keptEvidenceIds.has(item.id)) {
            snapshotEvidence.push(item);
          }
        }
      }

      // Current gallery items
      for (const item of galleryItems) {
        const storagePath = item.storage_path as string | undefined;
        let url = item.url;
        if (!url && storagePath) {
          const { data: signed } = await supabase.storage.from('project-gallery').createSignedUrl(storagePath, 3600);
          url = signed?.signedUrl;
        }
        snapshotEvidence.push({
          id: item.id || Math.random().toString(),
          title: item.title || item.file_name || 'Evidence',
          description: '',
          type: item.type || 'image',
          location: project.location_name || '',
          date_collected: item.created_at || new Date().toISOString(),
          url,
          storage_path: storagePath,
          file_type: item.mime_type || '',
          file_name: item.file_name || '',
        });
      }

      const snapshot = {
        project_name: project.name,
        project_type: project.project_type || '',
        location: project.location_name || '',
        latitude: project.center_lat || 0,
        longitude: project.center_lng || 0,
        area_hectares: project.area_hectares || 0,
        description: project.description || '',
        methodology: (project as any).methodology || '',
        start_date: project.start_date || '',
        target_end_date: project.end_date || '',
        estimated_carbon_sequestration: project.target_carbon_tonnes || 0,
        ngo_name: selectedAgencies.map(a => a.name).join(', '),
        owner_name: profile.full_name || '',
        owner_email: profile.email || '',
        owner_organization: profile.organization || '',
        documents: snapshotDocs,
        ground_images: [],
        drone_images: [],
        supporting_files: [],
        evidence_items: snapshotEvidence,
        captured_at: new Date().toISOString(),
      };

      const result = await sendVerificationRequests({
        projectId: project.id,
        projectName: project.name,
        projectOwnerId: project.owner_id,
        projectOwnerName: profile.full_name || '',
        selectedAgencies: selectedAgencies.map(a => ({ agencyId: a.id, agencyName: a.name })),
        snapshot,
      });

      // Refresh data
      const [newApps, newPApps] = await Promise.all([
        getApplicationsForProject(projectId),
        getCarbonPassportApplicationsForProject(projectId),
      ]);
      setApplications(newApps);
      setPassportApps(newPApps);
      setShowWizard(false);
      setResubmitMode(false);
      setResubmitSnapshot(null);
      setStep(1);
      setSelectedAgencies([]);
      setAdditionalDocs([]);
      setConfirmed(false);
      toast.success(`Verification requests sent to ${selectedAgencies.length} agencies`);
    } catch (err) {
      console.error('Failed to submit verification request:', err);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenPassportDialog(agencyRequestId: string, agencyName: string, requestId: string) {
    setPassportTarget({ agencyRequestId, agencyName, requestId });
    setPassportDialogOpen(true);
  }

  async function handleApplyPassport() {
    if (!passportTarget || !project || !profile) return;
    setApplyingPassport(true);
    try {
      const result = await applyForCarbonPassport({
        requestId: passportTarget.requestId,
        projectId: project.id,
        projectName: project.name,
        projectOwnerId: project.owner_id,
        projectOwnerName: profile.full_name || '',
        agencyId: passportTarget.agencyRequestId,
        agencyName: passportTarget.agencyName,
        assignedVerifier: null,
        verificationReportRef: null,
        auditReportRef: null,
      });

      setPassportApps(prev => [result, ...prev]);
      setPassportStatusMap(prev => ({
        ...prev,
        [passportTarget.agencyRequestId]: 'requested',
      }));
      setPassportDialogOpen(false);
      setPassportTarget(null);
      toast.success(`Carbon Passport application sent to ${passportTarget.agencyName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply');
    }
    setApplyingPassport(false);
  }

  // ── Loading State ─────────────────────────────────────────────

  if (loading || projectLoading) {
    return <LoadingSkeleton />;
  }

  // ── Main Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Verification Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track verification cycles, review agency decisions, and manage certification for this project.
        </p>
      </div>

      {/* Project Status Banner */}
      <ProjectStatusBanner
        project={project}
        applications={applications}
        passportApps={passportApps}
      />

      {/* Wizard View */}
      {showWizard && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowWizard(false);
                setResubmitMode(false);
                setResubmitSnapshot(null);
                setStep(1);
                setSelectedAgencies([]);
                setAdditionalDocs([]);
                setConfirmed(false);
              }}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Back to History
            </Button>
            {resubmitMode && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                <RefreshCw className="h-3 w-3 mr-1" /> Resubmission
              </Badge>
            )}
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold">
              {resubmitMode ? 'Resubmit Verification Application' : 'Request New Verification'}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {resubmitMode
                ? 'Review the previous snapshot and update as needed before resubmitting.'
                : 'Create a snapshot of your project for certification review.'}
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
              {step === 1 && (
                <Step1ProjectSummary
                  project={project}
                  readOnly={resubmitMode}
                  snapshot={resubmitSnapshot}
                />
              )}
              {step === 2 && (
                <Step2AgencySelection
                  selectedAgencies={selectedAgencies}
                  onChange={setSelectedAgencies}
                  initialAgencyIds={resubmitMode ? (resubmitOriginalAgencyId ? [resubmitOriginalAgencyId] : []) : undefined}
                />
              )}
              {step === 3 && (
                <Step2Documents
                  projectDocuments={projectDocuments}
                  additionalDocs={additionalDocs}
                  onAddDoc={handleAddDoc}
                  onRemoveDoc={handleRemoveDoc}
                  onUploadFile={handleUploadDocFile}
                  uploading={uploadingDoc}
                  resubmitMode={resubmitMode}
                  resubmitSnapshotDocs={resubmitSnapshot?.documents}
                  decisionNotes={resubmitDecisionNotes}
                  keptDocIds={keptDocIds}
                  onToggleKeepDoc={handleToggleKeepDoc}
                />
              )}
              {step === 4 && (
                <Step3Evidence
                  galleryItems={galleryItems}
                  onUploadEvidence={handleUploadEvidence}
                  uploading={uploadingEvidence}
                  resubmitMode={resubmitMode}
                  resubmitSnapshotEvidence={resubmitSnapshot?.evidence_items}
                  decisionNotes={resubmitDecisionNotes}
                  keptEvidenceIds={keptEvidenceIds}
                  onToggleKeepEvidence={handleToggleKeepEvidence}
                />
              )}
              {step === 5 && (
                <Step4Declaration confirmed={confirmed} onConfirmChange={setConfirmed} />
              )}
              {step === 6 && (
                <Step5Review
                  project={project}
                  projectDocuments={projectDocuments}
                  additionalDocs={additionalDocs}
                  galleryItems={galleryItems}
                  selectedAgencies={selectedAgencies}
                  resubmitMode={resubmitMode}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              disabled={step === 1}
              onClick={() => setStep(s => s - 1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </Button>
            <div className="flex items-center gap-3">
              {step < 6 ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 2 && selectedAgencies.length === 0}
                  className="gap-2"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-2 h-11 px-6"
                >
                  {submitting ? (
                    <><Clock className="h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="h-4 w-4" /> Submit Verification Application</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification History View */}
      {!showWizard && (
        <div className="space-y-5">
          {/* Filter / Search / Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StatusFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTER_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by agency, request number, or verifier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOldest(!sortOldest)}
              className="gap-1.5 shrink-0"
            >
              {sortOldest ? <ArrowRight className="h-3.5 w-3.5" /> : <ArrowLeft className="h-3.5 w-3.5" />}
              {sortOldest ? 'Oldest First' : 'Latest First'}
            </Button>
          </div>

          {/* Grouped Verification Cards */}
          {groupedApplications.length === 0 ? (
            <EmptyState onRequestVerification={handleRequestVerification} />
          ) : (
            <div className="space-y-6">
              {groupedApplications.map(group => (
                <div key={group.label} className="space-y-3">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {group.label} ({group.items.length})
                  </h3>
                  <div className="space-y-3">
                    {group.items.map(card => (
                      <VerificationHistoryCard
                        key={card.application.id}
                        card={card}
                        isExpanded={expandedCardId === card.application.id}
                        onToggleExpand={() => setExpandedCardId(prev => prev === card.application.id ? null : card.application.id)}
                        onResubmit={handleResubmit}
                        onApplyPassport={handleOpenPassportDialog}
                        onViewPassport={() => router.push(`/dashboard/projects/${projectId}/official-records`)}
                        onViewDetails={(id) => router.push(`/dashboard/verification/${id}`)}
                        hasAnyActivePassport={hasAnyActivePassport}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Request New Verification Button */}
          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={handleRequestVerification}
              className="gap-2 h-12 px-8"
            >
              <Plus className="h-5 w-5" /> Request New Verification
            </Button>
          </div>
        </div>
      )}

      {/* Passport Application Dialog */}
      <Dialog open={passportDialogOpen} onOpenChange={setPassportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Carbon Passport?</DialogTitle>
            <DialogDescription>
              This will send a Carbon Passport application to {passportTarget?.agencyName}. The agency will review and process your request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4 text-purple-600" />
                <p className="text-sm font-semibold text-purple-800">Carbon Passport Application</p>
              </div>
              <p className="text-xs text-purple-700">
                A Carbon Passport is a digital certificate of your verified carbon credits. It will be issued after agency approval.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPassportDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleApplyPassport}
                disabled={applyingPassport}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {applyingPassport ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Key className="mr-2 h-4 w-4" /> Submit Request</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
