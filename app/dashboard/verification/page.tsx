'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ClipboardCheck,
  Eye,
  CalendarClock,
  CheckCircle2,
  RotateCcw,
  XCircle,
  ArrowRight,
  Clock,
  Shield,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApplications, getApplicationsByStatus, getActiveApplicationsForAgency, getAgencyForProfile } from '@/lib/voc-services';
import { useAuth } from '@/components/providers/auth-provider';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  type VerificationApplication,
  type ApplicationStatus,
} from '@/lib/voc-types';

const KPI_CARDS = [
  { label: 'Pending', icon: ClipboardCheck, color: 'text-blue-600', bg: 'bg-blue-50', status: 'submitted' as const },
  { label: 'Under Review', icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50', status: 'under_review' as const },
  { label: 'Audit Scheduled', icon: CalendarClock, color: 'text-purple-600', bg: 'bg-purple-50', status: 'audit_scheduled' as const },
  { label: 'Approved', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', status: 'approved' as const },
  { label: 'Returned', icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-50', status: 'returned_for_revision' as const },
  { label: 'Rejected', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', status: 'rejected' as const },
];

const ACTIVE_STATUSES: ApplicationStatus[] = [
  'submitted',
  'under_review',
  'audit_scheduled',
  'audit_completed',
];

export default function VOCDashboardPage() {
  const router = useRouter();
  const { profile } = useAuth();

  const allApplications = React.useMemo(() => {
    const all = getApplications();
    if (!profile) return all;
    const agency = getAgencyForProfile(profile.id);
    if (agency) {
      return all.filter(app => app.verification_agency_id === agency.id);
    }
    return all;
  }, [profile]);

  const counts = React.useMemo(() => {
    const c: Record<string, number> = {};
    KPI_CARDS.forEach((k) => {
      c[k.status] = allApplications.filter(a => a.status === k.status).length;
    });
    return c;
  }, [allApplications]);

  const activeApplications = allApplications.filter((a) =>
    ACTIVE_STATUSES.includes(a.status)
  );

  const totalActive = activeApplications.length;
  const totalCompleted = allApplications.filter((a) =>
    ['approved', 'returned_for_revision', 'rejected'].includes(a.status)
  ).length;
  const approvalRate =
    totalCompleted > 0
      ? Math.round(
          (counts['approved'] / totalCompleted) * 100
        )
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Verification Operations Center
            </h1>
            <p className="text-sm text-muted-foreground">
              Review applications, manage audits, and issue verification
              decisions.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.status}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg mb-3',
                    kpi.bg
                  )}
                >
                  <Icon className={cn('h-4 w-4', kpi.color)} />
                </div>
                <p className="text-2xl font-bold font-display">
                  {counts[kpi.status] || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {kpi.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Active Applications
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push('/dashboard/verification/applications')
                }
              >
                View All{' '}
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeApplications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  No active applications. All caught up!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeApplications.slice(0, 5).map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/dashboard/verification/workspace/${app.id}`
                      )
                    }
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {app.application_number}
                        </span>
                        {app.field_audit_required === 'yes' && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
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
                        {new Date(
                          app.submitted_date
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Applications
                </span>
                <span className="text-sm font-semibold">
                  {allApplications.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Active
                </span>
                <span className="text-sm font-semibold">
                  {totalActive}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Completed
                </span>
                <span className="text-sm font-semibold">
                  {totalCompleted}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Approval Rate
                </span>
                <span className="text-sm font-semibold">
                  {approvalRate}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-muted-foreground">
                    Pending: {counts['submitted'] || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-xs text-muted-foreground">
                    Under Review: {counts['under_review'] || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-xs text-muted-foreground">
                    Audit Scheduled: {counts['audit_scheduled'] || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-cyan-500" />
                  <span className="text-xs text-muted-foreground">
                    Audit Completed:{' '}
                    {counts['audit_completed'] || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
