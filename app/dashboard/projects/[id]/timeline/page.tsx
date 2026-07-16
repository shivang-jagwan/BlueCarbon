'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { ACTIVITY_CATEGORY_LABELS } from '@/lib/types';
import type { ProjectActivity, ActivityCategory } from '@/lib/types';
import {
  fetchProjectHistory,
  getEventCategory,
  getEventTypeLabel,
  getQuickActionUrl,
  getCategoryEventTypes,
  type ProjectHistoryFilters
} from '@/services/project-history';
import {
  History,
  FileText,
  Shield,
  BarChart3,
  Image,
  MessageSquare,
  Search,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Building2,
  Map,
  Upload,
  Camera,
  Send,
  CheckCircle,
  XCircle,
  Award,
  DollarSign,
  Handshake,
  RefreshCw,
  Activity,
  Download,
  Eye,
  ExternalLink,
  Filter,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  FileWarning,
  FolderKanban,
  Leaf,
  Zap,
  Lock,
  GitBranch,
  Users,
  Flag,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Globe,
} from 'lucide-react';

const TABS: { value: ActivityCategory; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All Activity', icon: History },
  { value: 'documents', label: 'Documents', icon: FileText },
  { value: 'verifications', label: 'Verifications', icon: Shield },
  { value: 'partnerships', label: 'Partnerships', icon: Handshake },
  { value: 'monitoring', label: 'Monitoring', icon: BarChart3 },
  { value: 'gallery', label: 'Gallery', icon: Image },
  { value: 'comments', label: 'Comments', icon: MessageSquare },
];

const EVENT_ICON_MAP: Record<string, React.ElementType> = {
  project_created: FolderKanban,
  project_updated: RefreshCw,
  project_submitted: Send,
  project_archived: Flag,
  boundary_created: Map,
  boundary_updated: Map,
  boundary_change_requested: Map,

  document_submitted: FileText,
  document_verified: FileCheck,
  document_rejected: FileWarning,
  documents_requested: FileText,
  additional_documents_uploaded: Upload,
  ownership_documents_uploaded: FileText,
  ownership_documents_submitted: FileText,
  ownership_verified: CheckCircle2,
  ownership_rejected: XCircle,

  evidence_uploaded: Camera,
  evidence_approved: CheckCircle,
  evidence_rejected: XCircle,

  land_verification_requested: Send,
  land_verification_approved: CheckCircle,
  land_verification_rejected: XCircle,
  project_verification_requested: Send,
  project_verification_approved: CheckCircle,
  project_verification_rejected: XCircle,
  verification_requested: Send,
  verification_approved: CheckCircle,
  verification_rejected: XCircle,
  verification_started: RefreshCw,
  verifier_assigned: Users,
  verification_organization_accepted: CheckCircle2,
  verification_organization_declined: XCircle,

  monitoring_report_submitted: BarChart3,
  monitoring_report_approved: CheckCircle,
  monitoring_report_rejected: XCircle,
  monitoring_report_updated: RefreshCw,
  monitoring_partnership_created: Handshake,
  satellite_report_generated: TrendingUp,
  drone_images_uploaded: Camera,
  drone_videos_uploaded: Camera,

  gallery_photos_uploaded: Image,
  gallery_videos_uploaded: Image,

  carbon_passport_issued: Award,
  carbon_passport_revoked: AlertTriangle,
  carbon_passport_updated: Award,
  carbon_report_generated: Leaf,

  company_supported_project: DollarSign,
  company_removed_support: AlertCircle,

  partnership_request_received: Handshake,
  partnership_accepted: CheckCircle2,
  partnership_established: Handshake,
  partnership_terminated: XCircle,
  monthly_report_shared: FileText,
  new_verification_requested: Shield,
  available_for_discovery: Globe,
  project_completed: CheckCircle2,

  comments_added: MessageSquare,
  comments_replied: MessageSquare,

  audit_event: Lock,
  admin_override: Zap,

  verification_application_submitted: Send,
  verification_application_under_review: Eye,
  verification_audit_scheduled: Calendar,
  verification_audit_completed: CheckCircle2,
  verification_application_approved: CheckCircle2,
  verification_application_returned: RefreshCw,
  verification_application_rejected: XCircle,
};

