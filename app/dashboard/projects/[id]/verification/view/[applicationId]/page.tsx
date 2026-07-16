'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getApplication } from '@/lib/voc-services';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  DECISION_LABELS,
  DECISION_COLORS,
  DOCUMENT_CATEGORY_LABELS,
  type VerificationApplication,
} from '@/lib/voc-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, FileText, Shield, Map, Camera, Eye, CheckCircle2,
  Clock, Lock, AlertTriangle, Award, Building2, Image, FolderOpen,
  MapPin, Download, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-medium', mono && 'font-mono')}>{value ?? '—'}</p>
    </div>
  );
}

export default function ViewVerificationApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const applicationId = params.applicationId as string;

  const [application, setApplication] = React.useState<VerificationApplication | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const app = getApplication(applicationId);
    setApplication(app ?? null);
    setLoading(false);
  }, [applicationId]);

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded bg-muted animate-pulse" />
          <div className="h-4 w-96 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-48 rounded-xl border border-border/60 bg-white dark:bg-slate-900 animate-pulse" />
        <div className="h-48 rounded-xl border border-border/60 bg-white dark:bg-slate-900 animate-pulse" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">Application not found</p>
          <p className="text-xs text-muted-foreground mt-1">This verification application could not be located.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push(`/dashboard/projects/${projectId}/verification`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Verification
          </Button>
        </div>
      </div>
    );
  }

  const { snapshot } = application;
  const isDecided = ['approved', 'returned_for_revision', 'rejected'].includes(application.status);
  const allDocs = snapshot.documents;

  return (
    <div className="space-y-6 pb-20">

      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 -ml-2 shrink-0"
          onClick={() => router.push(`/dashboard/projects/${projectId}/verification`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Verification Application</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono text-muted-foreground">{application.application_number}</span>
                <Badge className={cn('text-[10px] font-semibold', APPLICATION_STATUS_COLORS[application.status])}>
                  {APPLICATION_STATUS_LABELS[application.status]}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Application Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoRow label="Application ID" value={application.application_number} mono />
            <InfoRow label="Project Name" value={application.project_name} />
            <InfoRow label="Owner" value={application.project_owner_name} />
            <InfoRow label="NGO" value={application.ngo_name} />
            <InfoRow label="Submitted" value={formatDate(application.submitted_date)} />
            <InfoRow
              label="Current Status"
              value={
                <Badge className={cn('text-[10px] font-semibold', APPLICATION_STATUS_COLORS[application.status])}>
                  {APPLICATION_STATUS_LABELS[application.status]}
                </Badge>
              }
            />
            {application.verifier_name && (
              <InfoRow label="Verifier" value={application.verifier_name} />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" /> Project Snapshot
          </CardTitle>
          <p className="text-xs text-muted-foreground">Read-only data frozen at submission time</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Project Name" value={snapshot.project_name} />
            <InfoRow label="Project Type" value={snapshot.project_type} />
            <InfoRow label="Location" value={snapshot.location} />
            <InfoRow label="Area" value={`${snapshot.area_hectares.toLocaleString()} ha`} />
            <InfoRow label="Latitude" value={snapshot.latitude} mono />
            <InfoRow label="Longitude" value={snapshot.longitude} mono />
            <InfoRow label="Methodology" value={snapshot.methodology} />
            <InfoRow label="Estimated Carbon Sequestration" value={`${snapshot.estimated_carbon_sequestration.toLocaleString()} tCO₂e`} />
            <InfoRow label="Start Date" value={formatDate(snapshot.start_date)} />
            <InfoRow label="Target End Date" value={formatDate(snapshot.target_end_date)} />
            <InfoRow label="Owner" value={snapshot.owner_name} />
            <InfoRow label="Organization" value={snapshot.owner_organization} />
          </div>
          {snapshot.description && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{snapshot.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {allDocs.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" /> Attached Documents
              <Badge variant="outline" className="text-[10px] ml-1 font-normal">{allDocs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{doc.file_type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>{doc.file_size}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{DOCUMENT_CATEGORY_LABELS[doc.category]}</span>
                      {doc.gps_available && (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <Map className="h-3 w-3" /> GPS
                        </span>
                      )}
                      {doc.metadata_available && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <Camera className="h-3 w-3" /> Metadata
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        doc.quality_score >= 80 ? 'bg-emerald-500' : doc.quality_score >= 60 ? 'bg-amber-500' : 'bg-red-500',
                      )} />
                      <span className="text-xs font-medium">{doc.quality_score}%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Quality</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(snapshot.ground_images.length > 0 || snapshot.drone_images.length > 0 || snapshot.supporting_files.length > 0 || snapshot.evidence_items.length > 0) && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" /> Evidence Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border/60">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <Image className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{snapshot.ground_images.length}</p>
                  <p className="text-[10px] text-muted-foreground">Ground Images</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border/60">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <Eye className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{snapshot.drone_images.length}</p>
                  <p className="text-[10px] text-muted-foreground">Drone Images</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border/60">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30">
                  <FolderOpen className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{snapshot.supporting_files.length}</p>
                  <p className="text-[10px] text-muted-foreground">Supporting Files</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border/60">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{snapshot.evidence_items.length}</p>
                  <p className="text-[10px] text-muted-foreground">Evidence Items</p>
                </div>
              </div>
            </div>
            {snapshot.evidence_items.length > 0 && (
              <div className="space-y-2">
                {snapshot.evidence_items.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-lg border border-border/60">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{ev.title}</p>
                      <Badge variant="outline" className="text-[10px]">{ev.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{ev.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {ev.location}</span>
                      <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {formatDate(ev.date_collected)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Declaration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Declaration Confirmed</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                The project owner and NGO have confirmed that all submitted information is accurate and complete.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" /> Application Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                  <Send className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="w-px flex-1 bg-border/60 my-1" />
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium">Application Submitted</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(application.submitted_date)}</p>
              </div>
            </div>
            {isDecided && application.decision_date && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    application.decision === 'approve' && 'bg-emerald-100 dark:bg-emerald-900/50',
                    application.decision === 'return_for_revision' && 'bg-amber-100 dark:bg-amber-900/50',
                    application.decision === 'reject' && 'bg-red-100 dark:bg-red-900/50',
                  )}>
                    {application.decision === 'approve' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                    {application.decision === 'return_for_revision' && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                    {application.decision === 'reject' && <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}
                  </div>
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Decision Rendered</p>
                    <Badge className={cn('text-[10px] font-semibold', DECISION_COLORS[application.decision!])}>
                      {DECISION_LABELS[application.decision!]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(application.decision_date)}</p>
                  {application.decision_verifier_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">By: {application.decision_verifier_name}</p>
                  )}
                </div>
              </div>
            )}
            {isDecided && !application.decision_date && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Decision Pending</p>
                </div>
              </div>
            )}
          </div>
          {isDecided && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {application.decision_notes && (
                  <div className="col-span-2 md:col-span-3">
                    <p className="text-xs text-muted-foreground mb-1">Decision Notes</p>
                    <p className="text-sm">{application.decision_notes}</p>
                  </div>
                )}
                {application.digital_signature && (
                  <InfoRow label="Digital Signature" value={application.digital_signature} mono />
                )}
                {application.blockchain_hash && (
                  <InfoRow label="Blockchain Hash" value={application.blockchain_hash} mono />
                )}
                {application.decision_verifier_name && (
                  <InfoRow label="Verifier" value={application.decision_verifier_name} />
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isDecided && application.decision === 'approve' && application.carbon_passport && application.verification_certificate && (
        <Card className="shadow-sm border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <Award className="h-4 w-4 text-emerald-600" /> Decision Details — Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Carbon Passport</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <InfoRow label="Passport Number" value={application.carbon_passport.passport_number} mono />
                <InfoRow label="Carbon Credits" value={`${application.carbon_passport.carbon_credits_tonnes.toLocaleString()} tCO₂e`} />
                <InfoRow label="Methodology" value={application.carbon_passport.methodology} />
                <InfoRow label="Valid From" value={formatDate(application.carbon_passport.valid_from)} />
                <InfoRow label="Valid Until" value={formatDate(application.carbon_passport.valid_until)} />
                <InfoRow label="Issued By" value={application.carbon_passport.issued_by} />
                <InfoRow label="Digital Signature" value={application.carbon_passport.digital_signature} mono />
                <InfoRow label="Blockchain Hash" value={application.carbon_passport.blockchain_hash} mono />
              </div>
            </div>
            <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Verification Certificate</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <InfoRow label="Certificate Number" value={application.verification_certificate.certificate_number} mono />
                <InfoRow label="Verifier" value={application.verification_certificate.verifier} />
                <InfoRow label="Issued Date" value={formatDate(application.verification_certificate.issued_date)} />
                <InfoRow label="Digital Signature" value={application.verification_certificate.digital_signature} mono />
                <InfoRow label="Blockchain Hash" value={application.verification_certificate.blockchain_hash} mono />
              </div>
              {application.verification_certificate.verified_documents.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-emerald-600 mb-1.5">Verified Documents</p>
                  <div className="flex flex-wrap gap-1.5">
                    {application.verification_certificate.verified_documents.map((name, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isDecided && application.decision === 'return_for_revision' && (
        <Card className="shadow-sm border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Decision Details — Returned for Revision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-800">
              <p className="text-xs font-medium text-amber-600 mb-2">Revision Notes</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {application.decision_notes || 'No revision notes provided.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isDecided && application.decision === 'reject' && (
        <Card className="shadow-sm border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" /> Decision Details — Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg border border-red-200 bg-red-50/30 dark:bg-red-950/20 dark:border-red-800">
              <p className="text-xs font-medium text-red-600 mb-2">Rejection Reason</p>
              <p className="text-sm text-red-800 dark:text-red-200">
                {application.decision_notes || 'No rejection reason provided.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <Lock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Immutable Application</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This verification application is immutable. Documents cannot be modified.
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
