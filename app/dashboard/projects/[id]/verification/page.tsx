'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import {
  Shield,
  Building2,
  Eye,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  MessageSquare,
} from 'lucide-react';
import {
  VERIFICATION_REQUEST_TYPE_LABELS,
  VERIF_REQUEST_STATUS_LABELS,
  VERIFICATION_DECISION_LABELS,
  verificationStatusColor,
  verificationRecordStatusColor,
  type VerificationRequestType,
  type VerificationServiceRequest,
  type VerificationDecisionRecord,
  type VerificationHistory,
  type ProjectPartnership,
} from '@/lib/types';
import { cn } from '@/lib/utils';

interface RequestWithProfiles extends VerificationServiceRequest {
  profiles?: { full_name: string | null; organization: string | null } | null;
}

interface PartnershipWithProfiles extends ProjectPartnership {
  profiles?: { full_name: string | null; organization: string | null } | null;
  verifier?: { full_name: string | null; organization: string | null } | null;
  owner?: { full_name: string | null; organization: string | null } | null;
}

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    approved: 'bg-green-500',
    verified: 'bg-green-500',
    active: 'bg-green-500',
    pending: 'bg-amber-500',
    in_review: 'bg-blue-500',
    in_verification: 'bg-blue-500',
    submitted: 'bg-blue-500',
    rejected: 'bg-red-500',
    changes_requested: 'bg-orange-500',
    expired: 'bg-orange-500',
    not_requested: 'bg-slate-400',
    not_submitted: 'bg-slate-400',
    draft: 'bg-slate-400',
  };
  return (
    <span className={cn('inline-block h-2 w-2 rounded-full', colorMap[status] || 'bg-slate-400')} />
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function SummaryCard({
  title,
  icon: Icon,
  count,
  latestStatus,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  latestStatus: string | null;
}) {
  return (
    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{count}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {count === 1 ? 'Record' : 'Records'}
      </p>
      {latestStatus && (
        <div className="mt-3 flex items-center gap-2">
          <StatusDot status={latestStatus} />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
            {VERIF_REQUEST_STATUS_LABELS[latestStatus as keyof typeof VERIF_REQUEST_STATUS_LABELS] || latestStatus}
          </span>
        </div>
      )}
      {!latestStatus && (
        <div className="mt-3 flex items-center gap-2">
          <StatusDot status="not_requested" />
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">No Data</span>
        </div>
      )}
    </Card>
  );
}

function VerificationRecordCard({
  typeLabel,
  request,
  decision,
}: {
  typeLabel: string;
  request: RequestWithProfiles;
  decision?: VerificationDecisionRecord | null;
}) {
  const verifierName = request.profiles?.full_name || 'Unassigned';
  const organization = request.profiles?.organization || '—';
  const metadata = (request as any).metadata as Record<string, unknown> | null;
  const evidenceCount = metadata?.evidence_count as number | undefined;
  const docsReviewed = metadata?.documents_reviewed as number | undefined;

  return (
    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {typeLabel}
          </span>
        </div>
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', verificationStatusColor(request.status))}>
          <StatusDot status={request.status} />
          {VERIF_REQUEST_STATUS_LABELS[request.status] || request.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">Organization:</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{organization}</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">Verifier:</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{verifierName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">Date:</span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(request.created_at)}</span>
        </div>
      </div>

      {request.description && (
        <div className="mb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Comments</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">{request.description}</p>
        </div>
      )}

      {(docsReviewed != null || evidenceCount != null) && (
        <div className="mb-4 border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center gap-4">
          {docsReviewed != null && (
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Documents Reviewed:</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{docsReviewed}</span>
            </div>
          )}
          {evidenceCount != null && (
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Evidence:</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{evidenceCount}</span>
            </div>
          )}
        </div>
      )}

      {decision && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-2 mb-1">
            {decision.decision === 'approved' ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
            ) : decision.decision === 'rejected' ? (
              <XCircle className="h-3.5 w-3.5 text-red-600" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5 text-orange-600" />
            )}
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Decision:</span>
            <span className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
              decision.decision === 'approved' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
              decision.decision === 'rejected' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
              decision.decision === 'changes_requested' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
            )}>
              {VERIFICATION_DECISION_LABELS[decision.decision] || decision.decision}
            </span>
          </div>
          {decision.remarks && (
            <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 ml-5">{decision.remarks}</p>
          )}
        </div>
      )}
    </Card>
  );
}

