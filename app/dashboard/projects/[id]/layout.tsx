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

        <div className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
