'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle, XCircle, Mail, Phone, FileText, Building2,
  AlertTriangle, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IdentityVerification } from '@/lib/types';
import { IDENTITY_STATUS_LABELS, IDENTITY_STATUS_COLORS } from '@/lib/types';

interface IdentityStatusCardProps {
  verification: IdentityVerification;
}

interface CheckItem {
  label: string;
  checked: boolean;
}

export function IdentityStatusCard({ verification }: IdentityStatusCardProps) {
  const items: CheckItem[] = [
    { label: 'Email Verified', checked: verification.email_verified },
    { label: 'Phone Verified', checked: verification.phone_verified },
    { label: 'Identity Documents Submitted', checked: verification.identity_documents_submitted },
    { label: 'Identity Verified', checked: verification.identity_verified },
  ];

  if (verification.role === 'verifier' || verification.role === 'sustainability_partner') {
    items.push({ label: 'Organization Verified', checked: verification.organization_verified });
  }

  const checkedCount = items.filter(i => i.checked).length;
  const progress = Math.round((checkedCount / items.length) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Verification Status</CardTitle>
          <Badge className={cn('text-xs', IDENTITY_STATUS_COLORS[verification.status])}>
            {IDENTITY_STATUS_LABELS[verification.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{checkedCount}/{items.length} completed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.checked ? (
                <CheckCircle className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
              <span className={cn('text-sm', item.checked ? 'text-foreground' : 'text-muted-foreground')}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {verification.suspicious_activity_detected && (
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Suspicious Activity Detected
            </div>
            {verification.suspicious_activity_reasons && (
              <p className="mt-1 text-xs text-muted-foreground">
                {JSON.stringify(verification.suspicious_activity_reasons)}
              </p>
            )}
          </div>
        )}

        {verification.fraud_flags && Object.keys(verification.fraud_flags).length > 0 && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
              <Shield className="h-4 w-4" />
              Fraud Flags
            </div>
            <div className="mt-1 space-y-0.5">
              {Object.entries(verification.fraud_flags).map(([key, value]) => (
                <p key={key} className="text-xs text-muted-foreground">
                  <span className="font-medium">{key}:</span> {String(value)}
                </p>
              ))}
            </div>
          </div>
        )}

        {verification.admin_notes && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes</p>
            <p className="text-xs">{verification.admin_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
