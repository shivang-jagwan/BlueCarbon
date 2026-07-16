'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import OwnerDashboard from './owner-dashboard';
import PartnerDashboard from './partner-dashboard';

export default function DashboardPage() {
  const { profile } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (profile?.role === 'verifier') {
      router.replace('/dashboard/verification');
    }
  }, [profile?.role, router]);

  if (profile?.role === 'project_owner') {
    return <OwnerDashboard />;
  }

  if (profile?.role === 'verifier') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Redirecting to Verification Operations Center...</p>
        </div>
      </div>
    );
  }

  if (profile?.role === 'sustainability_partner') {
    return <PartnerDashboard />;
  }

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-2xl font-semibold">Welcome to CarbonRush AI</h1>
      <p className="mt-2 text-muted-foreground">
        Please select a valid role or wait for account approval.
      </p>
    </div>
  );
}
