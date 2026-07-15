'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useProject, useVerificationRequests, useVerificationDecisions } from '@/hooks/use-projects';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/shared/FileUpload';
import { AiAnalysisCard } from '@/components/ai/AiAnalysisCard';
import {
  Gavel,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  History,
  ShieldCheck,
  Brain,
} from 'lucide-react';
import {
  VERIFICATION_DECISION_LABELS,
  type VerificationDecision,
} from '@/lib/types';
import { cn } from '@/lib/utils';

export default function DecisionPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuth();
  const { project, loading } = useProject(projectId);
  const { requests } = useVerificationRequests(user?.id ?? null);
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(null);
  const { decisions } = useVerificationDecisions(selectedRequestId);

  const [decision, setDecision] = React.useState<VerificationDecision | null>(null);
  const [remarks, setRemarks] = React.useState('');
  const [justification, setJustification] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [uploadedFilePath, setUploadedFilePath] = React.useState<string | null>(null);
  const [aiAnalyses, setAiAnalyses] = React.useState<any[]>([]);

  const projectRequests = requests.filter((r) => r.project_id === projectId);
  const activeRequest = projectRequests.find((r) => r.status === 'pending' || r.status === 'in_review') || projectRequests[0];

  React.useEffect(() => {
    if (activeRequest && !selectedRequestId) {
      setSelectedRequestId(activeRequest.id);
    }
  }, [activeRequest, selectedRequestId]);

  React.useEffect(() => {
    const fetchAiAnalyses = async () => {
      if (!projectId) return;
      try {
        const response = await fetch(`/api/ai-analysis?project_id=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setAiAnalyses(data.analyses || []);
        }
      } catch {
        console.error('Failed to fetch AI analyses');
      }
    };
    fetchAiAnalyses();
  }, [projectId]);

  const handleSubmit = async () => {
    if (!decision || !user || !selectedRequestId) {
      toast.error('Select a decision and ensure a request is active');
      return;
    }
    if (!remarks.trim()) {
      toast.error('Remarks are required for every decision');
      return;
    }
    setSubmitting(true);
    try {
      const { error: decError } = await supabase.from('verification_service_decisions').insert({
        request_id: selectedRequestId,
        verifier_id: user.id,
        decision,
        remarks: remarks.trim(),
        justification: justification.trim() || null,
      });
      if (decError) throw decError;

      const statusMap: Record<VerificationDecision, string> = {
        approved: 'approved',
        rejected: 'rejected',
        changes_requested: 'changes_requested',
      };
      const { error: reqError } = await supabase
        .from('verification_service_requests')
        .update({ status: statusMap[decision] })
        .eq('id', selectedRequestId);
      if (reqError) throw reqError;

      if (decision === 'approved' && project) {
        await supabase
          .from('projects')
          .update({
            status: 'verified',
            verification_status: 'approved',
            passport_issued_at: new Date().toISOString(),
          })
          .eq('id', projectId);

        await supabase.from('project_activity').insert({
          project_id: projectId,
          actor_id: user.id,
          event_type: 'passport_issued',
          title: 'Carbon Passport Issued',
          description: `Project approved by verifier. Passport issued.`,
        });
      } else {
        const statusUpdate = decision === 'rejected'
          ? { verification_status: 'rejected' as const }
          : { verification_status: 'in_review' as const };
        await supabase.from('projects').update(statusUpdate).eq('id', projectId);
      }

      await supabase.from('project_activity').insert({
        project_id: projectId,
        actor_id: user.id,
        event_type: `decision_${decision}`,
        title: `Verification ${VERIFICATION_DECISION_LABELS[decision]}`,
        description: remarks.trim(),
      });

      toast.success(`Decision submitted: ${VERIFICATION_DECISION_LABELS[decision]}`);
      setDecision(null);
      setRemarks('');
      setJustification('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Decision Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review AI analysis and submit your verification decision. Every action is permanently recorded.
        </p>
      </div>

      {activeRequest ? (
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Gavel className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Active Request</h3>
              <p className="text-sm text-muted-foreground">
                {activeRequest.request_type.charAt(0).toUpperCase() + activeRequest.request_type.slice(1)} verification
                {activeRequest.due_date && ` · Due ${new Date(activeRequest.due_date).toLocaleDateString()}`}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No active verification request</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A verification request must be created before a decision can be made.
            </p>
          </div>
        </Card>
      )}

      {aiAnalyses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">AI Analysis ({aiAnalyses.length})</h2>
          </div>
          {aiAnalyses.slice(0, 3).map((analysis) => (
            <AiAnalysisCard key={analysis.id} analysis={analysis} compact />
          ))}
          {aiAnalyses.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              +{aiAnalyses.length - 3} more analyses.{' '}
              <a href={`/dashboard/projects/${projectId}/ai-review`} className="text-primary hover:underline">
                View all
              </a>
            </p>
          )}
        </div>
      )}

      {activeRequest && (
        <Card className="p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Submit Decision</h2>

          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <DecisionButton
              active={decision === 'approved'}
              onClick={() => setDecision('approved')}
              icon={CheckCircle2}
              label="Approve"
              color="success"
            />
            <DecisionButton
              active={decision === 'changes_requested'}
              onClick={() => setDecision('changes_requested')}
              icon={AlertCircle}
              label="Request Changes"
              color="warning"
            />
            <DecisionButton
              active={decision === 'rejected'}
              onClick={() => setDecision('rejected')}
              icon={XCircle}
              label="Reject"
              color="destructive"
            />
          </div>

          {decision && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <Label>Remarks <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="Provide detailed remarks about your decision..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="mt-1.5 min-h-24"
                />
              </div>
              <div>
                <Label>Justification</Label>
                <Textarea
                  placeholder="Technical justification for your decision..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="mt-1.5 min-h-20"
                />
              </div>
              <div>
                <Label>Supporting Files (Optional)</Label>
                <div className="mt-1.5">
                  <FileUpload
                    bucket="evidence"
                    category="decision_support"
                    projectId={projectId}
                    allowedTypes={['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
                    maxSizeMB={20}
                    onUploadSuccess={(file) => setUploadedFilePath(file.storage_path)}
                  />
                  {uploadedFilePath && (
                    <p className="mt-1 text-xs text-success">File uploaded successfully</p>
                  )}
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !remarks.trim()}
                className="w-full"
                size="lg"
              >
                {submitting ? 'Submitting...' : `Submit ${VERIFICATION_DECISION_LABELS[decision]} Decision`}
              </Button>
            </div>
          )}
        </Card>
      )}

      {selectedRequestId && decisions.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-primary" />
            <h2 className="font-semibold">Decision History</h2>
          </div>
          <div className="space-y-3">
            {decisions.map((d) => (
              <div key={d.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {d.decision === 'approved' && <CheckCircle2 className="h-4 w-4 text-success" />}
                    {d.decision === 'rejected' && <XCircle className="h-4 w-4 text-destructive" />}
                    {d.decision === 'changes_requested' && <AlertCircle className="h-4 w-4 text-warning" />}
                    <span className="text-sm font-medium">
                      {VERIFICATION_DECISION_LABELS[d.decision]}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {d.remarks && (
                  <p className="mt-2 text-sm text-muted-foreground">{d.remarks}</p>
                )}
                {d.justification && (
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    <span className="font-medium">Justification:</span> {d.justification}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function DecisionButton({
  active,
  onClick,
  icon: Icon,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  color: 'success' | 'warning' | 'destructive';
}) {
  const colorClasses = {
    success: active ? 'border-success bg-success/10 text-success' : 'border-border hover:border-success/40 hover:text-success',
    warning: active ? 'border-warning bg-warning/10 text-warning' : 'border-border hover:border-warning/40 hover:text-warning',
    destructive: active ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border hover:border-destructive/40 hover:text-destructive',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
        colorClasses[color]
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
