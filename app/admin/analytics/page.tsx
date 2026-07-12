'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from '@/components/shared/Charts';
import { supabase } from '@/lib/supabase/client';
import { Clock } from 'lucide-react';

export default function AnalyticsPage() {
  const [stats, setStats] = React.useState({ users: 0, projects: 0, verifiers: 0, partners: 0, passports: 0 });
  const [projectsByStatus, setProjectsByStatus] = React.useState<{ name: string; value: number }[]>([]);
  const [usersByRole, setUsersByRole] = React.useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const [profilesRes, projectsRes, passportsRes] = await Promise.all([
        supabase.from('profiles').select('role'),
        supabase.from('projects').select('status'),
        supabase.from('carbon_passports').select('id', { count: 'exact', head: true }),
      ]);

      const profiles = profilesRes.data || [];
      const projects = projectsRes.data || [];

      const roleCounts: Record<string, number> = {};
      profiles.forEach((p: { role: string }) => { roleCounts[p.role] = (roleCounts[p.role] || 0) + 1; });

      const statusCounts: Record<string, number> = {};
      projects.forEach((p: { status: string }) => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });

      setStats({
        users: profiles.length,
        projects: projects.length,
        verifiers: roleCounts['verifier'] || 0,
        partners: roleCounts['sustainability_partner'] || 0,
        passports: passportsRes.count || 0,
      });

      setUsersByRole([
        { name: 'Project Owners', value: roleCounts['project_owner'] || 0 },
        { name: 'Partners', value: roleCounts['sustainability_partner'] || 0 },
        { name: 'Verifiers', value: roleCounts['verifier'] || 0 },
        { name: 'Admins', value: roleCounts['admin'] || 0 },
      ]);

      setProjectsByStatus(
        Object.entries(statusCounts).map(([name, value]) => ({
          name: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          value,
        }))
      );

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ROLE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];
  const STATUS_COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--primary))', 'hsl(var(--muted-foreground))'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Platform Analytics</h1>
        <p className="text-sm text-muted-foreground">Real-time platform statistics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
            <CardDescription>Distribution of platform users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={usersByRole} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} dataKey="value">
                    {usersByRole.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects by Status</CardTitle>
            <CardDescription>Current project distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={projectsByStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {projectsByStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Platform Summary</CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-muted/30 text-center">
                <p className="text-3xl font-bold text-primary">{stats.users}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Users</p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/30 text-center">
                <p className="text-3xl font-bold text-primary">{stats.projects}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Projects</p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/30 text-center">
                <p className="text-3xl font-bold text-primary">{stats.verifiers}</p>
                <p className="text-sm text-muted-foreground mt-1">Verifiers</p>
              </div>
              <div className="p-4 rounded-lg border bg-muted/30 text-center">
                <p className="text-3xl font-bold text-primary">{stats.passports}</p>
                <p className="text-sm text-muted-foreground mt-1">Passports Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
