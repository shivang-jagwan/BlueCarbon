import * as React from 'react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/shared/sidebar';
import { Topbar } from '@/components/shared/topbar';
import { Logo } from '@/components/shared/logo';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, approval_status')
    .eq('id', user.id)
    .single();

  const autoApproved = profile?.role === 'project_owner' || profile?.role === 'sustainability_partner';
  const isApproved = profile?.approval_status === 'approved';

  if (!isApproved && !autoApproved) {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-4">
        <div className="flex max-w-md flex-col items-center gap-6 text-center">
          <Logo showText={false} iconClassName="h-14 w-14" />
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold">Account Pending Approval</h1>
            <p className="text-sm text-muted-foreground">
              Your account is awaiting verification by our team. You will be notified once approved.
            </p>
          </div>
          <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
            <p className="font-medium text-warning">Status: {profile?.approval_status ?? 'pending'}</p>
            <p className="mt-1 text-xs text-muted-foreground">Email: {user.email}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border md:block">
        <Sidebar />
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
