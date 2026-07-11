'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  LayoutDashboard,
  Activity,
  Upload,
  ClipboardList,
  FileText,
  BarChart3,
  DollarSign,
  Award,
  CalendarDays,
  Settings,
  Map,
  Loader2,
  MessageSquare,
  Sparkles,
  Gavel,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  statusColor,
} from '@/lib/types';

const OWNER_TABS = [
  { label: 'Overview', href: '', icon: LayoutDashboard },
  { label: 'Map', href: '/map', icon: Map },
  { label: 'Timeline', href: '/timeline', icon: Activity },
  { label: 'Evidence', href: '/evidence', icon: Upload },
  { label: 'Monitoring', href: '/monitoring', icon: ClipboardList },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Revenue', href: '/revenue', icon: DollarSign },
  { label: 'Carbon Passport', href: '/passport', icon: Award },
  { label: 'Funding', href: '/funding', icon: DollarSign },
  { label: 'Calendar', href: '/calendar', icon: CalendarDays },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const VERIFIER_TABS = [
  { label: 'Overview', href: '', icon: LayoutDashboard },
  { label: 'Map', href: '/map', icon: Map },
  { label: 'Evidence Review', href: '/evidence', icon: CheckCircle2 },
  { label: 'Monthly Reviews', href: '/monitoring', icon: ClipboardList },
  { label: 'Discussion', href: '/discussion', icon: MessageSquare },
  { label: 'AI Review', href: '/ai-review', icon: Sparkles },
  { label: 'Decision', href: '/decision', icon: Gavel },
  { label: 'Carbon Passport', href: '/passport', icon: Award },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Timeline', href: '/timeline', icon: Activity },
];

const PARTNER_TABS = [
  { label: 'Overview', href: '', icon: LayoutDashboard },
  { label: 'Map', href: '/map', icon: Map },
  { label: 'Timeline', href: '/timeline', icon: Activity },
  { label: 'Evidence', href: '/evidence', icon: Eye },
  { label: 'Monitoring', href: '/monitoring', icon: ClipboardList },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Funding', href: '/funding', icon: DollarSign },
  { label: 'Carbon Passport', href: '/passport', icon: Award },
  { label: 'Activity', href: '/timeline', icon: Activity },
];

export default function ProjectWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id as string;
  const pathname = usePathname();
  const { project, loading } = useProject(projectId);
  const { profile } = useAuth();
  const role = profile?.role;
  const TABS = role === 'verifier' ? VERIFIER_TABS : role === 'sustainability_partner' ? PARTNER_TABS : OWNER_TABS;

  const basePath = `/dashboard/projects/${projectId}`;
  const activeTab = TABS.find((t) =>
    t.href === '' ? pathname === basePath : pathname.startsWith(basePath + t.href)
  );

  return (
    <div className="space-y-0">
      <div className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/projects" className="hover:text-foreground">
              <ArrowLeft className="mr-1 inline h-3.5 w-3.5" />
              Projects
            </Link>
          </div>

          {loading ? (
            <div className="mt-4 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading project...</span>
            </div>
          ) : project ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-ocean-soft text-primary">
                  <span className="font-display text-lg font-bold">
                    {PROJECT_TYPE_LABELS[project.project_type]?.[0] || 'P'}
                  </span>
                </div>
                <div>
                  <h1 className="font-display text-xl font-semibold tracking-tight">{project.name}</h1>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge variant="secondary">{PROJECT_TYPE_LABELS[project.project_type]}</Badge>
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusColor(project.status))}>
                      {PROJECT_STATUS_LABELS[project.status]}
                    </span>
                    {project.location_name && <span className="text-xs text-muted-foreground">{project.location_name}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {project.area_hectares && (
                  <div className="rounded-lg border border-border px-3 py-1.5 text-center">
                    <p className="text-xs text-muted-foreground">Area</p>
                    <p className="text-sm font-semibold">{project.area_hectares.toFixed(1)} ha</p>
                  </div>
                )}
                {project.health_score !== null && project.health_score > 0 && (
                  <div className="rounded-lg border border-border px-3 py-1.5 text-center">
                    <p className="text-xs text-muted-foreground">Health</p>
                    <p className="text-sm font-semibold">{project.health_score}/100</p>
                  </div>
                )}
                {role === 'sustainability_partner' && (
                  <Badge variant="outline" className="gap-1">
                    <Eye className="h-3 w-3" />
                    Read Only
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4"><h1 className="font-display text-xl font-semibold">Project not found</h1></div>
          )}

          {!loading && project && (
            <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const href = basePath + tab.href;
                const isActive = activeTab?.label === tab.label;
                return (
                  <Link
                    key={tab.label}
                    href={href}
                    className={cn(
                      'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {children}
      </div>
    </div>
  );
}
