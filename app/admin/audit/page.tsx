'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Shield, Activity, Users, Clock, AlertTriangle, Download } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useAuditLogs, useAuditStats, useSecurityEvents } from '@/hooks/use-audit';
import { AuditTimeline } from '@/components/audit/AuditTimeline';
import { AuditFilters, type AuditFiltersState } from '@/components/audit/AuditFilters';
import { SecurityEventsTable } from '@/components/audit/SecurityEventsTable';

const ITEMS_PER_PAGE = 20;

export default function AuditCenterPage() {
  const { profile } = useAuth();
  const [auditPage, setAuditPage] = React.useState(1);
  const [securityPage, setSecurityPage] = React.useState(1);

  const [filters, setFilters] = React.useState<AuditFiltersState>({
    severity: '',
    actionType: '',
    role: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  const apiFilters = React.useMemo(
    () => ({
      severity: (filters.severity || undefined) as any,
      action: (filters.actionType || undefined) as any,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      page: auditPage,
    }),
    [filters.severity, filters.actionType, filters.dateFrom, filters.dateTo, auditPage]
  );

  const { logs, total: logsTotal, loading: logsLoading, refetch: refetchLogs } = useAuditLogs(apiFilters);
  const { stats, loading: statsLoading } = useAuditStats();
  const {
    events: securityEvents,
    total: securityTotal,
    loading: securityLoading,
    refetch: refetchSecurity,
  } = useSecurityEvents({ page: securityPage });

  const totalLogPages = Math.max(1, Math.ceil(logsTotal / ITEMS_PER_PAGE));
  const totalSecurityPages = Math.max(1, Math.ceil(securityTotal / ITEMS_PER_PAGE));

  const handleResolve = React.useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/security/events/${id}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolvedBy: profile?.id || 'admin' }),
        });
        refetchSecurity();
      } catch (err) {
        console.error('Failed to resolve security event', err);
      }
    },
    [profile?.id, refetchSecurity]
  );

  const handleExport = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.actionType) params.set('action', filters.actionType);
      if (filters.role) params.set('role', filters.role);
      if (filters.dateFrom) params.set('date_from', filters.dateFrom);
      if (filters.dateTo) params.set('date_to', filters.dateTo);
      params.set('export', 'csv');
      const qs = params.toString();
      const response = await fetch(`/api/audit${qs ? `?${qs}` : ''}`);
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export audit logs', err);
    }
  }, [filters]);

  const kpiCards = [
    {
      label: 'Total Audit Events',
      value: stats?.total_logs ?? 0,
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: 'Security Events',
      value: securityTotal,
      icon: Shield,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      label: 'Critical Events',
      value: stats?.recent_critical ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/40',
    },
    {
      label: 'Unique Users',
      value: stats?.unique_users ?? 0,
      icon: Users,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
  ];

  function renderPagination(page: number, total: number, onPageChange: (p: number) => void) {
    if (total <= 1) return null;
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {total}
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(page - 1)}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(total, 5) }, (_, i) => {
              const pageNum = total <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, total - 4)) + i;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink isActive={pageNum === page} onClick={() => onPageChange(pageNum)}>
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(page + 1)}
                className={page === total ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Audit Center</h1>
            <p className="text-sm text-muted-foreground">Immutable audit trail and security monitoring</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="mt-2 sm:mt-0">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {statsLoading ? (
                    <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    kpi.value.toLocaleString()
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="timeline">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="timeline">Audit Timeline</TabsTrigger>
            <TabsTrigger value="security">
              Security Events
              {securityTotal > 0 && (
                <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">
                  {securityTotal}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="timeline" className="space-y-4 mt-4">
          <AuditFilters filters={filters} onFilterChange={setFilters} />

          {logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <AuditTimeline logs={logs} />
              {renderPagination(auditPage, totalLogPages, setAuditPage)}
            </>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-4">
          {securityLoading ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <SecurityEventsTable events={securityEvents} onResolve={handleResolve} />
              {renderPagination(securityPage, totalSecurityPages, setSecurityPage)}
            </>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="mt-4">
          {statsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : stats ? (
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Top Actions</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.by_action)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 8)
                      .map(([action, count]) => (
                        <div key={action} className="flex items-center justify-between">
                          <span className="text-sm truncate">
                            {action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {count.toLocaleString()}
                          </Badge>
                        </div>
                      ))}
                    {Object.keys(stats.by_action).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Severity Distribution</h3>
                  <div className="space-y-3">
                    {Object.entries(stats.by_severity).map(([severity, count]) => {
                      const total = Object.values(stats.by_severity).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={severity} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm capitalize">{severity}</span>
                            <span className="text-xs text-muted-foreground">
                              {count.toLocaleString()} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                severity === 'critical'
                                  ? 'bg-red-500'
                                  : severity === 'security'
                                    ? 'bg-orange-500'
                                    : severity === 'warning'
                                      ? 'bg-amber-500'
                                      : 'bg-blue-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(stats.by_severity).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Summary</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm">Total Events</span>
                      <span className="text-sm font-semibold">{stats.total_logs.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm">Critical Events</span>
                      <span className="text-sm font-semibold text-red-600">
                        {stats.recent_critical.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <span className="text-sm">Unique Users</span>
                      <span className="text-sm font-semibold">{stats.unique_users.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm">Action Types</span>
                      <span className="text-sm font-semibold">{Object.keys(stats.by_action).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <Activity className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No statistics available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
