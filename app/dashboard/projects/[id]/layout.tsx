'use client';

import * as React from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
} from '@/lib/types';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader';
import { getWorkspaceNavForRole } from '@/lib/workspace-navigation';
import { getApplicationsForProject } from '@/lib/voc-services';
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/lib/voc-types';
import { Badge } from '@/components/ui/badge';
import { Lock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const sections = getWorkspaceNavForRole(role ?? null);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const activeApplication = React.useMemo(() => {
    if (role !== 'project_owner') return null;
    const apps = getApplicationsForProject(projectId);
    return apps.find(a => ['submitted', 'under_review', 'audit_scheduled', 'audit_completed'].includes(a.status));
  }, [projectId, role]);

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-full">
      {/* Workspace Sidebar — flex item, shrink-0, 260px */}
      <WorkspaceSidebar
        projectId={projectId}
        projectName={project?.name || 'Project'}
        projectType={project ? PROJECT_TYPE_LABELS[project.project_type] : undefined}
        projectStatus={project ? PROJECT_STATUS_LABELS[project.status] : undefined}
        sections={sections}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* 16px gap between workspace sidebar and content */}
      <div className="hidden w-4 shrink-0 lg:block" />

      {/* Content column — flex-1 min-w-0 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <WorkspaceHeader project={project} loading={loading} role={role} />

        {activeApplication && (
          <div className="mx-4 md:mx-6 lg:mx-8 mt-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <Lock className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-amber-800">Verification Application is under review</p>
                  <Badge className={cn('text-[10px]', APPLICATION_STATUS_COLORS[activeApplication.status])}>
                    {APPLICATION_STATUS_LABELS[activeApplication.status]}
                  </Badge>
                </div>
                <p className="text-xs text-amber-600 mt-0.5">
                  Project records are locked until the certification process is completed. Application: {activeApplication.application_number}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
