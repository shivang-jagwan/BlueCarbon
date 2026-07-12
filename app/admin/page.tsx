'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FolderKanban, ShieldCheck, Award, DollarSign, Activity, Building2, User, AlertTriangle, CheckCircle2, Clock, ArrowRight, ScrollText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import type { Profile, Project, VerificationRequest } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    activeProjects: 0,
    pendingVerifications: 0,
    projectOwners: 0,
    verifiers: 0,
    partners: 0,
    passportsIssued: 0,
    totalFunding: 0,
    pendingApprovals: 0,
    draftProjects: 0,
    rejectedProjects: 0,
    totalPartnerships: 0,
    activePartnerships: 0,
  });

  type Activity = { id: string; text: string; time: string; type: 'user' | 'project' | 'verification' };
  const [recentActivities, setRecentActivities] = React.useState<Activity[]>([]);

  React.useEffect(() => {
    async function loadStats() {
      const { data: profiles } = await supabase.from('profiles').select('id, role, approval_status, created_at, full_name, organization');
      let totalUsers = 0;
      let projectOwners = 0;
      let verifiers = 0;
      let partners = 0;
      let pendingApprovals = 0;

      if (profiles) {
        totalUsers = profiles.length;
        profiles.forEach((p: Partial<Profile>) => {
          if (p.role === 'project_owner') projectOwners++;
          if (p.role === 'verifier') verifiers++;
          if (p.role === 'sustainability_partner') partners++;
          if (p.approval_status === 'pending') pendingApprovals++;
        });
      }

      const { data: projects } = await supabase.from('projects').select('id, status, name, created_at');
      let activeProjects = 0;
      let draftProjects = 0;
      let rejectedProjects = 0;
      if (projects) {
        projects.forEach((p: Partial<Project>) => {
          if (p.status === 'active' || p.status === 'verified') activeProjects++;
          if (p.status === 'draft') draftProjects++;
          if (p.status === 'rejected') rejectedProjects++;
        });
      }

      const { data: verifications } = await supabase.from('verification_service_requests').select('status, created_at, project_id');
      let pendingVerifications = 0;
      if (verifications) {
        verifications.forEach((v: VerificationRequest) => {
          if (v.status === 'pending') pendingVerifications++;
        });
      }

      const { data: funding } = await supabase.from('project_support').select('amount_usd').eq('status', 'completed');
      const totalFunding = funding?.reduce((sum: number, r: any) => sum + (r.amount_usd || 0), 0) ?? 0;

      const { count: passportCount } = await supabase.from('carbon_passports').select('id', { count: 'exact', head: true });

      const { data: partnerships } = await supabase.from('project_partnerships').select('status');
      let totalPartnerships = 0;
      let activePartnerships = 0;
      if (partnerships) {
        totalPartnerships = partnerships.length;
        activePartnerships = partnerships.filter((p: any) => p.status === 'active').length;
      }

      setStats({
        totalUsers,
        activeProjects,
        pendingVerifications,
        projectOwners,
        verifiers,
        partners,
        passportsIssued: passportCount || 0,
        totalFunding,
        pendingApprovals,
        draftProjects,
        rejectedProjects,
        totalPartnerships,
        activePartnerships,
      });

      const activities: Activity[] = [];
      if (profiles) {
        profiles.slice(0, 5).forEach((p: Partial<Profile>) => {
          activities.push({
            id: 'p-' + p.id,
            text: `New ${p.role?.replace('_', ' ') || 'user'} registered: ${p.organization || p.full_name || 'Unknown'}`,
            time: p.created_at as string,
            type: 'user'
          });
        });
      }
      if (projects) {
        projects.slice(0, 5).forEach((p: Partial<Project>) => {
          activities.push({
            id: 'proj-' + p.id,
            text: `Project "${p.name}" created`,
            time: p.created_at as string,
            type: 'project'
          });
        });
      }
      if (verifications) {
        verifications.slice(0, 3).forEach((v: any) => {
          activities.push({
            id: 'ver-' + v.id,
            text: `Verification request ${v.status.replace(/_/g, ' ')}`,
            time: v.created_at,
            type: 'verification'
          });
        });
      }

      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      
      setRecentActivities(activities.slice(0, 8));
    }

    loadStats();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">Admin Console Dashboard</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Users" value={stats.totalUsers} hint="Registered profiles" icon={Users} />
        <KpiCard label="Active Projects" value={stats.activeProjects} hint="Verified or active" icon={FolderKanban} />
        <KpiCard label="Pending Verifications" value={stats.pendingVerifications} hint="Requires attention" icon={ShieldCheck} />
        <KpiCard label="Total Support" value={`$${stats.totalFunding.toLocaleString()}`} hint="Committed" icon={DollarSign} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Project Owners" value={stats.projectOwners} hint="Active accounts" icon={User} />
        <KpiCard label="Verifiers" value={stats.verifiers} hint="Registered verifiers" icon={Building2} />
        <KpiCard label="Partners" value={stats.partners} hint="Active supporters" icon={Award} />
        <KpiCard label="Passports Issued" value={stats.passportsIssued} hint="Total verified" icon={Activity} />
      </div>

      {/* Platform Health */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold">Pending Approvals</h3>
          </div>
          <p className="text-3xl font-display font-bold text-amber-600">{stats.pendingApprovals}</p>
          <p className="text-xs text-muted-foreground mt-1">User registrations awaiting admin review</p>
          <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
            <Link href="/admin/users">Review Users <ArrowRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold">Verification Queue</h3>
          </div>
          <p className="text-3xl font-display font-bold text-blue-600">{stats.pendingVerifications}</p>
          <p className="text-xs text-muted-foreground mt-1">Verification requests awaiting auditor action</p>
          <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
            <Link href="/admin/verifications">Review Requests <ArrowRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-semibold">Active Partnerships</h3>
          </div>
          <p className="text-3xl font-display font-bold text-emerald-600">{stats.activePartnerships}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.totalPartnerships} total monitoring partnerships</p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <ScrollText className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-semibold">Draft Projects</h3>
          </div>
          <p className="text-3xl font-display font-bold">{stats.draftProjects}</p>
          <p className="text-xs text-muted-foreground mt-1">Projects still in draft status</p>
          <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
            <Link href="/admin/projects">View Projects <ArrowRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h3 className="text-sm font-semibold">Rejected Projects</h3>
          </div>
          <p className="text-3xl font-display font-bold text-red-600">{stats.rejectedProjects}</p>
          <p className="text-xs text-muted-foreground mt-1">Projects that failed verification</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Platform Health</h3>
          </div>
          <div className="space-y-2 mt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Users</span>
              <Badge variant="secondary" className="bg-success/10 text-success">{stats.totalUsers} registered</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Projects</span>
              <Badge variant="secondary" className="bg-success/10 text-success">{stats.activeProjects + stats.draftProjects} total</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Passports</span>
              <Badge variant="secondary" className="bg-success/10 text-success">{stats.passportsIssued} issued</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Platform Activity</CardTitle>
              <CardDescription>Latest global events across CarbonRush AI</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/logs">View Logs <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                <div className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  activity.type === 'user' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                  activity.type === 'verification' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-primary/10 text-primary'
                )}>
                  {activity.type === 'user' ? <User className="h-4 w-4" /> :
                   activity.type === 'verification' ? <ShieldCheck className="h-4 w-4" /> :
                   <FolderKanban className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none truncate">{activity.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activity.time ? formatDistanceToNow(new Date(activity.time), { addSuffix: true }) : 'Recently'}
                  </p>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <Activity className="h-8 w-8 opacity-40" />
                <p className="text-sm font-medium">No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
