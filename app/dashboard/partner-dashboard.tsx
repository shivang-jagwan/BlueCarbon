'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { KpiCard } from '@/components/shared/kpi-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FolderKanban, ShieldCheck, FileText, Award, MapPin,
  ArrowRight, Globe, BarChart3, Calendar, Building2,
  TreePine, AlertTriangle, CheckCircle2, Clock, Eye,
  TrendingUp, Leaf, Wind, Droplets, Activity, Search,
  Download, ChevronRight, RefreshCw, Layers, Ruler,
} from 'lucide-react';
import { PROJECT_TYPE_LABELS, PROJECT_STATUS_LABELS, type ProjectType, type VerificationStatus } from '@/lib/types';
import { APPLICATION_STATUS_LABELS } from '@/lib/voc-types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

/* ─── Types ─────────────────────────────────────────────────── */

interface PartnerProject {
  id: string;
  name: string;
  location_name: string | null;
  country: string | null;
  project_type: string;
  status: string;
  verification_status: string;
  area_hectares: number | null;
  owner_id: string;
  cover_image_url: string | null;
  created_at: string;
}

interface PortfolioProject {
  project: PartnerProject;
  partnership_status: string;
  verification_status: string;
  passport_status: string | null;
  latest_verification: {
    id: string;
    agency_name: string;
    status: string;
    audit_date: string | null;
    last_updated: string | null;
  } | null;
  latest_monitoring: {
    id: string;
    report_date: string | null;
    created_at: string;
  } | null;
}

interface ActivityItem {
  id: string;
  project_id: string;
  project_name: string;
  event_type: string;
  title: string;
  description: string | null;
  created_at: string;
  actor_name?: string;
}

interface AgencyInfo {
  id: string;
  name: string;
  logo_url: string | null;
  projects_verified: number;
  projects_monitoring: number;
  last_activity: string | null;
}

interface Alert {
  id: string;
  type: 'monitoring_due' | 'monitoring_overdue' | 'passport_ready' | 'new_report' | 'audit_scheduled' | 'new_images';
  title: string;
  description: string;
  project_id: string;
  project_name: string;
  severity: 'info' | 'warning' | 'success' | 'urgent';
}

/* ─── Helper Components ─────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  verified: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  in_verification: 'bg-blue-100 text-blue-700 border-blue-200',
  in_review: 'bg-blue-100 text-blue-700 border-blue-200',
  submitted: 'bg-blue-100 text-blue-700 border-blue-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  registered: 'bg-slate-100 text-slate-700 border-slate-200',
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  none: 'bg-slate-100 text-slate-500 border-slate-200',
  requested: 'bg-blue-100 text-blue-700 border-blue-200',
  under_processing: 'bg-amber-100 text-amber-700 border-amber-200',
  issued: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const ALERT_ICONS: Record<string, React.ElementType> = {
  monitoring_due: Clock,
  monitoring_overdue: AlertTriangle,
  passport_ready: Award,
  new_report: FileText,
  audit_scheduled: Calendar,
  new_images: Activity,
};

const ALERT_COLORS: Record<string, string> = {
  info: 'border-blue-200 bg-blue-50',
  warning: 'border-amber-200 bg-amber-50',
  success: 'border-emerald-200 bg-emerald-50',
  urgent: 'border-red-200 bg-red-50',
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  const colorClass = STATUS_COLORS[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <Badge className={cn('text-[10px] border font-medium', colorClass)}>{label}</Badge>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, action }: {
  icon: React.ElementType; title: string; subtitle?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-base font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <Button variant="ghost" size="sm" asChild className="text-xs">
          <Link href={action.href}>{action.label}<ChevronRight className="ml-1 h-3 w-3" /></Link>
        </Button>
      )}
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────────── */

