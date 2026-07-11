'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Clock, Mail, ArrowLeft, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';

function PendingApprovalContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div className="w-full max-w-md">
      <Card className="overflow-hidden p-0 shadow-soft">
        <div className="gradient-ocean px-8 py-10 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <Clock className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-semibold">
            Account Pending Approval
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Your registration was received successfully
          </p>
        </div>

        <div className="space-y-5 p-8">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Registered email</p>
                <p className="text-sm font-medium">
                  {email || user?.email || '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Our verification team reviews new accounts to ensure platform
              integrity. This process typically takes{' '}
              <span className="font-medium text-foreground">1-2 business days</span>.
            </p>
            <p>
              You will receive an email notification once your account is
              approved and ready to use.
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Check approval status
            </Button>
            {user && (
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            )}
          </div>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <React.Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <PendingApprovalContent />
    </React.Suspense>
  );
}
