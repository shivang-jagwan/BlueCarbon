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
  ArrowRight, CalendarDays, Bell, CheckCircle2, Clock,
} from 'lucide-react';
import { getRoleLabel } from '@/lib/navigation';
import { VERIFICATION_REQUEST_TYPE_LABELS, VERIF_REQUEST_STATUS_LABELS, verificationStatusColor, priorityColor } from '@/lib/types';
import { cn } from '@/lib/utils';

const QUICK_ACTIONS = [
  { label: 'Open Verification Center', href: '/dashboard/verification', icon: ShieldCheck, color: 'text-primary' },
  { label: 'View Assigned Projects', href: '/dashboard/projects', icon: FolderKanban, color: 'text-accent' },
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
        <KpiCard label="Assigned Projects" value={projects.length} hint={loading ? 'Loading...' : `${projects.filter((p) => p.status === 'active').length} active`} icon={FolderKanban} />
        <KpiCard label="Pending Land Verifications" value={pendingLand} hint={pendingLand > 0 ? 'Awaiting review' : 'All clear'} icon={ShieldCheck} />
        <KpiCard label="Pending Project Verifications" value={pendingProject} hint={pendingProject > 0 ? 'Awaiting review' : 'All clear'} icon={ClipboardCheck} />
        <KpiCard label="Monthly Reviews Due" value={monthlyDue} hint={monthlyDue > 0 ? 'Due soon' : 'Up to date'} icon={CalendarDays} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Corporate Requests" value={corporateRequests} icon={Building2} />
        <KpiCard label="Passports Issued" value={passportsIssued} icon={Award} />
        <KpiCard label="AI Flagged" value={0} hint="Needs attention" icon={Sparkles} />
        <KpiCard label="Unread Notifications" value={unreadNotifications} icon={Bell} />
      </div>

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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Today&apos;s Tasks</h2>
            <Button asChild variant="ghost" size="sm"><Link href="/dashboard/verification">View all<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
          </div>
          {loading ? (
            <Card className="p-8"><div className="flex items-center gap-3 text-muted-foreground"><Clock className="h-5 w-5 animate-spin" />Loading tasks...</div></Card>
          ) : todayTasks.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-success/40" />
              <div><h3 className="font-semibold">All caught up</h3><p className="mt-1 text-sm text-muted-foreground">No pending verification tasks. Great work!</p></div>
            </Card>
          ) : (
            <div className="space-y-2">
              {todayTasks.map((req) => (
                <Link key={req.id} href={`/dashboard/projects/${req.project_id}`}>
                  <Card className="flex items-center gap-4 p-4 transition-all hover:shadow-soft hover:border-primary/30">
                    <div className={cn('h-3 w-3 shrink-0 rounded-full', priorityColor(req.priority))} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{VERIFICATION_REQUEST_TYPE_LABELS[req.request_type]}</p>
                      <p className="text-xs text-muted-foreground">{req.due_date ? `Due ${new Date(req.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No due date'}</p>
                    </div>
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', verificationStatusColor(req.status))}>{VERIF_REQUEST_STATUS_LABELS[req.status]}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><Bell className="h-4.5 w-4.5 text-primary" /><h3 className="font-semibold">Notifications</h3></div>
            {unreadNotifications > 0 && <Badge variant="secondary" className="text-xs">{unreadNotifications} new</Badge>}
          </div>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="py-4 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground/40" /><p className="mt-2 text-xs text-muted-foreground">All caught up</p></div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-start gap-3">
                  <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-muted-foreground/30' : 'bg-primary')} />
                  <div className="flex-1"><p className="text-sm font-medium leading-tight">{n.title}</p>{n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}<p className="mt-0.5 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p></div>
                </div>
              ))
            )}
          </div>
          <Button asChild variant="ghost" size="sm" className="mt-4 w-full"><Link href="/dashboard/notifications">View all<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
        </Card>
      </div>
    </div>
  );
}