function EmptySection({ type }: { type: string }) {
  const messages: Record<string, string> = {
    land: 'No land verification records yet. Verification requests will appear here once submitted.',
    project: 'No project verification records yet. Verification requests will appear here once submitted.',
    monitoring: 'No active monitoring partnerships. Monitoring verifications will appear here once partnerships are established.',
    carbon: 'No carbon verification records yet. Carbon passport status will appear here.',
  };
  return (
    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <Shield className="h-10 w-10 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          {messages[type] || 'No records found.'}
        </p>
      </div>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-4 w-96 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-8 w-12 rounded bg-slate-200 dark:bg-slate-800 mb-1" />
            <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-64 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VerificationCenterPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project, loading: projectLoading } = useProject(projectId);

  const [requests, setRequests] = React.useState<RequestWithProfiles[]>([]);
  const [decisions, setDecisions] = React.useState<VerificationDecisionRecord[]>([]);
  const [history, setHistory] = React.useState<VerificationHistory[]>([]);
  const [partnerships, setPartnerships] = React.useState<PartnershipWithProfiles[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!projectId) return;
    let active = true;

    (async () => {
      setLoading(true);

      const [reqResult, histResult, partResult] = await Promise.all([
        supabase
          .from('verification_service_requests')
          .select('*, profiles!verification_service_requests_verifier_id_fkey(full_name, organization)')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('verification_history')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('project_partnerships')
          .select('*, profiles!project_partnerships_verifier_id_fkey(full_name, organization)')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
      ]);

      if (!active) return;

      const reqData = (reqResult.data as RequestWithProfiles[]) || [];
      setRequests(reqData);
      setHistory((histResult.data as VerificationHistory[]) || []);
      setPartnerships((partResult.data as PartnershipWithProfiles[]) || []);

      if (reqData.length > 0) {
        const { data: decData } = await supabase
          .from('verification_service_decisions')
          .select('*')
          .in('request_id', reqData.map(r => r.id))
          .order('created_at', { ascending: false });
        if (active) {
          setDecisions((decData as VerificationDecisionRecord[]) || []);
        }
      }

      if (active) setLoading(false);
    })();

    return () => { active = false; };
  }, [projectId]);

  if (loading || projectLoading) {
    return <LoadingSkeleton />;
  }

  const landRequests = requests.filter(r => r.request_type === 'land');
  const projectRequests = requests.filter(r => r.request_type === 'project');
  const monitoringPartnerships = partnerships.filter(p => p.status === 'active');
  const carbonHistory = history.filter(h => h.verification_type === 'carbon');
  const passportIssued = project?.passport_issued_at != null;

  const landLatestStatus = landRequests.length > 0 ? landRequests[0].status : null;
  const projectLatestStatus = projectRequests.length > 0 ? projectRequests[0].status : null;
  const carbonStatus = passportIssued ? 'approved' : (carbonHistory.length > 0 ? carbonHistory[0].status : null);
  const monitoringStatus = monitoringPartnerships.length > 0 ? 'active' : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Verification Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete verification history for this project
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Land Verification"
          icon={Shield}
          count={landRequests.length}
          latestStatus={landLatestStatus}
        />
        <SummaryCard
          title="Project Verification"
          icon={Building2}
          count={projectRequests.length}
          latestStatus={projectLatestStatus}
        />
        <SummaryCard
          title="Monitoring Verification"
          icon={Eye}
          count={monitoringPartnerships.length}
          latestStatus={monitoringStatus}
        />
        <SummaryCard
          title="Carbon Verification"
          icon={Award}
          count={passportIssued ? 1 : carbonHistory.length}
          latestStatus={carbonStatus}
        />
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Land Verification
          </h2>
          {landRequests.length === 0 ? (
            <EmptySection type="land" />
          ) : (
            <div className="space-y-4">
              {landRequests.map(req => {
                const decision = decisions.find(d => d.request_id === req.id) || null;
                return (
                  <VerificationRecordCard
                    key={req.id}
                    typeLabel="Land Verification"
                    request={req}
                    decision={decision}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Project Verification
          </h2>
          {projectRequests.length === 0 ? (
            <EmptySection type="project" />
          ) : (
            <div className="space-y-4">
              {projectRequests.map(req => {
                const decision = decisions.find(d => d.request_id === req.id) || null;
                return (
                  <VerificationRecordCard
                    key={req.id}
                    typeLabel="Project Verification"
                    request={req}
                    decision={decision}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Monitoring Verification
          </h2>
          {monitoringPartnerships.length === 0 ? (
            <EmptySection type="monitoring" />
          ) : (
            <div className="space-y-4">
              {monitoringPartnerships.map(partner => (
                <Card key={partner.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      Monitoring Verification
                    </span>
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', verificationRecordStatusColor('approved'))}>
                      <StatusDot status="active" />
                      Active
                    </span>
                  </div>
                  <div className="space-y-2">
                    {partner.profiles?.organization && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Organization:</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{partner.profiles.organization}</span>
                      </div>
                    )}
                    {partner.verifier?.full_name && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Verifier:</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{partner.verifier.full_name}</span>
                      </div>
                    )}
                    {(partner.start_date || partner.started_at) && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Start Date:</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {formatDate(partner.started_at || partner.start_date)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Service Type:</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{partner.service_type}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Carbon Verification
          </h2>
          {!passportIssued && carbonHistory.length === 0 ? (
            <EmptySection type="carbon" />
          ) : (
            <div className="space-y-4">
              {passportIssued && (
                <Card className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      Carbon Verification
                    </span>
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', verificationRecordStatusColor('approved'))}>
                      <StatusDot status="approved" />
                      Passport Issued
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Award className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">Carbon Passport Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Issued On:</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(project!.passport_issued_at!)}</span>
                    </div>
                  </div>
                </Card>
              )}
              {carbonHistory.map(hist => (
                <Card key={hist.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      Carbon Verification
                    </span>
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', verificationRecordStatusColor(hist.status))}>
                      <StatusDot status={hist.status} />
                      {VERIF_REQUEST_STATUS_LABELS[hist.status as keyof typeof VERIF_REQUEST_STATUS_LABELS] || hist.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {hist.organization_name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Organization:</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{hist.organization_name}</span>
                      </div>
                    )}
                    {hist.verifier_name && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Verifier:</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{hist.verifier_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Date:</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(hist.created_at)}</span>
                    </div>
                  </div>
                  {hist.comments && (
                    <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs text-slate-500 dark:text-slate-400">Comments</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{hist.comments}</p>
                    </div>
                  )}
                  <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Documents Reviewed:</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{hist.documents_reviewed}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Evidence:</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{hist.evidence_count}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
