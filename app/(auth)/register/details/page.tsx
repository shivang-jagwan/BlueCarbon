'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import RegisterForm from '../register-form';
import VerifierRegisterForm from '../verifier-form';
import PartnerRegisterForm from '../partner-form';

function RegisterDetailsContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  if (role === 'verifier') {
    return <VerifierRegisterForm />;
  }

  if (role === 'sustainability_partner' || role === 'partner') {
    return <PartnerRegisterForm />;
  }

  return <RegisterForm />;
}

export default function RegisterDetailsPage() {
  return (
    <React.Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <RegisterDetailsContent />
    </React.Suspense>
  );
}