export default function PartnerDashboard() {
  const { profile, user } = useAuth();
  const [portfolio, setPortfolio] = React.useState<PortfolioProject[]>([]);
  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [agencies, setAgencies] = React.useState<AgencyInfo[]>([]);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      // 1. Get ALL partner's projects via project_partnerships (for history)
      const { data: allPartnerships } = await supabase
        .from('project_partnerships')
        .select('project_id, status')
        .eq('company_id', user.id);

      if (!allPartnerships || allPartnerships.length === 0) {
        if (!cancelled) { setPortfolio([]); setActivities([]); setLoading(false); }
        return;
      }

      const allProjectIds = Array.from(new Set(allPartnerships.map((p: any) => p.project_id)));
      const activePartnerships = allPartnerships.filter((p: any) => p.status === 'active');
      const activeProjectIds = Array.from(new Set(activePartnerships.map((p: any) => p.project_id)));

      // 2. Fetch project details for ALL projects (needed for activity names and portfolio)
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, location_name, country, project_type, status, verification_status, area_hectares, owner_id, cover_image_url, created_at')
        .in('id', allProjectIds);

      if (!projects || projects.length === 0) {
        if (!cancelled) { setPortfolio([]); setActivities([]); setLoading(false); }
        return;
      }

      // 3. Fetch latest verification ONLY for active projects
      let latestVerifications: Record<string, any> = {};
      let allAgencyRequests: any[] = [];
      
      if (activeProjectIds.length > 0) {
        const { data: vocRequests } = await supabase
          .from('voc_requests')
          .select('id, project_id')
          .in('project_id', activeProjectIds);

        if (vocRequests && vocRequests.length > 0) {
          const requestIds = vocRequests.map((r: any) => r.id);
          const requestIdToProject: Record<string, string> = {};
          vocRequests.forEach((r: any) => { requestIdToProject[r.id] = r.project_id; });

          const { data: agencyRequests } = await supabase
            .from('voc_agency_requests')
            .select('id, request_id, agency_name, verification_status, audit_date, last_updated')
            .in('request_id', requestIds)
            .order('last_updated', { ascending: false });

          if (agencyRequests) {
            allAgencyRequests = agencyRequests;
            for (const ar of agencyRequests) {
              const pid = requestIdToProject[ar.request_id];
              if (pid && !latestVerifications[pid]) {
                latestVerifications[pid] = {
                  id: ar.id,
                  agency_name: ar.agency_name,
                  status: ar.verification_status,
                  audit_date: ar.audit_date,
                  last_updated: ar.last_updated,
                };
              }
            }
          }
        }
      }

      // 4. Fetch passport applications per active project
      const passportStatus: Record<string, string> = {};
      if (activeProjectIds.length > 0) {
        const { data: passports } = await supabase
          .from('voc_passport_applications')
          .select('project_id, status')
          .in('project_id', activeProjectIds);

        if (passports) {
          for (const pp of passports) {
            if (!passportStatus[pp.project_id]) passportStatus[pp.project_id] = pp.status;
          }
        }
      }

      // 5. Fetch monitoring reports for active projects
      const latestMonitoring: Record<string, any> = {};
      if (activeProjectIds.length > 0) {
        const { data: monitoringReports } = await supabase
          .from('monitoring_reports')
          .select('id, project_id, period_month, created_at')
          .in('project_id', activeProjectIds)
          .order('created_at', { ascending: false });

        if (monitoringReports) {
          for (const mr of monitoringReports) {
            if (!latestMonitoring[mr.project_id]) {
              latestMonitoring[mr.project_id] = {
                id: mr.id,
                report_date: mr.period_month,
                created_at: mr.created_at,
              };
            }
          }
        }
      }

      // 6. Fetch partner's verification agencies
      const agencyMap: Record<string, { name: string; logo_url: string | null; verified: number; monitoring: number; lastActivity: string | null }> = {};
      for (const ar of allAgencyRequests) {
        if (!agencyMap[ar.agency_name]) {
          agencyMap[ar.agency_name] = { name: ar.agency_name, logo_url: null, verified: 0, monitoring: 0, lastActivity: null };
        }
        if (ar.verification_status === 'approved') agencyMap[ar.agency_name].verified++;
        else agencyMap[ar.agency_name].monitoring++;
        if (ar.last_updated && (!agencyMap[ar.agency_name].lastActivity || ar.last_updated > agencyMap[ar.agency_name].lastActivity!)) {
          agencyMap[ar.agency_name].lastActivity = ar.last_updated;
        }
      }

      // 7. Build portfolio (ONLY active projects)
      const portfolioItems: PortfolioProject[] = projects
        .filter((p: any) => activeProjectIds.includes(p.id))
        .map((p: any) => {
          return {
            project: p as PartnerProject,
            partnership_status: 'active',
            verification_status: p.verification_status || 'not_submitted',
            passport_status: passportStatus[p.id] || null,
            latest_verification: latestVerifications[p.id] || null,
            latest_monitoring: latestMonitoring[p.id] || null,
          };
        });

      // 8. Build activity feed from project_activity (for ALL projects)
      const { data: activityData } = await supabase
        .from('project_activity')
        .select('id, project_id, event_type, title, description, created_at, actor_id')
        .in('project_id', allProjectIds)
        .order('created_at', { ascending: false })
        .limit(20);

      const activities: ActivityItem[] = (activityData || []).map((a: any) => {
        const proj = projects.find((p: any) => p.id === a.project_id);
        return {
          id: a.id,
          project_id: a.project_id,
          project_name: proj?.name || 'Unknown Project',
          event_type: a.event_type,
          title: a.title,
          description: a.description,
          created_at: a.created_at,
        };
      });

      // 9. Build alerts (ONLY active projects)
      const alertsList: Alert[] = [];
      const now = new Date();
      for (const item of portfolioItems) {
        const p = item.project;

        // Monitoring overdue (no report in 90+ days for active partnerships)
        if (item.latest_monitoring) {
          const lastDate = new Date(item.latest_monitoring.created_at);
          const daysSince = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSince > 90) {
            alertsList.push({
              id: `overdue-${p.id}`,
              type: 'monitoring_overdue',
              title: 'Monitoring Overdue',
              description: `Last report was ${daysSince} days ago`,
              project_id: p.id,
              project_name: p.name,
              severity: 'urgent',
            });
          } else if (daysSince > 60) {
            alertsList.push({
              id: `due-${p.id}`,
              type: 'monitoring_due',
              title: 'Monitoring Due Soon',
              description: `Last report was ${daysSince} days ago`,
              project_id: p.id,
              project_name: p.name,
              severity: 'warning',
            });
          }
        }

        // Passport ready
        if (item.verification_status === 'approved' && (!item.passport_status || item.passport_status === 'none')) {
          alertsList.push({
            id: `passport-ready-${p.id}`,
            type: 'passport_ready',
            title: 'Carbon Passport Available',
            description: 'Project is verified and eligible for a Carbon Passport',
            project_id: p.id,
            project_name: p.name,
            severity: 'success',
          });
        }
      }

      if (!cancelled) {
        setPortfolio(portfolioItems);
        setActivities(activities);
        setAgencies(Object.values(agencyMap).map((a, i) => ({ id: String(i), ...a, last_activity: a.lastActivity, projects_verified: a.verified, projects_monitoring: a.monitoring })));
        setAlerts(alertsList);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // ─── Compute KPIs ─────────────────────────────────────────
  const totalProjects = portfolio.length;
  const verifiedProjects = portfolio.filter(p => p.verification_status === 'approved').length;
  const activeMonitoring = portfolio.filter(p => p.partnership_status === 'active').length;
  const totalVerificationReports = portfolio.filter(p => p.latest_verification).length;
  const passportsIssued = portfolio.filter(p => p.passport_status === 'issued').length;
  const totalArea = portfolio.reduce((sum, p) => sum + (p.project.area_hectares || 0), 0);

  const firstName = (profile?.full_name || 'there').split(' ')[0];

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-96 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-xl border border-border/60 bg-white dark:bg-slate-900 animate-pulse" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 rounded-xl border border-border/60 bg-white dark:bg-slate-900 animate-pulse" />
          <div className="h-96 rounded-xl border border-border/60 bg-white dark:bg-slate-900 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">

      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Portfolio Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {firstName}. Monitoring {totalProjects} project{totalProjects !== 1 ? 's' : ''}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/discover"><Search className="mr-1.5 h-3.5 w-3.5" />Discover Projects</Link>
          </Button>
        </div>
      </div>

      {/* ─── Section 1: Portfolio Summary KPIs ─────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Projects"
          value={totalProjects}
          hint={`${activeMonitoring} actively monitored`}
          icon={FolderKanban}
        />
        <KpiCard
          label="Verified Projects"
          value={verifiedProjects}
          hint={verifiedProjects > 0 ? `${Math.round((verifiedProjects / totalProjects) * 100)}% of portfolio` : 'None yet'}
          icon={ShieldCheck}
        />
        <KpiCard
          label="Verification Reports"
          value={totalVerificationReports}
          hint="Across all projects"
          icon={FileText}
        />
        <KpiCard
          label="Carbon Passports"
          value={passportsIssued}
          hint={passportsIssued > 0 ? 'Issued to portfolio' : 'None yet'}
          icon={Award}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Total Verified Area"
          value={totalArea > 0 ? `${totalArea.toFixed(1)} ha` : '—'}
          hint="Combined portfolio area"
          icon={Ruler}
        />
        <KpiCard
          label="Verification Agencies"
          value={agencies.length}
          hint="Working on your projects"
          icon={Building2}
        />
        <KpiCard
          label="Active Alerts"
          value={alerts.length}
          hint={alerts.filter(a => a.severity === 'urgent').length > 0 ? `${alerts.filter(a => a.severity === 'urgent').length} urgent` : 'All clear'}
          icon={AlertTriangle}
          className={alerts.some(a => a.severity === 'urgent') ? 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20' : undefined}
        />
      </div>

      {/* ─── Sections 2+3+4: Activity + Portfolio + Alerts ─ */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left: My Portfolio (wide) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Section 3: My Portfolio */}
          <div>
            <SectionHeader
              icon={FolderKanban}
              title="My Portfolio"
              subtitle={`${totalProjects} monitored project${totalProjects !== 1 ? 's' : ''}`}
              action={{ label: 'View all', href: '/dashboard/projects' }}
            />
            {portfolio.length === 0 ? (
              <Card className="p-8 text-center border-dashed">
                <Globe className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-semibold text-sm">No Projects Yet</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Discover verified blue carbon projects to start monitoring.</p>
                <Button asChild size="sm">
                  <Link href="/dashboard/discover">Discover Projects</Link>
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {portfolio.map((item) => (
                  <PortfolioCard key={item.project.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Recent Activity */}
          <div>
            <SectionHeader
              icon={Activity}
              title="Recent Activity"
              subtitle="Latest events across your portfolio"
              action={{ label: 'View all', href: '/dashboard/projects' }}
            />
            {activities.length === 0 ? (
              <Card className="p-6 text-center border-dashed">
                <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </Card>
            ) : (
              <Card className="p-4">
                <div className="space-y-0">
                  {activities.slice(0, 8).map((activity, idx) => (
                    <ActivityRow key={activity.id} activity={activity} isLast={idx === Math.min(activities.length, 8) - 1} />
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Section 4: Monitoring Alerts */}
          <div>
            <SectionHeader icon={AlertTriangle} title="Monitoring Alerts" subtitle={`${alerts.length} active`} />
            {alerts.length === 0 ? (
              <Card className="p-6 text-center border-dashed">
                <CheckCircle2 className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All clear — no alerts</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 6).map((alert) => (
                  <AlertRow key={alert.id} alert={alert} />
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Carbon Passport Summary */}
          <div>
            <SectionHeader icon={Award} title="Carbon Passports" subtitle="Portfolio passport status" />
            <PassportSummary portfolio={portfolio} />
          </div>

          {/* Section 5: Verification Organizations */}
          <div>
            <SectionHeader
              icon={Building2}
              title="Verification Agencies"
              subtitle="Organizations working on your projects"
              action={{ label: 'Browse all', href: '/dashboard/verification-agencies' }}
            />
            {agencies.length === 0 ? (
              <Card className="p-6 text-center border-dashed">
                <Building2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No agency activity yet</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {agencies.map((agency) => (
                  <AgencyRow key={agency.id} agency={agency} />
                ))}
              </div>
            )}
          </div>

          {/* Section 7: Quick Actions */}
          <div>
            <SectionHeader icon={TrendingUp} title="Quick Actions" />
            <div className="space-y-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href}>
                    <Card className="group flex items-center gap-3 p-3 transition-all hover:shadow-soft hover:border-primary/30 cursor-pointer">
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0', action.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium flex-1">{action.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Section 9: Charts ──────────────────────────── */}
      {totalProjects > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ProjectsByTypeChart portfolio={portfolio} />
          <VerificationStatusChart portfolio={portfolio} />
        </div>
      )}
    </div>
  );
}

/* ─── Sub-Components ────────────────────────────────────────── */

function PortfolioCard({ item }: { item: PortfolioProject }) {
  const p = item.project;
  const typeLabel = PROJECT_TYPE_LABELS[p.project_type as ProjectType] || p.project_type;
  const verLabel = APPLICATION_STATUS_LABELS[item.latest_verification?.status as keyof typeof APPLICATION_STATUS_LABELS] || item.latest_verification?.status || 'Not started';
  const passportLabel = item.passport_status && item.passport_status !== 'none'
    ? item.passport_status.charAt(0).toUpperCase() + item.passport_status.slice(1).replace('_', ' ')
    : 'Not applied';

  return (
    <Card className="p-4 hover:shadow-soft transition-all">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <TreePine className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/dashboard/projects/${p.id}`} className="text-sm font-semibold hover:underline line-clamp-1">
                {p.name}
              </Link>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span>{typeLabel}</span>
                {p.location_name && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{p.location_name}</span>
                  </>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="shrink-0 -mr-1 h-7 text-xs">
              <Link href={`/dashboard/projects/${p.id}`}><Eye className="h-3 w-3 mr-1" />Open</Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={item.verification_status} label={verLabel} />
            {item.passport_status && item.passport_status !== 'none' && (
              <StatusBadge status={item.passport_status} label={`Passport: ${passportLabel}`} />
            )}
            {item.latest_verification?.agency_name && (
              <span className="text-[10px] text-muted-foreground">
                by {item.latest_verification.agency_name}
              </span>
            )}
            {item.latest_verification?.audit_date && (
              <span className="text-[10px] text-muted-foreground">
                · Audit {new Date(item.latest_verification.audit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ActivityRow({ activity, isLast }: { activity: ActivityItem; isLast: boolean }) {
  const eventIcons: Record<string, React.ElementType> = {
    verification_requested: Send,
    verification_completed: CheckCircle2,
    monitoring_report: FileText,
    passport_issued: Award,
    evidence_uploaded: Activity,
    event_created: Calendar,
    partnership_established: Building2,
    monitoring_invitation_sent: Building2,
  };
  const Icon = eventIcons[activity.event_type] || Activity;
  const projLink = `/dashboard/projects/${activity.project_id}`;

  return (
    <div className={cn('flex items-start gap-3 py-2.5', !isLast && 'border-b border-border/40')}>
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-1">{activity.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
          <Link href={projLink} className="hover:underline font-medium text-foreground/80 truncate">{activity.project_name}</Link>
          {activity.description && (
            <>
              <span>·</span>
              <span className="truncate">{activity.description}</span>
            </>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

// @ts-ignore
const Send = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
);

function AlertRow({ alert }: { alert: Alert }) {
  const Icon = ALERT_ICONS[alert.type] || AlertTriangle;
  return (
    <Link href={`/dashboard/projects/${alert.project_id}`}>
      <Card className={cn('p-3 cursor-pointer transition-all hover:shadow-sm border', ALERT_COLORS[alert.severity])}>
        <div className="flex items-start gap-2.5">
          <Icon className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">{alert.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{alert.project_name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{alert.description}</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        </div>
      </Card>
    </Link>
  );
}

function PassportSummary({ portfolio }: { portfolio: PortfolioProject[] }) {
  const counts = {
    issued: portfolio.filter(p => p.passport_status === 'issued').length,
    under_processing: portfolio.filter(p => p.passport_status === 'under_processing').length,
    requested: portfolio.filter(p => p.passport_status === 'requested').length,
    none: portfolio.filter(p => !p.passport_status || p.passport_status === 'none').length,
  };
  const cards = [
    { label: 'Issued', count: counts.issued, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    { label: 'Processing', count: counts.under_processing, color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    { label: 'Requested', count: counts.requested, color: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText },
    { label: 'Not Applied', count: counts.none, color: 'bg-slate-50 text-slate-500 border-slate-200', icon: Award },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={cn('flex items-center gap-2 rounded-lg border p-3', card.color)}>
            <Icon className="h-4 w-4 shrink-0" />
            <div>
              <p className="text-lg font-bold leading-none">{card.count}</p>
              <p className="text-[10px] mt-0.5">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AgencyRow({ agency }: { agency: AgencyInfo }) {
  return (
    <Card className="p-3 hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{agency.name}</p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
            <span>{agency.projects_verified} verified</span>
            <span>·</span>
            <span>{agency.projects_monitoring} monitoring</span>
            {agency.last_activity && (
              <>
                <span>·</span>
                <span>{formatDistanceToNow(new Date(agency.last_activity), { addSuffix: true })}</span>
              </>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild className="shrink-0 h-7 text-xs">
          <Link href="/dashboard/verification-agencies">View</Link>
        </Button>
      </div>
    </Card>
  );
}

/* ─── Charts ────────────────────────────────────────────────── */

function ProjectsByTypeChart({ portfolio }: { portfolio: PortfolioProject[] }) {
  const typeCounts: Record<string, number> = {};
  for (const item of portfolio) {
    const type = PROJECT_TYPE_LABELS[item.project.project_type as ProjectType] || item.project.project_type;
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }
  const entries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const maxVal = Math.max(...entries.map(e => e[1]), 1);

  const typeColors: Record<string, string> = {
    Mangrove: 'bg-emerald-500',
    Seagrass: 'bg-teal-500',
    'Salt Marsh': 'bg-cyan-500',
    'Kelp Forest': 'bg-blue-500',
    'Mixed Ecosystem': 'bg-violet-500',
  };

  if (entries.length === 0) return null;

  return (
    <Card className="p-6">
      <SectionHeader icon={Leaf} title="Projects by Ecosystem" subtitle={`${portfolio.length} total`} />
      <div className="space-y-3 mt-2">
        {entries.map(([type, count]) => (
          <div key={type} className="flex items-center gap-3">
            <span className="text-xs font-medium w-28 truncate text-muted-foreground">{type}</span>
            <div className="flex-1 h-6 rounded-md bg-muted/50 overflow-hidden">
              <div
                className={cn('h-full rounded-md transition-all', typeColors[type] || 'bg-primary')}
                style={{ width: `${(count / maxVal) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold w-6 text-right">{count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function VerificationStatusChart({ portfolio }: { portfolio: PortfolioProject[] }) {
  const statusCounts: Record<string, number> = {};
  for (const item of portfolio) {
    const status = item.verification_status || 'not_submitted';
    const label = APPLICATION_STATUS_LABELS[status as keyof typeof APPLICATION_STATUS_LABELS] || status;
    statusCounts[label] = (statusCounts[label] || 0) + 1;
  }
  const entries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
  const total = portfolio.length || 1;

  const statusColors: Record<string, string> = {
    Approved: 'bg-emerald-500',
    Verified: 'bg-emerald-500',
    'Not Started': 'bg-slate-400',
    Submitted: 'bg-blue-500',
    'Under Review': 'bg-blue-500',
    'Audit Scheduled': 'bg-purple-500',
    'Audit Completed': 'bg-cyan-500',
    'Returned for Revision': 'bg-orange-500',
    Rejected: 'bg-red-500',
  };

  if (entries.length === 0) return null;

  return (
    <Card className="p-6">
      <SectionHeader icon={BarChart3} title="Verification Status" subtitle={`${portfolio.length} projects`} />
      <div className="mt-3 space-y-2">
        {entries.map(([status, count]) => (
          <div key={status} className="flex items-center gap-3">
            <span className="text-xs font-medium w-32 truncate text-muted-foreground">{status}</span>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-6 rounded-md bg-muted/50 overflow-hidden">
                <div
                  className={cn('h-full rounded-md transition-all', statusColors[status] || 'bg-primary')}
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold w-12 text-right">{count} ({Math.round((count / total) * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ─── Constants ─────────────────────────────────────────────── */

const QUICK_ACTIONS = [
  { label: 'Discover Projects', href: '/dashboard/discover', icon: Globe, color: 'text-primary' },
  { label: 'Monitoring Reports', href: '/dashboard/projects', icon: FileText, color: 'text-accent' },
  { label: 'Verification Agencies', href: '/dashboard/verification-agencies', icon: Building2, color: 'text-warning' },
];
