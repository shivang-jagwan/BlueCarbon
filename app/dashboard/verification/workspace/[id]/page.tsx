'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, FileText, Shield, Eye, Map, Camera, CheckCircle2, RotateCcw,
  XCircle, Calendar, Lock, Sparkles, MapPin, ClipboardCheck, AlertTriangle,
  AlertCircle, Check, Clock, Send, Gavel, MessageSquare, Award, Building2,
  Image, Video, FileQuestion, Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApplication, scheduleAudit, submitDecision, startReview } from '@/lib/voc-services';
import { useAuth } from '@/components/providers/auth-provider';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  DECISION_LABELS,
  DECISION_COLORS,
  DOCUMENT_CATEGORY_LABELS,
  type VerificationApplication,
  type VerificationDecision,
  type FieldAuditRequired,
  type AuditFormData,
} from '@/lib/voc-types';

export default function VerificationWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;

  const [application, setApplication] = React.useState<VerificationApplication | null>(null);
  const [decision, setDecision] = React.useState<VerificationDecision | ''>('');
  const [auditRequired, setAuditRequired] = React.useState<FieldAuditRequired>('no');
  const [auditDate, setAuditDate] = React.useState('');
  const [auditNotes, setAuditNotes] = React.useState('');
  const [reviewerNotes, setReviewerNotes] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const { profile } = useAuth();

  React.useEffect(() => {
    const app = getApplication(appId);
    if (app) {
      setApplication(app);
      setAuditRequired(app.field_audit_required || 'no');
      setAuditDate(app.audit_date || '');
      setAuditNotes(app.audit_notes || '');
      setReviewerNotes(app.decision_notes || '');
    }
  }, [appId]);

  if (!application) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Application not found.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push('/dashboard/verification')}>
            Back to Verification
          </Button>
        </div>
      </div>
    );
  }

  const { snapshot } = application;
  const isImmutable = application.status !== 'draft' && application.status !== 'submitted';
  const isDecided = ['approved', 'returned_for_revision', 'rejected'].includes(application.status);
  const canDecide = ['under_review', 'audit_completed'].includes(application.status);

  const allDocs = snapshot.documents;
  const aiConfidence = allDocs.length > 0
    ? Math.round(allDocs.reduce((sum, d) => sum + d.ai_summary.confidence_score, 0) / allDocs.length)
    : 0;

  const allMissing = Array.from(new Set(allDocs.flatMap(d => d.ai_summary.missing_documents)));
  const allQualityIssues = Array.from(new Set(allDocs.flatMap(d => d.ai_summary.quality_issues)));
  const hasDuplicates = allDocs.some(d => d.ai_summary.duplicate_detected);
  const gpsVerifiedCount = allDocs.filter(d => d.ai_summary.gps_metadata).length;

  const handleAuditSchedule = () => {
    scheduleAudit(application.id, auditRequired, auditRequired === 'yes' ? auditDate : null, auditNotes);
    const updated = getApplication(appId);
    if (updated) setApplication(updated);
  };

  const handleStartReview = () => {
    if (!profile) return;
    startReview(application.id, profile.id, profile.full_name || 'Verifier');
    const updated = getApplication(appId);
    if (updated) setApplication(updated);
  };

  const handleSubmitDecision = () => {
    if (!decision) return;
    setSubmitting(true);
    setTimeout(() => {
      submitDecision(application.id, decision, reviewerNotes);
      setSubmitted(true);
      setSubmitting(false);
      const updated = getApplication(appId);
      if (updated) setApplication(updated);
    }, 800);
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/verification')} className="mb-3 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Verification
        </Button>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono text-muted-foreground">{application.application_number}</span>
              <Badge className={cn('text-[10px]', APPLICATION_STATUS_COLORS[application.status])}>
                {APPLICATION_STATUS_LABELS[application.status]}
              </Badge>
              {isImmutable && (
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">
                  <Lock className="h-3 w-3 mr-1" /> Immutable
                </Badge>
              )}
            </div>
            <h1 className="text-lg font-semibold mt-1">{application.project_name}</h1>
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
              <p className="text-xs text-muted-foreground">Owner</p>
              <p className="font-medium">{application.project_owner_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">NGO</p>
              <p className="font-medium">{application.ngo_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Submitted</p>
              <p className="font-medium">{new Date(application.submitted_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge className={cn('text-[10px] mt-0.5', APPLICATION_STATUS_COLORS[application.status])}>
                {APPLICATION_STATUS_LABELS[application.status]}
              </Badge>
            </div>
          </div>
          {snapshot.description && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{snapshot.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Snapshot Documents — Frozen at Submission
          </CardTitle>
          <p className="text-xs text-muted-foreground">These documents are immutable. Changes to the project do not affect this application.</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allDocs.map((doc) => (
              <div key={doc.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{doc.file_type}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{doc.file_size}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{DOCUMENT_CATEGORY_LABELS[doc.category]}</span>
                    {doc.gps_available && <span className="flex items-center gap-1 text-emerald-600"><Map className="h-3 w-3" /> GPS</span>}
                    {doc.metadata_available && <span className="flex items-center gap-1 text-blue-600"><Camera className="h-3 w-3" /> Metadata</span>}
                  </div>
                  {doc.ai_summary.overall_assessment && (
                    <p className="text-xs text-muted-foreground mt-1.5 italic">{doc.ai_summary.overall_assessment}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <Progress value={doc.quality_score} className="h-1.5 w-16" />
                  <p className="text-[10px] text-muted-foreground mt-1">{doc.quality_score}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {(snapshot.ground_images.length > 0 || snapshot.drone_images.length > 0 || snapshot.supporting_files.length > 0 || snapshot.evidence_items.length > 0) && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" /> Ground Images & Evidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {snapshot.ground_images.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Image className="h-3.5 w-3.5" /> Ground Images ({snapshot.ground_images.length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {snapshot.ground_images.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/60 text-sm">
                        <Camera className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1">{doc.name}</span>
                        <span className="text-xs text-muted-foreground">{doc.file_size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {snapshot.drone_images.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Drone Images ({snapshot.drone_images.length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {snapshot.drone_images.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/60 text-sm">
                        <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1">{doc.name}</span>
                        <span className="text-xs text-muted-foreground">{doc.file_size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {snapshot.supporting_files.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <FileQuestion className="h-3.5 w-3.5" /> Supporting Files ({snapshot.supporting_files.length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {snapshot.supporting_files.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/60 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1">{doc.name}</span>
                        <span className="text-xs text-muted-foreground">{doc.file_size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {snapshot.evidence_items.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <ClipboardCheck className="h-3.5 w-3.5" /> Evidence Items ({snapshot.evidence_items.length})
                  </p>
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
                          <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {new Date(ev.date_collected).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" /> AI Document Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-border/60">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('h-2 w-2 rounded-full', aiConfidence >= 80 ? 'bg-emerald-500' : aiConfidence >= 60 ? 'bg-amber-500' : 'bg-red-500')} />
                  <p className="text-xs font-medium">Confidence Score</p>
                </div>
                <p className="text-2xl font-bold font-display">{aiConfidence}%</p>
                <Progress value={aiConfidence} className="h-1.5 mt-2" />
              </div>
              <div className="p-3 rounded-lg border border-border/60">
                <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                  <Map className="h-3.5 w-3.5 text-emerald-500" /> GPS Metadata Verification
                </p>
                {gpsVerifiedCount > 0 ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>GPS metadata verified in {gpsVerifiedCount} of {allDocs.length} document(s)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>No GPS metadata found in any documents</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {hasDuplicates && (
                <div className="flex items-center gap-2 text-xs text-red-600 p-2 rounded-lg bg-red-50">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Duplicate document detected in submission</span>
                </div>
              )}
              {allMissing.length > 0 && allMissing.map((m, i) => (
                <div key={`missing-${i}`} className="flex items-center gap-2 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span className="text-amber-700">Missing: {m}</span>
                </div>
              ))}
              {allQualityIssues.length > 0 && allQualityIssues.map((q, i) => (
                <div key={`quality-${i}`} className="flex items-center gap-2 text-xs">
                  <AlertCircle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span className="text-orange-700">{q}</span>
                </div>
              ))}
              {allMissing.length === 0 && allQualityIssues.length === 0 && !hasDuplicates && (
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>No issues detected. All documents pass quality checks.</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {application.status === 'submitted' && (
        <Card className="shadow-sm border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Play className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Ready to Review</h3>
                  <p className="text-xs text-muted-foreground">Start reviewing this verification application to proceed with the certification workflow.</p>
                </div>
              </div>
              <Button onClick={handleStartReview} className="gap-2">
                <Play className="h-4 w-4" /> Start Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canDecide && !isDecided && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Audit Decision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Is Field Audit Required?</Label>
                <RadioGroup value={auditRequired} onValueChange={(v) => setAuditRequired(v as FieldAuditRequired)} className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="yes" id="audit-yes" />
                    <Label htmlFor="audit-yes" className="text-sm font-normal cursor-pointer">Yes</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="audit-no" />
                    <Label htmlFor="audit-no" className="text-sm font-normal cursor-pointer">No</Label>
                  </div>
                </RadioGroup>
              </div>
              {auditRequired === 'yes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-0 md:pl-6 border-l-2 border-amber-200 ml-0 md:ml-2">
                  <div className="space-y-2">
                    <Label className="text-sm">Audit Date</Label>
                    <Input type="date" value={auditDate} onChange={(e) => setAuditDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Audit Notes</Label>
                    <Textarea value={auditNotes} onChange={(e) => setAuditNotes(e.target.value)} placeholder="Describe the scope of the field audit..." rows={2} />
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleAuditSchedule}>
                  <ClipboardCheck className="h-4 w-4 mr-1.5" /> Save Audit Schedule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {application.audit_report && (
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
                <p className="font-medium">{application.audit_report.area_verified.toLocaleString()} m²</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tree Count</p>
                <p className="font-medium">{application.audit_report.tree_count.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Species Count</p>
                <p className="font-medium">{application.audit_report.species_count}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Site Condition</p>
                <Badge variant="outline" className="text-xs mt-0.5 capitalize">{application.audit_report.site_condition}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">GPS Validated</p>
                <p className={cn('text-xs font-medium mt-0.5', application.audit_report.gps_validated ? 'text-emerald-600' : 'text-red-600')}>
                  {application.audit_report.gps_validated ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">GPS Coordinates</p>
                <p className="font-mono text-xs mt-0.5">{application.audit_report.gps_coordinates}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Photos</p>
                <p className="font-medium">{application.audit_report.photos_count}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Videos</p>
                <p className="font-medium">{application.audit_report.videos_count}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              {application.audit_report.remarks && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                  <p className="text-sm">{application.audit_report.remarks}</p>
                </div>
              )}
              {application.audit_report.final_observation && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Final Observation</p>
                  <p className="text-sm">{application.audit_report.final_observation}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {canDecide && !isDecided && (
        <>
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Gavel className="h-4 w-4 text-muted-foreground" /> Verification Decision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setDecision('approve')}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                      decision === 'approve'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-border/60 hover:border-emerald-200 hover:bg-emerald-50/50',
                    )}
                  >
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="text-sm font-semibold">Approve</span>
                    <span className="text-[10px] text-center opacity-70">Verification passed</span>
                  </button>
                  <button
                    onClick={() => setDecision('return_for_revision')}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                      decision === 'return_for_revision'
                        ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm'
                        : 'border-border/60 hover:border-amber-200 hover:bg-amber-50/50',
                    )}
                  >
                    <RotateCcw className="h-6 w-6" />
                    <span className="text-sm font-semibold">Return for Revision</span>
                    <span className="text-[10px] text-center opacity-70">Needs corrections</span>
                  </button>
                  <button
                    onClick={() => setDecision('reject')}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                      decision === 'reject'
                        ? 'border-red-400 bg-red-50 text-red-700 shadow-sm'
                        : 'border-border/60 hover:border-red-200 hover:bg-red-50/50',
                    )}
                  >
                    <XCircle className="h-6 w-6" />
                    <span className="text-sm font-semibold">Reject</span>
                    <span className="text-[10px] text-center opacity-70">Verification failed</span>
                  </button>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" /> Reviewer Notes
                  </Label>
                  <Textarea
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Provide comments, missing documents, observations, or recommendations..."
                    rows={5}
                    className="resize-none"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                    Once submitted, this decision is <strong>immutable</strong>.
                  </div>
                  <Button
                    onClick={handleSubmitDecision}
                    disabled={!decision || submitting}
                    className={cn(
                      'min-w-[160px]',
                      decision === 'approve' && 'bg-emerald-600 hover:bg-emerald-700',
                      decision === 'reject' && 'bg-red-600 hover:bg-red-700',
                      decision === 'return_for_revision' && 'bg-amber-600 hover:bg-amber-700',
                    )}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2"><Send className="h-4 w-4" /> Submit Decision</span>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {isDecided && (
        <Card className="shadow-sm border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Lock className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-emerald-800">Decision Recorded — Immutable</h3>
                <p className="text-xs text-emerald-600">This verification has been completed and locked.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-emerald-600">Decision</p>
                <Badge className={cn('text-xs mt-0.5', DECISION_COLORS[application.decision!])}>
                  {DECISION_LABELS[application.decision!]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-emerald-600">Digital Signature</p>
                <p className="font-mono text-xs mt-0.5">{application.digital_signature}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600">Blockchain Hash</p>
                <p className="font-mono text-xs mt-0.5">{application.blockchain_hash}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600">Decision Date</p>
                <p className="text-xs mt-0.5">{application.decision_date ? new Date(application.decision_date).toLocaleString() : '—'}</p>
              </div>
            </div>
            {application.decision === 'approve' && application.carbon_passport && application.verification_certificate && (
              <>
                <Separator className="my-5 border-emerald-200" />
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-emerald-200 bg-white/60">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-800">Carbon Passport</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-emerald-600">Passport Number</p>
                        <p className="font-mono font-medium">{application.carbon_passport.passport_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600">Carbon Credits</p>
                        <p className="font-medium">{application.carbon_passport.carbon_credits_tonnes} tCO₂e</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600">Methodology</p>
                        <p className="font-medium">{application.carbon_passport.methodology}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600">Valid From</p>
                        <p className="text-xs">{new Date(application.carbon_passport.valid_from).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600">Valid Until</p>
                        <p className="text-xs">{new Date(application.carbon_passport.valid_until).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600">Issued By</p>
                        <p className="text-xs">{application.carbon_passport.issued_by}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-emerald-200 bg-white/60">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-800">Verification Certificate</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-emerald-600">Certificate Number</p>
                        <p className="font-mono font-medium">{application.verification_certificate.certificate_number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600">Verifier</p>
                        <p className="font-medium">{application.verification_certificate.verifier}</p>
                      </div>
                      <div>
                        <p className="text-xs text-emerald-600">Issued Date</p>
                        <p className="text-xs">{new Date(application.verification_certificate.issued_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
