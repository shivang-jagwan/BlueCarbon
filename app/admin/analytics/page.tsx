'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, Bar, 
  AreaChart, Area, 
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from '@/components/shared/Charts';

const userRoleData = [
  { name: 'Project Owners', value: 650 },
  { name: 'Partners', value: 330 },
  { name: 'Verifiers', value: 120 },
];
const ROLE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))'];

const monthlyData = [
  { name: 'Jan', users: 120, projects: 15, passports: 0 },
  { name: 'Feb', users: 210, projects: 28, passports: 2 },
  { name: 'Mar', users: 350, projects: 45, passports: 10 },
  { name: 'Apr', users: 420, projects: 70, passports: 25 },
  { name: 'May', users: 600, projects: 110, passports: 48 },
  { name: 'Jun', users: 850, projects: 165, passports: 85 },
  { name: 'Jul', users: 1100, projects: 220, passports: 128 },
];

const stateProjectsData = [
  { name: 'West Bengal', projects: 85 },
  { name: 'Odisha', projects: 62 },
  { name: 'Andhra Pradesh', projects: 54 },
  { name: 'Tamil Nadu', projects: 48 },
  { name: 'Gujarat', projects: 35 },
];

const verificationStatusData = [
  { name: 'Verified', value: 45 },
  { name: 'In Verification', value: 30 },
  { name: 'Registered', value: 15 },
  { name: 'Draft', value: 10 },
];
const STATUS_COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--primary))', 'hsl(var(--muted-foreground))'];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Platform Analytics</h1>
        <p className="text-sm text-muted-foreground">Deep dive into user, project, and environmental metrics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle>User & Project Growth</CardTitle>
            <CardDescription>Monthly registrations vs new projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Area type="monotone" name="Users" dataKey="users" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} />
                  <Area type="monotone" name="Projects" dataKey="projects" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Carbon Passports */}
        <Card>
          <CardHeader>
            <CardTitle>Carbon Passport Issuance</CardTitle>
            <CardDescription>Cumulative passports issued over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area type="step" name="Passports Issued" dataKey="passports" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Projects by State */}
        <Card>
          <CardHeader>
            <CardTitle>Projects by State</CardTitle>
            <CardDescription>Top 5 states with most blue carbon projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateProjectsData} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                  <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="projects" name="Projects" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown Charts */}
        <div className="grid gap-6 grid-cols-2">
          <Card>
            <CardHeader className="p-4 pb-0 text-center">
              <CardTitle className="text-sm">Users by Role</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userRoleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {userRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-4 pb-0 text-center">
              <CardTitle className="text-sm">Verification Status</CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verificationStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {verificationStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
