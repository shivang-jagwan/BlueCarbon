'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  History,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Clock,
  FileText,
  Filter,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  type VerificationApplication,
} from '@/lib/voc-types';

const STATUS_ICONS: Record<string, React.ElementType> = {
  approved: CheckCircle2,
  returned_for_revision: RotateCcw,
  rejected: XCircle,
};

type FilterType = 'all' | 'approved' | 'returned_for_revision' | 'rejected';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'returned_for_revision', label: 'Returned' },
  { value: 'rejected', label: 'Rejected' },
];

export default function VerificationHistoryPage() {
  const router = useRouter();
  const { profile } = useAuth();

  const [allCompleted, setAllCompleted] = React.useState<VerificationApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterType>('all');
  const [search, setSearch] = React.useState('');
  const [sortNewest, setSortNewest] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const voc = await import('@/lib/voc-services');
        const all = await voc.getAllApplicationsForDashboard();
        const completed = all.filter(a =>
          ['approved', 'returned_for_revision', 'rejected'].includes(a.status)
        );
        if (!cancelled) {
          if (profile) {
            const agency = await voc.getAgencyForProfile(profile.id);
            setAllCompleted(agency ? completed.filter(a => a.verification_agency_id === agency.id) : completed);
          } else {
            setAllCompleted(completed);
          }
        }
      } catch { /* skip */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [profile]);

  const filtered = React.useMemo(() => {
    let result = allCompleted;
    if (filter !== 'all') {
      result = result.filter(a => a.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.project_name.toLowerCase().includes(q) ||
        a.ngo_name.toLowerCase().includes(q) ||
        a.application_number.toLowerCase().includes(q) ||
        a.project_owner_name.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      const da = new Date(a.submitted_date).getTime();
      const db = new Date(b.submitted_date).getTime();
      return sortNewest ? db - da : da - db;
    });
    return result;
  }, [allCompleted, filter, search, sortNewest]);

  const counts = React.useMemo(() => ({
    all: allCompleted.length,
    approved: allCompleted.filter(a => a.status === 'approved').length,
    returned_for_revision: allCompleted.filter(a => a.status === 'returned_for_revision').length,
    rejected: allCompleted.filter(a => a.status === 'rejected').length,
  }), [allCompleted]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <History className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Verification History
          </h1>
          <p className="text-sm text-muted-foreground">
            All completed verification requests — approved, returned, and rejected.
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              filter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {opt.label}
            <span className="ml-1.5 text-[10px] opacity-70">{counts[opt.value]}</span>
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by project, agency, owner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortNewest(prev => !prev)}
          className="gap-1.5 shrink-0"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortNewest ? 'Newest First' : 'Oldest First'}
        </Button>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <History className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">
              {allCompleted.length === 0
                ? 'No completed verifications yet.'
                : 'No results match your search.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(app => {
            const StatusIcon = STATUS_ICONS[app.status] || CheckCircle2;
            return (
              <div
                key={app.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border/60 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard/verification/${app.id}`)}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    app.status === 'approved' && 'bg-emerald-50',
                    app.status === 'returned_for_revision' && 'bg-amber-50',
                    app.status === 'rejected' && 'bg-red-50'
                  )}
                >
                  <StatusIcon
                    className={cn(
                      'h-5 w-5',
                      app.status === 'approved' && 'text-emerald-600',
                      app.status === 'returned_for_revision' && 'text-amber-600',
                      app.status === 'rejected' && 'text-red-600'
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {app.application_number}
                    </span>
                    {app.field_audit_required === 'yes' && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Field Audit
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate mt-0.5">
                    {app.project_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {app.ngo_name} — {app.project_owner_name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge
                    className={cn(
                      'text-[10px]',
                      APPLICATION_STATUS_COLORS[app.status]
                    )}
                  >
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3" />
                    {new Date(app.submitted_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
