'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronRight, Menu, X, ArrowLeft } from 'lucide-react';

export interface WorkspaceNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  disabled?: boolean;
}

export interface WorkspaceNavSection {
  title: string;
  items: WorkspaceNavItem[];
}

interface WorkspaceSidebarProps {
  projectId: string;
  projectName: string;
  projectType?: string;
  projectStatus?: string;
  sections: WorkspaceNavSection[];
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

function getStatusClasses(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'verified':
    case 'approved':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
    case 'pending':
    case 'submitted':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'registered':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
}

function SidebarItem({
  item,
  basePath,
  pathname,
}: {
  item: WorkspaceNavItem;
  basePath: string;
  pathname: string;
}) {
  const href = basePath + item.href;
  const isActive =
    item.href === ''
      ? pathname === basePath
      : pathname.startsWith(basePath + item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.disabled ? '#' : href}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200',
        isActive &&
          'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-600 dark:border-emerald-400 -ml-px',
        !isActive &&
          !item.disabled &&
          'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100',
        item.disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          isActive
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
        )}
      />
      <span className={cn('flex-1 truncate', isActive ? 'font-semibold' : 'font-medium')}>
        {item.label}
      </span>
      {item.badge && (
        <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
          {item.badge}
        </span>
      )}
      {isActive && <ChevronRight className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />}
    </Link>
  );
}

function SidebarContent({
  projectName,
  projectType,
  projectStatus,
  sections,
  basePath,
  pathname,
}: {
  projectName: string;
  projectType?: string;
  projectStatus?: string;
  sections: WorkspaceNavSection[];
  basePath: string;
  pathname: string;
}) {
  return (
    <>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-800">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Projects
        </Link>
      </div>

      <div className="mx-3 mt-3 rounded-lg bg-slate-50 dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
          {projectName}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          {projectType && (
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5">
              {projectType}
            </span>
          )}
          {projectStatus && (
            <span
              className={cn(
                'text-[10px] font-medium rounded px-1.5 py-0.5',
                getStatusClasses(projectStatus)
              )}
            >
              {projectStatus}
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarItem key={item.href} item={item} basePath={basePath} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </>
  );
}

export function WorkspaceSidebar({
  projectId,
  projectName,
  projectType,
  projectStatus,
  sections,
  sidebarOpen,
  onToggleSidebar,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/projects/${projectId}`;

  return (
    <>
      {/* Desktop: Pure flex item, no fixed positioning */}
      <aside className="hidden w-[260px] shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 lg:flex">
        <SidebarContent
          projectName={projectName}
          projectType={projectType}
          projectStatus={projectStatus}
          sections={sections}
          basePath={basePath}
          pathname={pathname}
        />
      </aside>

      {/* Mobile header bar */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 lg:hidden">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          ) : (
            <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {projectName}
          </p>
        </div>
        <Link
          href="/dashboard/projects"
          className="text-xs text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onToggleSidebar}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white shadow-xl dark:bg-slate-950">
            <SidebarContent
              projectName={projectName}
              projectType={projectType}
              projectStatus={projectStatus}
              sections={sections}
              basePath={basePath}
              pathname={pathname}
            />
          </div>
        </div>
      )}
    </>
  );
}