function getEventColor(eventType: string): { bg: string; text: string; ring: string; border: string } {
  if (eventType.includes('partnership_established') || eventType.includes('partnership_accepted')) return { bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-800' };
  if (eventType.includes('partnership_request')) return { bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', ring: 'ring-blue-500/20', border: 'border-blue-200 dark:border-blue-800' };
  if (eventType.includes('partnership_terminated')) return { bg: 'bg-red-500', text: 'text-red-700 dark:text-red-400', ring: 'ring-red-500/20', border: 'border-red-200 dark:border-red-800' };
  if (eventType.includes('monthly_report')) return { bg: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-400', ring: 'ring-indigo-500/20', border: 'border-indigo-200 dark:border-indigo-800' };
  if (eventType.includes('carbon_passport')) return { bg: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400', ring: 'ring-purple-500/20', border: 'border-purple-200 dark:border-purple-800' };
  if (eventType.includes('verification_application') || eventType.includes('verification_audit')) return { bg: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-400', ring: 'ring-indigo-500/20', border: 'border-indigo-200 dark:border-indigo-800' };
  if (eventType.includes('available_for_discovery')) return { bg: 'bg-teal-500', text: 'text-teal-700 dark:text-teal-400', ring: 'ring-teal-500/20', border: 'border-teal-200 dark:border-teal-800' };
  if (eventType.includes('project_completed')) return { bg: 'bg-green-500', text: 'text-green-700 dark:text-green-400', ring: 'ring-green-500/20', border: 'border-green-200 dark:border-green-800' };

  const approved = eventType.includes('approved') || eventType.includes('accepted') || eventType.includes('issued') || eventType === 'project_created';
  const rejected = eventType.includes('rejected') || eventType.includes('revoked') || eventType.includes('declined');
  const pending = eventType.includes('requested') || eventType.includes('submitted') || eventType.includes('pending') || eventType.includes('started');
  const information = eventType.includes('updated') || eventType === 'project_submitted' || eventType.includes('assigned');

  if (approved) return { bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', ring: 'ring-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-800' };
  if (rejected) return { bg: 'bg-red-500', text: 'text-red-700 dark:text-red-400', ring: 'ring-red-500/20', border: 'border-red-200 dark:border-red-800' };
  if (pending) return { bg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', ring: 'ring-amber-500/20', border: 'border-amber-200 dark:border-amber-800' };
  if (information) return { bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', ring: 'ring-blue-500/20', border: 'border-blue-200 dark:border-blue-800' };

  return { bg: 'bg-slate-500', text: 'text-slate-700 dark:text-slate-400', ring: 'ring-slate-500/20', border: 'border-slate-200 dark:border-slate-800' };
}

function getStatusBadgeColor(status: string | null): string {
  if (!status) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  switch (status.toLowerCase()) {
    case 'completed':
    case 'approved':
    case 'verified':
    case 'active':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
    case 'submitted':
    case 'pending':
    case 'requested':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
    case 'requires_action':
    case 'in_progress':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
    case 'rejected':
    case 'cancelled':
      return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800';
    case 'archived':
      return 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-800';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <History className="h-6 w-6 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">No activity yet</h3>
      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
        Events will appear here as the project progresses through its lifecycle.
      </p>
    </div>
  );
}

function ActivityCard({ activity }: { activity: ProjectActivity }) {
  const Icon = EVENT_ICON_MAP[activity.event_type] || Activity;
  const color = getEventColor(activity.event_type);
  const metadata = activity.metadata as Record<string, unknown> | null;
  const quickAction = getQuickActionUrl(activity);

  const badges: { label?: string; value: string }[] = [];
  if (metadata) {
    if (metadata.organization_name && typeof metadata.organization_name === 'string') badges.push({ value: metadata.organization_name });
    if (metadata.document_name && typeof metadata.document_name === 'string') badges.push({ label: 'Doc', value: metadata.document_name });
    if (metadata.file_name && typeof metadata.file_name === 'string') badges.push({ label: 'File', value: metadata.file_name });
    if (metadata.period_month && typeof metadata.period_month === 'string') badges.push({ label: 'Period', value: metadata.period_month });
    if (metadata.area_hectares && typeof metadata.area_hectares === 'number') badges.push({ label: 'Area', value: `${metadata.area_hectares} ha` });
    if (metadata.carbon_tonnes && typeof metadata.carbon_tonnes === 'number') badges.push({ label: 'Carbon', value: `${metadata.carbon_tonnes} t` });
    if (metadata.amount_usd && typeof metadata.amount_usd === 'number') badges.push({ value: `$${(metadata.amount_usd as number).toLocaleString()}` });
    if (metadata.service_type && typeof metadata.service_type === 'string') badges.push({ label: 'Service', value: metadata.service_type });
    if (metadata.report_type && typeof metadata.report_type === 'string') badges.push({ label: 'Type', value: metadata.report_type });
  }

  const time = new Date(activity.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="relative flex gap-4 group">
      <div className={cn(
        'z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 transition-transform group-hover:scale-110',
        color.bg, color.ring
      )}>
        <Icon className="h-4 w-4 text-white" />
      </div>

      <div className={cn(
        'flex-1 rounded-xl border bg-white dark:bg-slate-900 p-4 transition-all hover:shadow-md',
        color.border
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {activity.title || getEventTypeLabel(activity.event_type)}
            </h3>
            {activity.description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>
          {activity.activity_status && (
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', getStatusBadgeColor(activity.activity_status))}>
              {activity.activity_status}
            </span>
          )}
        </div>

        {badges.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {badges.map((badge, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                {badge.label && <span className="text-slate-400 dark:text-slate-500">{badge.label}:</span>}
                {badge.value}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {(activity.actor_name || activity.actor_id) && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
              <User className="h-3 w-3" />
              {activity.actor_name || 'User'}
              {activity.actor_role && (
                <span className="text-slate-300 dark:text-slate-600">({activity.actor_role})</span>
              )}
            </span>
          )}
          {(activity.organization_name || activity.company_id) && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
              <Building2 className="h-3 w-3" />
              {activity.organization_name || 'Organization'}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
            <Clock className="h-3 w-3" />
            {time}
          </span>

          {quickAction && (
            <a
              href={quickAction.url}
              className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-slate-900 dark:text-slate-100 hover:underline"
            >
              {quickAction.label}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { project } = useProject(projectId);

  const [activities, setActivities] = React.useState<ProjectActivity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<ActivityCategory>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [activeStatus, setActiveStatus] = React.useState('');
  const [activeOrg, setActiveOrg] = React.useState('');
  const [activeCompany, setActiveCompany] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [totalCount, setTotalCount] = React.useState(0);
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 30;
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const loadHistory = React.useCallback(async (reset = false) => {
    setLoading(true);
    const offset = reset ? 0 : page * PAGE_SIZE;
    const filters: ProjectHistoryFilters = {
      category: activeTab === 'all' ? undefined : activeTab,
      search: searchQuery || undefined,
      status: activeStatus || undefined,
      organization_id: activeOrg || undefined,
      company_id: activeCompany || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo ? `${dateTo}T23:59:59` : undefined,
      limit: PAGE_SIZE,
      offset,
    };
    const result = await fetchProjectHistory(projectId, filters);
    if (reset) {
      setActivities(result.activities);
      setPage(0);
    } else {
      setActivities(prev => [...prev, ...result.activities]);
    }
    setTotalCount(result.total);
    setLoading(false);
  }, [projectId, activeTab, searchQuery, activeStatus, activeOrg, activeCompany, dateFrom, dateTo, page]);

  React.useEffect(() => {
    loadHistory(true);
  }, [activeTab, activeStatus, activeOrg, activeCompany, dateFrom, dateTo, searchQuery]);

  const uniqueOrgs = React.useMemo(() => {
    const orgs: { id: string; name: string }[] = [];
    const seen = new Set<string>();
    activities.forEach(a => {
      if (a.organization_name && a.organization_id && !seen.has(a.organization_id)) {
        seen.add(a.organization_id);
        orgs.push({ id: a.organization_id, name: a.organization_name });
      }
    });
    return orgs;
  }, [activities]);

  const uniqueCompanies = React.useMemo(() => {
    const companies: { id: string; name: string }[] = [];
    const seen = new Set<string>();
    activities.forEach(a => {
      if (a.organization_name && a.company_id && !seen.has(a.company_id)) {
        seen.add(a.company_id);
        companies.push({ id: a.company_id, name: a.organization_name });
      }
    });
    return companies;
  }, [activities]);

  const groupedActivities = React.useMemo(() => {
    const groups: { dateKey: string; dateLabel: string; relativeLabel: string; items: ProjectActivity[] }[] = [];
    let current: { dateKey: string; dateLabel: string; relativeLabel: string; items: ProjectActivity[] } | null = null;

    for (const activity of activities) {
      const d = new Date(activity.created_at);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!current || current.dateKey !== dateKey) {
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        let relativeLabel = '';
        if (diffDays === 0) relativeLabel = 'Today';
        else if (diffDays === 1) relativeLabel = 'Yesterday';
        else if (diffDays < 7) relativeLabel = `${diffDays} days ago`;
        else relativeLabel = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        current = {
          dateKey,
          dateLabel: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
          relativeLabel,
          items: [],
        };
        groups.push(current);
      }
      current.items.push(activity);
    }
    return groups;
  }, [activities]);

  const tabCounts = React.useMemo(() => {
    return { all: totalCount, documents: totalCount, verifications: totalCount, partnerships: totalCount, monitoring: totalCount, gallery: totalCount, comments: totalCount };
  }, [totalCount]);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (activeStatus) count++;
    if (activeOrg) count++;
    if (activeCompany) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    return count;
  }, [activeStatus, activeOrg, activeCompany, dateFrom, dateTo]);

  const clearFilters = React.useCallback(() => {
    setActiveStatus('');
    setActiveOrg('');
    setActiveCompany('');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100">
            <History className="h-5 w-5 text-white dark:text-slate-900" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Project History</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {project ? `Complete record of ${project.name}` : 'Complete chronological record of every project event'}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
            showFilters || activeFilterCount > 0
              ? 'border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          )}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-white/20 dark:bg-slate-900/20 px-1.5 py-0.5 text-[10px] leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Date Range</label>
              <div className="flex gap-2">
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Verification Organization</label>
              <select value={activeOrg} onChange={e => setActiveOrg(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100">
                <option value="">All organizations</option>
                {uniqueOrgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Company</label>
              <select value={activeCompany} onChange={e => setActiveCompany(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100">
                <option value="">All companies</option>
                {uniqueCompanies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Status</label>
              <select value={activeStatus} onChange={e => setActiveStatus(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100">
                <option value="">All statuses</option>
                <option value="completed">Completed</option>
                <option value="approved">Approved</option>
                <option value="verified">Verified</option>
                <option value="submitted">Submitted</option>
                <option value="pending">Pending</option>
                <option value="requested">Requested</option>
                <option value="rejected">Rejected</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <button onClick={clearFilters} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max pb-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all',
                  activeTab === tab.value
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {loading ? 'Loading...' : `${totalCount} ${totalCount === 1 ? 'result' : 'results'}`}
          {activeFilterCount > 0 && (
            <span className="ml-2">
              · <button onClick={clearFilters} className="underline hover:text-slate-700 dark:hover:text-slate-200">Clear filters</button>
            </span>
          )}
        </p>
      </div>

      {loading && activities.length === 0 ? (
        <div className="space-y-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="relative flex gap-4">
              <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div className="h-3.5 w-40 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                <div className="mt-2 h-3 w-full rounded bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                <div className="mt-3 flex gap-2">
                  <div className="h-4 w-24 rounded-full bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />

          {groupedActivities.map((group) => (
            <div key={group.dateKey} className="mb-8">
              <div className="relative flex items-center gap-3 mb-4">
                <div className="z-10 flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400 shadow-sm">
                  <CalendarDays className="h-3 w-3" />
                  {group.relativeLabel}
                  <span className="text-slate-400 dark:text-slate-500 font-normal">·</span>
                  <span className="text-slate-400 dark:text-slate-500 font-normal">{group.dateLabel}</span>
                </div>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
              </div>

              <div className="space-y-3 ml-0">
                {group.items.map(activity => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          ))}

          {activities.length < totalCount && (
            <div className="mt-6 text-center">
              <button
                onClick={() => { setPage(p => p + 1); loadHistory(false); }}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                Load more activities
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
