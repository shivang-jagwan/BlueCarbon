'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, FileText, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  type VerificationApplication,
} from '@/lib/voc-types';

interface Props {
  application: VerificationApplication;
  auditReport: { area_verified: number; tree_count: number; species_count: number } | null;
  daysSinceSubmission: number;
  onStartReview: () => void;
}

export function OverviewTab({ application, auditReport, daysSinceSubmission, onStartReview }: Props) {
  const snapshot = application.snapshot;
  const isSubmitted = application.status === 'submitted';
  const allDocs = snapshot?.documents || [];
  const evidenceItems = snapshot?.evidence_items || [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Application Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Application ID</p>
              <p className="font-mono font-medium">{application.application_number}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Project Name</p>
              <p className="font-medium">{application.project_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Project Owner</p>
              <p className="font-medium">{application.project_owner_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Verification Agency</p>
              <p className="font-medium">{application.verification_agency_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge className={cn('text-[10px] mt-0.5', APPLICATION_STATUS_COLORS[application.status])}>
                {APPLICATION_STATUS_LABELS[application.status]}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submission Date</p>
              <p className="font-medium text-sm">{new Date(application.submitted_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Audit Status</p>
              <p className="font-medium text-sm">{application.audit_date ? `Scheduled ${new Date(application.audit_date).toLocaleDateString()}` : 'Not scheduled'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Carbon Passport</p>
              <Badge className="text-[10px] mt-0.5 bg-slate-100 text-slate-600">
                {application.carbon_passport ? 'Issued' : application.status === 'approved' ? 'Eligible' : 'Not yet'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Verifier</p>
              <p className="font-medium text-sm">{application.verifier_name || '—'}</p>
            </div>
          </div>
          {snapshot?.description && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{snapshot.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Days Since Submission</span>
              <span className="font-semibold">{daysSinceSubmission}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Documents</span>
              <span className="font-semibold">{allDocs.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Evidence Items</span>
              <span className="font-semibold">{evidenceItems.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Audit Report</span>
              <span className="font-semibold">{auditReport ? 'Submitted' : 'Pending'}</span>
            </div>
            {auditReport && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Area Verified</span>
                <span className="font-semibold">{auditReport.area_verified.toLocaleString()} m²</span>
              </div>
            )}
          </CardContent>
        </Card>

        {isSubmitted && (
          <Card className="shadow-sm border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <Button onClick={onStartReview} className="w-full gap-2">
                <Play className="h-4 w-4" /> Start Review
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
