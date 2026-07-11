'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KpiCard } from '@/components/shared/kpi-card';
import { Users, FolderKanban, ShieldCheck, Award, DollarSign, Activity, Building2, User } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart } from '@/components/shared/Charts';
import { supabase } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import type { Profile, Project, VerificationRequest } from '@/lib/types';

const userGrowthData = [
  { name: 'Jan', total: 120 },
  { name: 'Feb', total: 210 },
  { name: 'Mar', total: 350 },
  { name: 'Apr', total: 420 },
  { name: 'May', total: 600 },
  { name: 'Jun', total: 850 },
  { name: 'Jul', total: 1100 },
];

const fundingData = [
  { name: 'Jan', amount: 15000 },
  { name: 'Feb', amount: 35000 },
  { name: 'Mar', amount: 65000 },
  { name: 'Apr', amount: 92000 },
  { name: 'May', amount: 140000 },
  { name: 'Jun', amount: 195000 },
  { name: 'Jul', amount: 250000 },
];

export default function AdminDashboard() {
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    activeProjects: 0,
    pendingVerifications: 0,
    projectOwners: 0,
    verifiers: 0,
    partners: 0,
    passportsIssued: 0,
  });

  const [recentActivities, setRecentActivities] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function loadStats() {
      // 1. Get profile counts
      const { data: profiles } = await supabase.from('profiles').select('role, approval_status, created_at, full_name, organization');
      let totalUsers = 0;
      let projectOwners = 0;
      let verifiers = 0;
      let partners = 0;

      if (profiles) {
        totalUsers = profiles.length;
        profiles.forEach((p: Profile) => {
          if (p.role === 'project_owner') projectOwners++;
          if (p.role === 'verifier') verifiers++;
          if (p.role === 'sustainability_partner') partners++;
        });
      }

      // 2. Get project counts
      const { data: projects } = await supabase.from('projects').select('status, name, created_at');
      let activeProjects = 0;
      if (projects) {
        projects.forEach((p: Project) => {
          if (p.status === 'active' || p.status === 'verified') activeProjects++;
        });
      }

      // 3. Get pending verifications
      const { data: verifications } = await supabase.from('verification_requests').select('status');
      let pendingVerifications = 0;
      if (verifications) {
        verifications.forEach((v: VerificationRequest) => {
          if (v.status === 'pending') pendingVerifications++;
        });
      }

      setStats({
        totalUsers,
        activeProjects,
        pendingVerifications,
        projectOwners,
        verifiers,
        partners,
        passportsIssued: Math.floor(activeProjects * 0.8), // Mock passports for now
      });

      // 4. Build a recent activity feed from profiles and projects
      const activities: any[] = [];
      if (profiles) {
        profiles.slice(0, 5).forEach((p: any) => {
          activities.push({
            id: 'p-' + Math.random(),
            text: `New ${p.role.replace('_', ' ')} registered: ${p.organization || p.full_name || 'Unknown'}`,
            time: p.created_at,
            type: 'user'
          });
        });
      }
      if (projects) {
        projects.slice(0, 5).forEach((p: any) => {
          activities.push({
            id: 'proj-' + Math.random(),
            text: `Project "${p.name}" created`,
            time: p.created_at,
            type: 'project'
          });
        });
      }

      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      
      setRecentActivities(activities.slice(0, 6));
    }

    loadStats();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Platform Overview</h1>
        <p className="text-sm text-muted-foreground">Admin Console Dashboard</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Users" value={stats.totalUsers} hint="Registered profiles" icon={Users} />
        <KpiCard label="Active Projects" value={stats.activeProjects} hint="Verified or active" icon={FolderKanban} />
        <KpiCard label="Pending Verifications" value={stats.pendingVerifications} hint="Requires attention" icon={ShieldCheck} />
        <KpiCard label="Total Funding" value="$250k" hint="Committed (Mock)" icon={DollarSign} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Project Owners" value={stats.projectOwners} hint="Active accounts" icon={User} />
        <KpiCard label="Verifiers" value={stats.verifiers} hint="Registered verifiers" icon={Building2} />
        <KpiCard label="Partners" value={stats.partners} hint="Active funders" icon={Award} />
        <KpiCard label="Passports Issued" value={stats.passportsIssued} hint="Total verified" icon={Activity} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Cumulative registered users across all roles (Mock Data)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Funding Overview</CardTitle>
            <CardDescription>Monthly committed funding volume (Mock Data)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fundingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Platform Activity</CardTitle>
          <CardDescription>Latest global events across CarbonRush AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {activity.type === 'user' ? <User className="h-4 w-4" /> : <FolderKanban className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">{activity.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activity.time ? formatDistanceToNow(new Date(activity.time), { addSuffix: true }) : 'Recently'}
                  </p>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">No recent activity</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
