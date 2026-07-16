'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useMonitoringReports, useProjectPartnerships } from '@/hooks/use-projects';
import { supabase } from '@/lib/supabase/client';
import { REPORT_TYPE_LABELS, MONITORING_STATUS_LABELS } from '@/lib/types';
import type { MonitoringReport, ReportType, MonitoringStatus } from '@/lib/types';
import {
  BarChart3,
  FileText,
  Download,
  Building2,
  User,
  Calendar,
  TrendingUp,
  Leaf,
  Map,
  Clock,
  Handshake,
} from 'lucide-react';

const STATUS_COLORS: Record<MonitoringStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  reviewed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

function MetricItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-slate-400" />
        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>
    </div>
  );
}

function formatMonth(periodMonth: string) {
  const d = new Date(periodMonth + '-01');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const REPORT_TABS: { key: ReportType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'inspection', label: 'Inspection' },
  { key: 'drone', label: 'Drone' },
  { key: 'satellite', label: 'Satellite' },
  { key: 'carbon', label: 'Carbon' },
  { key: 'health', label: 'Health' },
];

export default function MonitoringPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { reports, loading } = useMonitoringReports(projectId);
  const { partnerships, loading: partnershipsLoading } = useProjectPartnerships(projectId);
  const [activeTab, setActiveTab] = React.useState<ReportType | 'all'>('all');

  const activePartnerships = partnerships.filter((p: any) => p.status === 'active');

  const typedReports = reports as MonitoringReport[];

  const filteredReports = activeTab === 'all'
    ? typedReports
    : typedReports.filter((r) => (r as any).report_type === activeTab);

  const totalReports = typedReports.length;
  const approvedCount = typedReports.filter((r) => r.status === 'approved').length;
  const pendingCount = typedReports.filter((r) => r.status === 'submitted' || r.status === 'reviewed').length;
  const orgSet = new Set(typedReports.map((r) => (r as any).organization_name).filter(Boolean));
  const orgCount = orgSet.size;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">Monitoring Center</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Read-only monitoring workspace. Reports are submitted by Verification Organizations.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Total Reports</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {loading ? '-' : totalReports}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Approved</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {loading ? '-' : approvedCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Pending</span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {loading ? '-' : pendingCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
            <Building2 className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide">Organizations</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {loading ? '-' : orgCount}
          </p>
        </div>
      </div>

      {/* Active Partnerships */}
      {!partnershipsLoading && activePartnerships.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Handshake className="h-4 w-4 text-primary" />
            Active Monitoring Partnerships
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activePartnerships.map((p: any) => (
              <div
                key={p.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {p.profiles?.organization || p.profiles?.full_name || 'Organization'}
                  </span>
                </div>
                {p.verifier && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Verifier: {p.verifier.organization || p.verifier.full_name || 'N/A'}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span>Service: {p.service_type}</span>
                  {p.started_at && (
                    <span>
                      Since: {new Date(p.started_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Reports</h2>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Report List */}
        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
            <BarChart3 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">No monitoring reports yet</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Reports submitted by Verification Organizations will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const r = report as any;
              const reportType: ReportType = r.report_type || 'monthly';
              const statusLabel = MONITORING_STATUS_LABELS[report.status];
              const statusColor = STATUS_COLORS[report.status];

              return (
                <div
                  key={report.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {REPORT_TYPE_LABELS[reportType]} &mdash; {formatMonth(report.period_month)}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {r.organization_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {r.organization_name}
                          </span>
                        )}
                        {r.submitted_by_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {r.submitted_by_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(report.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="grid gap-3 sm:grid-cols-3 mb-4">
                    {report.area_observed_hectares !== null && (
                      <MetricItem icon={Map} label="Area" value={`${report.area_observed_hectares} ha`} />
                    )}
                    {report.ndvi_avg !== null && (
                      <MetricItem icon={Leaf} label="NDVI" value={report.ndvi_avg.toFixed(2)} />
                    )}
                    {report.carbon_estimate_tonnes !== null && (
                      <MetricItem icon={TrendingUp} label="Carbon" value={`${report.carbon_estimate_tonnes} t`} />
                    )}
                  </div>

                  {/* Notes */}
                  {report.notes && (
                    <div className="mb-4 rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
                      <p className="text-xs text-slate-600 dark:text-slate-400">{report.notes}</p>
                    </div>
                  )}

                  {/* Download */}
                  {r.file_url && (
                    <a
                      href={r.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Report
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
