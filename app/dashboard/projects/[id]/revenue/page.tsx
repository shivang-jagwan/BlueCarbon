'use client';

import { useParams, useRouter } from 'next/navigation';
import React from 'react';

export default function RevenueRedirect() {
  const params = useParams();
  const router = useRouter();
  React.useEffect(() => {
    router.replace(`/dashboard/projects/${params.id}/funding`);
  }, [params.id, router]);
  return null;
}
