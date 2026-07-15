'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, Globe, Car, CreditCard, Building2, Award,
  CheckCircle, XCircle, AlertTriangle, Clock, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IdentityDocument, IdentityDocumentType } from '@/lib/types';
import {
  IDENTITY_DOC_TYPE_LABELS,
} from '@/lib/types';

const DOC_ICONS: Partial<Record<IdentityDocumentType, React.ElementType>> = {
  government_id: FileText,
  passport: Globe,
  driving_license: Car,
  aadhaar: CreditCard,
  pan_card: CreditCard,
  organization_certificate: Building2,
  registration_document: FileText,
  business_license: Building2,
  incorporation_certificate: Building2,
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  verified: CheckCircle,
  rejected: XCircle,
  additional_required: AlertTriangle,
  submitted: Clock,
  under_review: Clock,
  pending: Clock,
  expired: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  verified: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  additional_required: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  under_review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  pending: 'bg-muted text-muted-foreground',
  expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
};

interface IdentityDocumentCardProps {
  document: IdentityDocument;
  onVerify?: (id: string, decision: string) => void;
  onRequestAdditional?: (id: string) => void;
  showActions?: boolean;
}

export function IdentityDocumentCard({
  document,
  onVerify,
  onRequestAdditional,
  showActions = false,
}: IdentityDocumentCardProps) {
  const Icon = DOC_ICONS[document.document_type] || FileText;
  const StatusIcon = STATUS_ICONS[document.verification_status] || Clock;
  const canAct = showActions && document.verification_status === 'submitted';

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{document.file_name || 'Untitled Document'}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {IDENTITY_DOC_TYPE_LABELS[document.document_type]}
                </Badge>
                {document.document_number && (
                  <span className="text-xs text-muted-foreground">#{document.document_number}</span>
                )}
              </div>
              {document.issuing_authority && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Issued by: {document.issuing_authority}
                </p>
              )}
              {document.issue_date && (
                <p className="text-xs text-muted-foreground">
                  Issued: {new Date(document.issue_date).toLocaleDateString()}
                  {document.expiry_date && ` · Expires: ${new Date(document.expiry_date).toLocaleDateString()}`}
                </p>
              )}
            </div>
          </div>
          <Badge className={cn('text-xs shrink-0', STATUS_COLORS[document.verification_status])}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {document.verification_status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {document.rejection_reason && (
          <div className="mt-3 rounded-lg bg-destructive/5 p-2">
            <p className="text-xs text-destructive">{document.rejection_reason}</p>
          </div>
        )}

        {document.additional_documents_requested && (
          <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 p-2">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Additional required: {document.additional_documents_requested}
            </p>
          </div>
        )}

        {canAct && onVerify && (
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <Button
              variant="ghost" size="sm"
              className="text-success hover:text-success"
              onClick={() => onVerify(document.id, 'verified')}
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Verify
            </Button>
            <Button
              variant="ghost" size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onVerify(document.id, 'rejected')}
            >
              <XCircle className="h-4 w-4 mr-1" /> Reject
            </Button>
            {onRequestAdditional && (
              <Button
                variant="ghost" size="sm"
                onClick={() => onRequestAdditional(document.id)}
              >
                <AlertTriangle className="h-4 w-4 mr-1" /> Request More
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
