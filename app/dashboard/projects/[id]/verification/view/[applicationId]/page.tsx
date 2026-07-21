'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ViewVerificationApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.applicationId as string;

  useEffect(() => {
    router.replace(`/dashboard/verification/${applicationId}`);
  }, [applicationId, router]);

  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="h-6 w-6 mx-auto mb-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Redirecting to verification report...</p>
      </div>
    </div>
  );
}
