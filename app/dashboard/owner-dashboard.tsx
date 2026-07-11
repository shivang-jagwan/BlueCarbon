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
import {
  FolderKanban,
  Sprout,
  ShieldCheck,
  Award,
  DollarSign,
  CalendarDays,
  Bell,
  ArrowRight,
  Plus,
  Search,
  Building2,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { getRoleLabel } from '@/lib/navigation';

const QUICK_ACTIONS = [
  { label: 'Register New Project', href: '/dashboard/projects/new', icon: Plus, color: 'text-primary' },
  { label: 'Browse Funding', href: '/dashboard/discover', icon: Search, color: 'text-accent' },
  { label: 'Find Verifier', href: '/dashboard/verifiers', icon: Building2, color: 'text-warning' },
  { label: 'View Reports', href: '/dashboard/reports', icon: FileText, color: 'text-success' },
];

const CALENDAR_EVENTS = [
  { title: 'Monthly Verification Due', date: 'Jul 15', type: 'verification' },
  { title: 'Drone Survey', date: 'Jul 18', type: 'survey' },
  { title: 'NGO Site Visit', date: 'Jul 22', type: 'visit' },
  { title: 'Report Submission', date: 'Jul 30', type: 'report' },
];

const EVENT_COLORS: Record<string, string> = {
  verification: 'bg-amber-500',
  survey: 'bg-blue-500',
  visit: 'bg-success',
  report: 'bg-primary',
};

export default function OwnerDashboard() {
  const { profile } = useAuth();
  const { projects, loading } = useProjects();
  const { notifications } = useNotifications();

  const firstName = (profile?.full_name || 'there').split(' ')[0];
  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'verified').length;
  const pendingVerifications = projects.filter(
    (p) => p.verification_status === 'pending' || p.verification_status === 'in_review'
  ).length;
  const passportsIssued = projects.filter((p) => p.passport_issued_at).length;
  const unreadNotifications = notifications.filter((n) => !n.read).length;

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
        <KpiCard label="Funding Received" value="$0" hint="Total to date" icon={DollarSign} />
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
              {projects.slice(0, 4).map((project) => <ProjectCard key={project.id} project={project} href={`/dashboard/projects/${project.id}`} />)}
            </div>
          )}
        </div>
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2"><CalendarDays className="h-4.5 w-4.5 text-primary" /><h3 className="font-semibold">Upcoming</h3></div>
            <div className="space-y-3">
              {CALENDAR_EVENTS.map((event, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${EVENT_COLORS[event.type]}`} />
                  <div className="flex-1"><p className="text-sm font-medium leading-tight">{event.title}</p><p className="text-xs text-muted-foreground">{event.date}</p></div>
                </div>
              ))}
            </div>
            <Button asChild variant="ghost" size="sm" className="mt-4 w-full"><Link href="/dashboard/calendar">View Calendar<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
          </Card>
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
