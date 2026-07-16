'use client';

import * as React from 'react';
import { Sidebar } from '@/components/shared/sidebar';
import { Topbar } from '@/components/shared/topbar';
import { SidebarProvider } from '@/components/providers/sidebar-provider';

function DashboardShellInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Dashboard Sidebar — flex item, shrink-0, smooth width transition */}
      <Sidebar />

      {/* Right column — flex-1 min-w-0, contains Topbar + scrollable content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </SidebarProvider>
  );
}
