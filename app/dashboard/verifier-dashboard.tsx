'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { useAssignedProjects, useVerificationRequests, useNotifications } from '@/hooks/use-projects';
import { KpiCard } from '@/components/shared/kpi-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FolderKanban, ShieldCheck, ClipboardCheck, Building2, Award, Sparkles,
  ArrowRight, CalendarDays, Bell, CheckCircle2, Clock, Camera, MapPin,
} from 'lucide-react';
import { getRoleLabel } from '@/lib/navigation';
import { VERIFICATION_REQUEST_TYPE_LABELS, VERIF_REQUEST_STATUS_LABELS, verificationStatusColor, priorityColor } from '@/lib/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';

function EvidenceStatsKpiCards({ projectIds }: { projectIds: string[] }) {
  const [stats, setStats] = React.useState({ total: 0, valid: 0, flagged: 0, gpsValid: 0 });

  React.useEffect(() => {
    if (projectIds.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from('verification_evidence')
        .select('validation_status, fraud_score, latitude, longitude')
        .in('project_id', projectIds);
      if (data) {
        setStats({
          total: data.length,
          valid: data.filter((e: any) => e.validation_status === 'valid').length,
          flagged: data.filter((e: any) => e.fraud_score > 40).length,
          gpsValid: data.filter((e: any) => e.latitude != null && e.longitude != null).length,
        });
      }
    })();
  }, [projectIds.join(',')]);

  if (projectIds.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Evidence Uploaded" value={stats.total} icon={Camera} />
      <KpiCard label="GPS Validated" value={stats.gpsValid} hint={`${stats.total > 0 ? Math.round((stats.gpsValid / stats.total) * 100) : 0}%`} icon={MapPin} />
      <KpiCard label="Evidence Valid" value={stats.valid} hint={`${stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0}%`} icon={CheckCircle2} />
      <KpiCard label="High Fraud Risk" value={stats.flagged} hint={stats.flagged > 0 ? 'Needs review' : 'All clear'} icon={ShieldCheck} />
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: 'Open Verification Center', href: '/dashboard/verification', icon: ShieldCheck, color: 'text-primary' },
  { label: 'View Monitoring Projects', href: '/dashboard/projects', icon: FolderKanban, color: 'text-accent' },
  { label: 'Generate Reports', href: '/dashboard/reports', icon: ClipboardCheck, color: 'text-success' },
  { label: 'View Calendar', href: '/dashboard/calendar', icon: CalendarDays, color: 'text-warning' },
];

export default function VerifierDashboard() {
  const { profile, user } = useAuth();
  const { projects, loading } = useAssignedProjects(user?.id ?? null);
  const { requests } = useVerificationRequests(user?.id ?? null);
  const { notifications } = useNotifications();

  const firstName = (profile?.full_name || 'there').split(' ')[0];
  const pendingLand = requests.filter((r) => r.request_type === 'land' && r.status === 'pending').length;
  const pendingProject = requests.filter((r) => r.request_type === 'project' && r.status === 'pending').length;
  const monthlyDue = requests.filter((r) => r.request_type === 'monthly' && r.status === 'pending').length;
  const corporateRequests = requests.filter((r) => r.request_type === 'corporate').length;
  const passportsIssued = projects.filter((p) => p.passport_issued_at).length;
  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const todayTasks = requests.filter((r) => r.status === 'pending').slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted-foreground">{getRoleLabel(profile?.role ?? null)} workspace</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Monitoring Projects" value={projects.length} hint={loading ? 'Loading...' : `${projects.filter((p) => p.status === 'active').length} active`} icon={FolderKanban} />
        <KpiCard label="Pending Land Verifications" value={pendingLand} hint={pendingLand > 0 ? 'Awaiting review' : 'All clear'} icon={ShieldCheck} />
        <KpiCard label="Pending Project Verifications" value={pendingProject} hint={pendingProject > 0 ? 'Awaiting review' : 'All clear'} icon={ClipboardCheck} />
        <KpiCard label="Monthly Reviews Due" value={monthlyDue} hint={monthlyDue > 0 ? 'Due soon' : 'Up to date'} icon={CalendarDays} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Corporate Requests" value={corporateRequests} icon={Building2} />
        <KpiCard label="Passports Issued" value={passportsIssued} icon={Award} />
        <KpiCard label="AI Flagged" value={requests.filter((r) => r.status === 'changes_requested').length} hint="Needs attention" icon={Sparkles} />
        <KpiCard label="Unread Notifications" value={unreadNotifications} icon={Bell} />
      </div>

      {/* Evidence KPIs */}
      <EvidenceStatsKpiCards projectIds={projects.map((p) => p.id)} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}>
              <Card className="group flex items-center gap-3 p-4 transition-all hover:shadow-soft hover:border-primary/30">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-muted', action.color)}><Icon className="h-5 w-5" /></div>
                <span className="text-sm font-medium">{action.label}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Verification Center</h2>
            <Button asChild variant="ghost" size="sm"><Link href="/dashboard/verification">View all<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
          </div>
          {loading ? (
            <Card className="p-8"><div className="flex items-center gap-3 text-muted-foreground"><Clock className="h-5 w-5 animate-spin" />Loading requests...</div></Card>
          ) : todayTasks.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-success/40" />
              <div><h3 className="font-semibold">All caught up</h3><p className="mt-1 text-sm text-muted-foreground">No pending temporary verification requests.</p></div>
            </Card>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((req) => (
                <Link key={req.id} href={`/dashboard/projects/${req.project_id}/decision`}>
                  <Card className="flex items-center gap-4 p-4 transition-all hover:shadow-soft hover:border-primary/30">
                    <div className={cn('h-3 w-3 shrink-0 rounded-full', priorityColor(req.priority))} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{VERIFICATION_REQUEST_TYPE_LABELS[req.request_type]}</p>
                      <p className="text-xs text-muted-foreground">{req.due_date ? `Due ${new Date(req.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No due date'}</p>
                    </div>
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', verificationStatusColor(req.status))}>{VERIF_REQUEST_STATUS_LABELS[req.status]}</span>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2"><FolderKanban className="h-5 w-5 text-accent" /> Monitoring Projects</h2>
            <Button asChild variant="ghost" size="sm"><Link href="/dashboard/projects">View all<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
          </div>
          {loading ? (
            <Card className="p-8"><div className="flex items-center gap-3 text-muted-foreground"><Clock className="h-5 w-5 animate-spin" />Loading projects...</div></Card>
          ) : projects.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <FolderKanban className="h-10 w-10 text-muted-foreground/40" />
              <div><h3 className="font-semibold">No active partnerships</h3><p className="mt-1 text-sm text-muted-foreground">You are not permanently assigned to any monitoring projects.</p></div>
            </Card>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map((project) => (
                <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                  <Card className="flex items-center justify-between gap-4 p-4 transition-all hover:shadow-soft hover:border-accent/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.location_name || 'Global'}</p>
                    </div>
                    <Badge variant="outline" className="bg-success/5 text-success border-success/20">Active Partnership</Badge>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
