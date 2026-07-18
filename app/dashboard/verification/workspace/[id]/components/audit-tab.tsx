'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar, Play, ClipboardCheck, MapPin, TreePine, Camera, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FieldAuditForm } from '@/components/verification/FieldAuditForm';
import type { VerificationApplication, AuditReport } from '@/lib/voc-types';

interface Props {
  application: VerificationApplication;
  auditReport: AuditReport | null;
  profile: { full_name?: string | null } | null;
  auditDate: string;
  setAuditDate: (v: string) => void;
  showAuditForm: boolean;
  setShowAuditForm: (v: boolean) => void;
  onScheduleAudit: () => void;
  onComplete: () => void;
}

export function AuditTab({
  application, auditReport, profile, auditDate, setAuditDate,
  showAuditForm, setShowAuditForm, onScheduleAudit, onComplete,
}: Props) {
  const isReviewing = application.status === 'under_review';
  const isAuditScheduled = application.status === 'audit_scheduled';
  const isAuditCompleted = application.status === 'audit_completed';

  // If audit report exists, show read-only report
  if (auditReport) {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <ClipboardCheck className="h-4 w-4" />
              <span className="text-sm font-semibold">Audit Completed</span>
              <Badge variant="outline" className="text-[10px] ml-auto bg-emerald-100 text-emerald-700 border-emerald-200">
                {new Date(auditReport.audit_date).toLocaleDateString()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" /> Audit Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Area Verified</p>
                <p className="font-medium">{auditReport.area_verified.toLocaleString()} m²</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tree Count</p>
                <p className="font-medium">{auditReport.tree_count.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Species Count</p>
                <p className="font-medium">{auditReport.species_count}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Site Condition</p>
                <Badge variant="outline" className="text-xs mt-0.5 capitalize">{auditReport.site_condition}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">GPS Validated</p>
                <p className={cn('text-xs font-medium mt-0.5', auditReport.gps_validated ? 'text-emerald-600' : 'text-red-600')}>
                  {auditReport.gps_validated ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">GPS Coordinates</p>
                <p className="font-mono text-xs mt-0.5">{auditReport.gps_coordinates}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Photos</p>
                <p className="font-medium">{auditReport.photos_count}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Videos</p>
                <p className="font-medium">{auditReport.videos_count}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              {auditReport.remarks && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                  <p className="text-sm">{auditReport.remarks}</p>
                </div>
              )}
              {auditReport.final_observation && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Final Observation</p>
                  <p className="text-sm">{auditReport.final_observation}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If audit is scheduled and form is open, show the form
  if (showAuditForm && profile) {
    return (
      <FieldAuditForm
        requestId={application.application_number}
        agencyRequestId={application.id}
        agencyId={application.verification_agency_id}
        projectId={application.project_id}
        projectName={application.project_name}
        auditorName={profile.full_name || 'Auditor'}
        auditDate={application.audit_date || new Date().toISOString().split('T')[0]}
        onComplete={() => {
          setShowAuditForm(false);
          onComplete();
        }}
      />
    );
  }

  // If audit is scheduled but form not open, show schedule confirmation + begin button
  if (isAuditScheduled) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" /> Audit Scheduled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">
                  Audit scheduled for {application.audit_date ? new Date(application.audit_date).toLocaleDateString() : '—'}
                </p>
                <p className="text-xs text-purple-600 mt-0.5">
                  The Project Owner has been notified. You can begin the audit when ready.
                </p>
              </div>
              <Button size="sm" onClick={() => setShowAuditForm(true)} className="gap-1.5">
                <Play className="h-3.5 w-3.5" /> Begin Audit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If reviewing, show schedule form (schedule-first workflow)
  if (isReviewing) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" /> Schedule Field Audit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Schedule a field audit date for this project. The audit form will be unlocked after scheduling.
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1 max-w-xs space-y-1.5">
                <Label className="text-sm">Audit Date</Label>
                <Input
                  type="date"
                  value={auditDate}
                  onChange={(e) => setAuditDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <Button onClick={onScheduleAudit} className="gap-2">
                <Calendar className="h-4 w-4" /> Schedule Audit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Audit completed but report missing
  if (isAuditCompleted) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ClipboardCheck className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Audit completed but report not found.</p>
      </div>
    );
  }

  // Default: audit not yet available
  return (
    <div className="text-center py-16 text-muted-foreground">
      <ClipboardCheck className="h-8 w-8 mx-auto mb-3 opacity-50" />
      <p className="text-sm">Field audit can be scheduled once the review is started.</p>
    </div>
  );
}
