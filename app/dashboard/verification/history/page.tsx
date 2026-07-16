'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Clock,
  History,
  Award,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getHistoryApplications } from '@/lib/voc-services';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  DECISION_LABELS,
  DECISION_COLORS,
  type VerificationApplication,
} from '@/lib/voc-types';

const DECISION_ICONS: Record<string, React.ReactNode> = {
  approve: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  return_for_revision: <RotateCcw className="h-4 w-4 text-amber-600" />,
  reject: <XCircle className="h-4 w-4 text-red-600" />,
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'approved', label: 'Approved' },
  { value: 'returned_for_revision', label: 'Returned for Revision' },
  { value: 'rejected', label: 'Rejected' },
];

const DECISION_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Decisions' },
  { value: 'approve', label: 'Approved' },
  { value: 'return_for_revision', label: 'Returned' },
  { value: 'reject', label: 'Rejected' },
];

export default function VerificationHistoryPage() {
  const router = useRouter();
  const [applications] = React.useState<VerificationApplication[]>(getHistoryApplications);
  const [search, setSearch] = React.useState('');
  const [decisionFilter, setDecisionFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const filtered = React.useMemo(() => {
    return applications.filter((app) => {
      const query = search.toLowerCase();
      const matchesSearch =
        query === '' ||
        app.application_number.toLowerCase().includes(query) ||
        app.project_name.toLowerCase().includes(query) ||
        app.verifier_name?.toLowerCase().includes(query);
      const matchesDecision =
        decisionFilter === 'all' || app.decision === decisionFilter;
      const matchesStatus =
        statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesDecision && matchesStatus;
    });
  }, [applications, search, decisionFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <History className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Verification History
          </h1>
          <p className="text-sm text-muted-foreground">
            Immutable record of all completed verification applications.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by number, project, or verifier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={decisionFilter} onValueChange={setDecisionFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Decision" />
          </SelectTrigger>
          <SelectContent>
            {DECISION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[185px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} record{filtered.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-3">
        {filtered.map((app) => (
          <Card
            key={app.id}
            className="group cursor-pointer transition-shadow hover:shadow-md"
            onClick={() =>
              router.push(`/dashboard/verification/workspace/${app.id}`)
            }
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {app.decision
                    ? DECISION_ICONS[app.decision]
                    : <Clock className="h-4 w-4 text-muted-foreground" />}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">
                      {app.application_number}
                    </span>
                    {app.decision ? (
                      <Badge
                        className={cn(
                          'text-[10px] font-medium',
                          DECISION_COLORS[app.decision]
                        )}
                      >
                        {DECISION_LABELS[app.decision]}
                      </Badge>
                    ) : (
                      <Badge
                        className={cn(
                          'text-[10px] font-medium',
                          APPLICATION_STATUS_COLORS[app.status]
                        )}
                      >
                        {APPLICATION_STATUS_LABELS[app.status]}
                      </Badge>
                    )}
                    {app.decision === 'approve' && app.carbon_passport && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        <Award className="mr-1 h-3 w-3" />
                        Carbon Passport
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm font-medium truncate">
                    {app.project_name}
                  </p>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {app.decision_notes || 'No decision notes'}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {app.decision_date
                      ? new Date(app.decision_date).toLocaleDateString()
                      : '—'}
                  </span>
                  {app.decision === 'approve' && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <Shield className="h-3 w-3" />
                      <span className="font-medium">Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <History className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No history records found
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
