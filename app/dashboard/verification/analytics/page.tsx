'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  BarChart3, TrendingUp, Clock, CheckCircle2, XCircle, RotateCcw, Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApplications } from '@/lib/voc-services';
import type { VOCAnalytics } from '@/lib/voc-types';

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

function computeAnalytics(): VOCAnalytics {
  const apps = getApplications();
  const total = apps.length;
  const approved = apps.filter(a => a.status === 'approved').length;
  const rejected = apps.filter(a => a.status === 'rejected').length;
  const returned = apps.filter(a => a.status === 'returned_for_revision').length;
  const audited = apps.filter(a => a.audit_report !== null).length;
  const withAudit = apps.filter(a => a.field_audit_required === 'yes').length;

  const statusCounts: Record<string, number> = {};
  apps.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });

  return {
    total_applications: total,
    approval_rate: total > 0 ? Math.round((approved / total) * 100) : 0,
    avg_verification_time_hours: 0,
    rejected_count: rejected,
    returned_count: returned,
    audit_completion_rate: withAudit > 0 ? Math.round((audited / withAudit) * 100) : 0,
    by_status: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    by_month: [],
  };
}

export default function VOCAnalyticsPage() {
  const analytics = React.useMemo(() => computeAnalytics(), []);

  const kpiData = [
    { label: 'Total Applications', value: analytics.total_applications, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Approval Rate', value: `${analytics.approval_rate}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg. Verification Time', value: `${analytics.avg_verification_time_hours}h`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Audit Completion Rate', value: `${analytics.audit_completion_rate}%`, icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Rejected', value: analytics.rejected_count, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Returned for Revision', value: analytics.returned_count, icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const pieData = [
    { name: 'Approved', value: analytics.approval_rate },
    { name: 'Rejected', value: analytics.rejected_count },
    { name: 'Returned', value: analytics.returned_count },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Verification Analytics</h1>
          <p className="text-sm text-muted-foreground">Performance metrics and verification insights.</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="shadow-sm">
              <CardContent className="p-4">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg mb-3', kpi.bg)}>
                  <Icon className={cn('h-4 w-4', kpi.color)} />
                </div>
                <p className="text-2xl font-bold font-display">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Monthly Verification Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.by_month.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.by_month}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returned" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Decision Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.total_applications > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Applications by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.by_status.length > 0 ? (
              <div className="space-y-3">
                {analytics.by_status.map((item) => {
                  const maxCount = Math.max(...analytics.by_status.map(t => t.count));
                  const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  return (
                    <div key={item.status} className="flex items-center gap-4">
                      <span className="text-sm w-44 shrink-0">{item.status}</span>
                      <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
