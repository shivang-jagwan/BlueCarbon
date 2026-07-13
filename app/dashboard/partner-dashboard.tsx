'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { useNotifications } from '@/hooks/use-projects';
import { supabase } from '@/lib/supabase/client';
import type { Project, ProjectSupport } from '@/lib/types';
import { KpiCard } from '@/components/shared/kpi-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FolderKanban, Building2, Ruler, Leaf, FileText,
  ArrowRight, Globe, GitCompare, DollarSign, BarChart3,
  Bell, CheckCircle2, Bookmark, BellRing
} from 'lucide-react';
import { UpcomingEventsWidget } from '@/components/shared/calendar/UpcomingEventsWidget';
import { getRoleLabel } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const QUICK_ACTIONS = [
  { label: 'Discover Projects', href: '/dashboard/discover', icon: Globe, color: 'text-primary' },
  { label: 'Saved Projects', href: '/dashboard/saved-projects', icon: Bookmark, color: 'text-accent' },
  { label: 'Compare Projects', href: '/dashboard/compare', icon: GitCompare, color: 'text-warning' },
  { label: 'Support Center', href: '/dashboard/funding', icon: DollarSign, color: 'text-success' },
  { label: 'Impact Dashboard', href: '/dashboard/impact', icon: BarChart3, color: 'text-primary' },
  { label: 'View Reports', href: '/dashboard/reports', icon: FileText, color: 'text-accent' },
];

export default function PartnerDashboard() {
  const { profile, user } = useAuth();
  const { notifications } = useNotifications();
  const [stats, setStats] = React.useState({ 
    supportedProjects: 0, activeProjects: 0, ngosPartnered: 0, 
    totalArea: 0, carbonSequestered: 0, savedProjects: 0, followedProjects: 0 
  });
  const [supportedProjectsList, setSupportedProjectsList] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: contributions } = await supabase
          .from('project_support')
          .select('project_id')
          .eq('partner_id', user.id);
        
        const projectIds = new Set((contributions || []).map((c: ProjectSupport) => c.project_id));
        
        const { count: savedCount } = await supabase
          .from('saved_projects')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', user.id);

        const { count: followedCount } = await supabase
          .from('followed_projects')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', user.id);

        setStats((prev) => ({
          ...prev,
          supportedProjects: projectIds.size,
          savedProjects: savedCount || 0,
          followedProjects: followedCount || 0,
        }));

        if (projectIds.size > 0) {
          const { data: projects } = await supabase
            .from('projects')
            .select('*, profiles!owner_id(organization, full_name)')
            .in('id', Array.from(projectIds));
            
          setSupportedProjectsList(projects || []);

          const active = (projects || []).filter((p: Project) => p.status === 'active' || p.status === 'verified').length;
          const area = (projects || []).reduce((s: number, p: Project) => s + (p.area_hectares || 0), 0);
          const carbon = (projects || []).reduce((s: number, p: Project) => s + (p.target_carbon_tonnes || 0), 0);
          
          setStats((prev) => ({
            ...prev,
            activeProjects: active,
            totalArea: area,
            carbonSequestered: carbon,
            ngosPartnered: 0,
          }));
        }
      } catch {
        // Tables may not exist yet in production
      }
    })();
  }, [user]);

  const firstName = (profile?.full_name || 'there').split(' ')[0];
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        <p className="text-sm text-muted-foreground">{getRoleLabel(profile?.role ?? null)} Workspace</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Supported Projects" value={stats.supportedProjects} hint={`${stats.activeProjects} active`} icon={FolderKanban} />
        <KpiCard label="Total Area Restored" value={`${stats.totalArea.toFixed(1)} ha`} icon={Ruler} />
        <KpiCard label="Est. CO₂ Sequestered" value={`${stats.carbonSequestered.toLocaleString()} t`} icon={Leaf} />
        <KpiCard label="NGOs Partnered" value={stats.ngosPartnered} icon={Building2} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Saved Projects" value={stats.savedProjects} hint="Bookmarked for review" icon={Bookmark} />
        <KpiCard label="Projects Following" value={stats.followedProjects} hint="Receiving updates" icon={BellRing} />
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
        {/* My Supported Projects */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" /> My Supported Projects
            </h2>
            <Button asChild variant="ghost" size="sm"><Link href="/dashboard/impact">View Impact<ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>
          </div>
          <Card className="p-0 overflow-hidden">
            {supportedProjectsList.length === 0 ? (
              <div className="p-8 text-center border-dashed border-2 m-4 rounded-xl">
                <Leaf className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="font-semibold text-sm">No supported projects yet</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Start discovering projects to fund and monitor their impact.</p>
                <Button asChild size="sm">
                  <Link href="/dashboard/discover">Discover Projects</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {supportedProjectsList.map((project, i) => (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                    <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {project.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm leading-tight">{project.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{project.profiles?.organization || project.profiles?.full_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div className="hidden sm:block">
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="text-sm font-medium capitalize">{project.status.replace('_', ' ')}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <UpcomingEventsWidget />
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
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
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
