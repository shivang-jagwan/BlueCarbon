'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Gavel, CheckCircle2, RotateCcw, XCircle, Lock, AlertTriangle,
  MessageSquare, Send, Loader2, Award, FileCheck, Camera, ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DECISION_LABELS,
  DECISION_COLORS,
  type VerificationApplication,
  type VerificationDecision,
} from '@/lib/voc-types';

interface Props {
  application: VerificationApplication;
  auditReport: boolean;
  allDocsReviewed: boolean;
  allEvidReviewed: boolean;
  decision: VerificationDecision | '';
  setDecision: (v: VerificationDecision | '') => void;
  reviewerNotes: string;
  setReviewerNotes: (v: string) => void;
  submitting: boolean;
  onSubmitDecision: () => void;
  isDecided: boolean;
}

export function DecisionTab({
  application, auditReport, allDocsReviewed, allEvidReviewed,
  decision, setDecision, reviewerNotes, setReviewerNotes,
  submitting, onSubmitDecision, isDecided,
}: Props) {
  const canDecide = ['under_review', 'audit_completed'].includes(application.status)
    && allDocsReviewed && allEvidReviewed && auditReport;

  // Show decided state
  if (isDecided) {
    return (
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
              <p className="font-mono text-xs mt-0.5">{application.digital_signature || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600">Blockchain Hash</p>
              <p className="font-mono text-xs mt-0.5">{application.blockchain_hash || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600">Decision Date</p>
              <p className="text-xs mt-0.5">{application.decision_date ? new Date(application.decision_date).toLocaleString() : '—'}</p>
            </div>
          </div>
          {application.decision_notes && (
            <div className="mt-4 p-3 bg-white/60 rounded-lg border border-emerald-200">
              <p className="text-xs text-emerald-600 mb-1">Reviewer Notes</p>
              <p className="text-sm">{application.decision_notes}</p>
            </div>
          )}
          {application.decision === 'approve' && application.carbon_passport && (
            <>
              <Separator className="my-5 border-emerald-200" />
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
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Gate: show blocking reasons if cannot decide
  if (!canDecide) {
    const blockers: string[] = [];
    if (!auditReport) blockers.push('Audit report not yet submitted');
    if (!allDocsReviewed) blockers.push('Not all documents have been reviewed');
    if (!allEvidReviewed) blockers.push('Not all evidence items have been reviewed');
    if (!['under_review', 'audit_completed'].includes(application.status)) {
      blockers.push(`Current status: ${application.status}`);
    }

    return (
      <div className="space-y-4">
        <div className="text-center py-16 text-muted-foreground">
          <Gavel className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Decision is gated behind the following requirements:</p>
        </div>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {auditReport ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                <span className={auditReport ? 'text-emerald-700' : 'text-red-600'}>Audit report submitted</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {allDocsReviewed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                <span className={allDocsReviewed ? 'text-emerald-700' : 'text-red-600'}>All documents reviewed</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {allEvidReviewed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                <span className={allEvidReviewed ? 'text-emerald-700' : 'text-red-600'}>All evidence reviewed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show decision form
  return (
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
              placeholder="Provide comments, observations, or recommendations..."
              rows={4}
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
              onClick={onSubmitDecision}
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </span>
              ) : (
                <span className="flex items-center gap-2"><Send className="h-4 w-4" /> Submit Decision</span>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
