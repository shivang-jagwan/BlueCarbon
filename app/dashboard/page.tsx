'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import OwnerDashboard from './owner-dashboard';
import VerifierDashboard from './verifier-dashboard';
import PartnerDashboard from './partner-dashboard';

export default function DashboardPage() {
  const { profile } = useAuth();

  if (profile?.role === 'project_owner') {
    return <OwnerDashboard />;
  }

  if (profile?.role === 'verifier') {
    return <VerifierDashboard />;
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
