'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { useProjects, useNotifications } from '@/hooks/use-projects';
import { KpiCard } from '@/components/shared/kpi-card';
import { ProjectCard } from '@/components/shared/project-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, Sprout, ShieldCheck, Award, DollarSign, Bell, ArrowRight, Plus, Search, Building2, FileText, CheckCircle2, Handshake, Coins, Clock, Loader2, XCircle } from 'lucide-react';
import { UpcomingEventsWidget } from '@/components/shared/calendar/UpcomingEventsWidget';
import { getRoleLabel } from '@/lib/navigation';
import { supabase } from '@/lib/supabase/client';
import { sendNotification } from '@/lib/voc-services';
import { toast } from 'sonner';

const QUICK_ACTIONS = [
  { label: 'Register New Project', href: '/dashboard/projects/new', icon: Plus, color: 'text-primary' },
  { label: 'Discover Projects', href: '/dashboard/discover', icon: Search, color: 'text-accent' },
  { label: 'Browse Agencies', href: '/dashboard/verification-agencies', icon: Building2, color: 'text-warning' },
  { label: 'View Reports', href: '/dashboard/reports', icon: FileText, color: 'text-success' },
];

export default function OwnerDashboard() {
  const { profile, user } = useAuth();
  const { projects, loading } = useProjects();
  const { notifications } = useNotifications();
  const [pendingRequests, setPendingRequests] = React.useState<any[]>([]);
  const [actingId, setActingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('project_partnerships')
        .select('id, project_id, company_id, company:profiles!project_partnerships_company_id_fkey(full_name, organization), service_type, budget_usd, message, created_at, project:projects(name)')
        .eq('owner_id', user.id)
        .eq('status', 'pending_owner')
        .order('created_at', { ascending: false });
      if (data) setPendingRequests(data);
    })();
  }, [user]);

  const firstName = (profile?.full_name || 'there').split(' ')[0];
  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'verified').length;
  const pendingVerifications = projects.filter(
    (p) => p.verification_status === 'pending' || p.verification_status === 'in_review'
  ).length;
  const passportsIssued = projects.filter((p) => p.passport_issued_at).length;
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const handleAccept = async (req: any) => {
    setActingId(req.id);
    try {
      const { error } = await supabase
        .from('project_partnerships')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', req.id);
      if (error) throw error;

      const companyName = req.company?.full_name || 'Partner';
      await supabase.from('project_activity').insert({
        project_id: req.project_id,
        actor_id: user?.id,
        event_type: 'partnership_established',
        title: 'Partnership Accepted',
        description: `Accepted monitoring partnership with ${companyName}`,
      });

      await sendNotification({
        title: 'Partnership Accepted',
        body: `Your monitoring partnership request has been accepted.`,
        type: 'partnership_accepted',
        targetUserId: req.company_id,
        link: `/dashboard/projects/${req.project_id}`,
      });

      toast.success('Partnership accepted.');
      setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally { setActingId(null); }
  };

  const handleReject = async (req: any) => {
    setActingId(req.id);
    try {
      const { error } = await supabase
        .from('project_partnerships')
        .update({ status: 'rejected' })
        .eq('id', req.id);
      if (error) throw error;

      const companyName = req.company?.full_name || 'Partner';
      await supabase.from('project_activity').insert({
        project_id: req.project_id,
        actor_id: user?.id,
        event_type: 'partnership_terminated',
        title: 'Partnership Rejected',
        description: `Rejected monitoring partnership request from ${companyName}`,
      });

      await sendNotification({
        title: 'Partnership Rejected',
        body: `Your monitoring partnership request has been declined.`,
        type: 'verification',
        targetUserId: req.company_id,
        link: `/dashboard/projects/${req.project_id}`,
      });

      toast.success('Request rejected.');
      setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally { setActingId(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted-foreground">{getRoleLabel(profile?.role ?? null)} workspace</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Projects" value={projects.length} hint={loading ? 'Loading...' : `${activeProjects} active`} icon={FolderKanban} />
        <KpiCard label="Pending Verifications" value={pendingVerifications} hint={pendingVerifications > 0 ? 'Awaiting review' : 'All clear'} icon={ShieldCheck} />
        <KpiCard label="Carbon Passports" value={passportsIssued} hint={passportsIssued > 0 ? 'Issued' : 'None yet'} icon={Award} />
        <KpiCard label="Revenue" value={projects.reduce((sum, p) => sum + (p.verified_carbon_tonnes ?? 0), 0) > 0 ? `${projects.reduce((sum, p) => sum + (p.verified_carbon_tonnes ?? 0), 0).toLocaleString()} t` : '—'} hint="Carbon credits" icon={DollarSign} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}>
              <Card className="group flex items-center gap-3 p-4 transition-all hover:shadow-soft hover:border-primary/30">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${action.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Card>
            </Link>
          );
        })}
      </div>

      {pendingRequests.length > 0 && (
        <Card className="p-5 border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/10">
          <div className="flex items-center gap-2 mb-4">
            <Handshake className="h-4.5 w-4.5 text-amber-600" />
            <h3 className="font-semibold">Pending Partnership Requests</h3>
            <Badge className="ml-1 bg-amber-100 text-amber-700 border-amber-200 text-[10px]">{pendingRequests.length}</Badge>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((req) => {
              const company = req.company;
              const projectName = req.project?.name || 'Unknown Project';
              return (
                <div key={req.id} className="flex items-start gap-3 p-3 rounded-lg border border-amber-200/60 bg-white dark:bg-slate-900 dark:border-amber-800/30">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Building2 className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{company?.full_name || 'Unknown Company'}</p>
                    <Link href={`/dashboard/projects/${req.project_id}`} className="text-xs text-primary hover:underline">{projectName}</Link>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{req.service_type}</span>
                      {req.budget_usd && <span className="flex items-center gap-0.5"><Coins className="h-2.5 w-2.5" />${req.budget_usd.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleAccept(req)}
                      disabled={actingId === req.id}
                    >
                      {actingId === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle2 className="h-3 w-3 mr-0.5" /> Accept</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleReject(req)}
                      disabled={actingId === req.id}
                    >
                      <XCircle className="h-3 w-3 mr-0.5" /> Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">My Projects</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/projects">View all<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">{[1, 2].map((i) => <Card key={i} className="h-64 animate-pulse bg-muted/30" />)}</div>
          ) : projects.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"><Sprout className="h-7 w-7" /></div>
              <div><h3 className="font-semibold">No projects yet</h3><p className="mt-1 text-sm text-muted-foreground">Register your first restoration project to get started.</p></div>
              <Button asChild><Link href="/dashboard/projects/new"><Plus className="mr-2 h-4 w-4" />Register New Project</Link></Button>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.slice(0, 4).map((project) => <ProjectCard key={project.id} project={project} href={`/dashboard/projects/${project.id}`} ownerName={profile?.full_name || undefined} />)}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-6">
          <UpcomingEventsWidget />
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2"><Bell className="h-4.5 w-4.5 text-primary" /><h3 className="font-semibold">Notifications</h3></div>
              {unreadNotifications > 0 && <Badge variant="secondary" className="text-xs">{unreadNotifications} new</Badge>}
            </div>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="py-6 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground/40" /><p className="mt-2 text-xs text-muted-foreground">All caught up</p></div>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-muted-foreground/30' : 'bg-primary'}`} />
                    <div className="flex-1"><p className="text-sm font-medium leading-tight">{n.title}</p>{n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}<p className="mt-0.5 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p></div>
                  </div>
                ))
              )}
            </div>
            <Button asChild variant="ghost" size="sm" className="mt-4 w-full"><Link href="/dashboard/notifications">View all<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
