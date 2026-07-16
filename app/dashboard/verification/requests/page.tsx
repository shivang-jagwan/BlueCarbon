'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function VerificationRequestsPage() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace('/dashboard/verification/applications');
  }, [router]);
  return null;
}
