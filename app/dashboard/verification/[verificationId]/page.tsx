'use client';

import { useParams } from 'next/navigation';
import VerificationReportView from '@/components/verification/report/verification-report-view';

export default function StandaloneVerificationReportPage() {
  const params = useParams();
  const verificationId = params.verificationId as string;

  return (
    <VerificationReportView
      verificationId={verificationId}
      backHref="/dashboard/projects"
      backLabel="Back to Projects"
    />
  );
}
