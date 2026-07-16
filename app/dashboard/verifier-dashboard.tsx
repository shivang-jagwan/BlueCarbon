'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function VerifierDashboardRedirect() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace('/dashboard/verification');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Opening Verification Operations Center...</p>
      </div>
    </div>
  );
}
