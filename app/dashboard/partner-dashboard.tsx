'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { useNotifications } from '@/hooks/use-projects';
import { supabase } from '@/lib/supabase/client';
import type { Project, FundingContribution } from '@/lib/types';
import { KpiCard } from '@/components/shared/kpi-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FolderKanban, Sprout, Building2, Ruler, Leaf, Users, FileText,
  ArrowRight, Globe, GitCompare, DollarSign, BarChart3,
  CalendarDays, Bell, CheckCircle2, TrendingUp,
} from 'lucide-react';
import { getRoleLabel } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const QUICK_ACTIONS = [
  { label: 'Discover Projects', href: '/dashboard/discover', icon: Globe, color: 'text-primary' },
  { label: 'Compare Projects', href: '/dashboard/compare', icon: GitCompare, color: 'text-accent' },
  { label: 'Browse Verifiers', href: '/dashboard/verifiers', icon: Building2, color: 'text-warning' },
  { label: 'Funding Center', href: '/dashboard/funding', icon: DollarSign, color: 'text-success' },
  { label: 'Impact Dashboard', href: '/dashboard/impact', icon: BarChart3, color: 'text-primary' },
  { label: 'View Reports', href: '/dashboard/reports', icon: FileText, color: 'text-accent' },
];

const CALENDAR_EVENTS = [
  { title: 'Verification Visit', date: 'Jul 15', type: 'verification' },
  { title: 'NGO Meeting', date: 'Jul 18', type: 'meeting' },
  { title: 'Report Deadline', date: 'Jul 22', type: 'report' },
  { title: 'Funding Milestone', date: 'Jul 30', type: 'funding' },
];

const EVENT_COLORS: Record<string, string> = {
  verification: 'bg-amber-500', meeting: 'bg-blue-500', report: 'bg-primary', funding: 'bg-success',
};

const RECENT_ACTIVITY = [
  { title: 'Funding approved for Sundarbans Project', time: '2h ago', type: 'funding' },
  { title: 'Monthly verification completed', time: '5h ago', type: 'verification' },
  { title: 'New report available', time: '1d ago', type: 'report' },
  { title: 'NGO comment added', time: '2d ago', type: 'comment' },
];

const ACTIVITY_COLORS: Record<string, string> = {
  funding: 'bg-success', verification: 'bg-amber-500', report: 'bg-primary', comment: 'bg-blue-500',
};

export default function PartnerDashboard() {
  const { profile, user } = useAuth();
  const { notifications } = useNotifications();
  const [stats, setStats] = React.useState({ supportedProjects: 0, activeProjects: 0, ngosPartnered: 0, totalArea: 0, carbonSequestered: 0, reportsGenerated: 0 });

  React.useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: contributions } = await supabase
        .from('funding_contributions')
        .select('project_id')
        .eq('partner_id', user.id);
      const projectIds = new Set((contributions || []).map((c: FundingContribution) => c.project_id));
      setStats((prev) => ({
        ...prev,
        supportedProjects: projectIds.size,
        reportsGenerated: projectIds.size * 3,
      }));

      if (projectIds.size > 0) {
        const { data: projects } = await supabase
          .from('projects')
          .select('*')
          .in('id', Array.from(projectIds));
        const active = (projects || []).filter((p: Project) => p.status === 'active' || p.status === 'verified').length;
        const area = (projects || []).reduce((s: number, p: Project) => s + (p.area_hectares || 0), 0);
        const carbon = (projects || []).reduce((s: number, p: Project) => s + (p.target_carbon_tonnes || 0), 0);
        const ngos = new Set((projects || []).map((p: Project) => p.verifier_id).filter(Boolean)).size;
        setStats((prev) => ({
          ...prev,
          activeProjects: active,
          totalArea: area,
          carbonSequestered: carbon,
          ngosPartnered: ngos,
        }));
      }
    })();
  }, [user]);

  const firstName = (profile?.full_name || 'there').split(' ')[0];
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted-foreground">{getRoleLabel(profile?.role ?? null)} workspace</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Supported Projects" value={stats.supportedProjects} hint={`${stats.activeProjects} active`} icon={FolderKanban} />
        <KpiCard label="NGOs Partnered" value={stats.ngosPartnered} icon={Building2} />
        <KpiCard label="Total Area Restored" value={`${stats.totalArea.toFixed(1)} ha`} icon={Ruler} />
        <KpiCard label="Est. CO₂ Sequestered" value={`${stats.carbonSequestered} t`} icon={Leaf} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Communities Benefited" value="—" hint="Coming soon" icon={Users} />
        <KpiCard label="Reports Generated" value={stats.reportsGenerated} icon={FileText} />
        <KpiCard label="Unread Notifications" value={unreadNotifications} icon={Bell} />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} href={action.href}>
              <Card className="group flex items-center gap-3 p-4 transition-all hover:shadow-soft hover:border-primary/30">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-muted', action.color)}>
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
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent Activity</h2>
            <Button asChild variant="ghost" size="sm"><Link href="/dashboard/impact">View Impact<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
          </div>
          <Card className="p-5">
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', ACTIVITY_COLORS[activity.type])} />
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2"><CalendarDays className="h-4.5 w-4.5 text-primary" /><h3 className="font-semibold">Upcoming</h3></div>
            <div className="space-y-3">
              {CALENDAR_EVENTS.map((event, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', EVENT_COLORS[event.type])} />
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
    </div>
  );
}
