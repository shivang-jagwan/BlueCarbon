'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectRelationshipCard } from '@/components/workspace/ProjectRelationshipCard';
import { SaveProjectButton } from '@/components/shared/SaveProjectButton';
import { FollowProjectButton } from '@/components/shared/FollowProjectButton';
import { useAuth } from '@/components/providers/auth-provider';
import {
  MapPin, TrendingUp, HeartPulse, Building,
  Clock, CheckCircle2, AlertTriangle, ShieldCheck,
  Leaf, Wind, GitCompare, Calendar,
  Award, Layers, ChevronRight, Send, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  statusColor,
} from '@/lib/types';
import { PartnershipInfoCard } from '@/components/workspace/PartnershipInfoCard';
import { PartnershipLifecycleCard } from '@/components/workspace/PartnershipLifecycleCard';
import { APPLICATION_STATUS_LABELS } from '@/lib/voc-types';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const AGENCY_STATUS_STYLES: Record<string, string> = {
  approved: 'bg-emerald-50 border-emerald-200 hover:border-emerald-300',
  rejected: 'bg-red-50 border-red-200 hover:border-red-300',
  waiting: 'bg-amber-50 border-amber-200 hover:border-amber-300',
  under_review: 'bg-blue-50 border-blue-200 hover:border-blue-300',
  audit_scheduled: 'bg-purple-50 border-purple-200 hover:border-purple-300',
  audit_completed: 'bg-cyan-50 border-cyan-200 hover:border-cyan-300',
  returned_for_revision: 'bg-orange-50 border-orange-200 hover:border-orange-300',
};

const AGENCY_STATUS_BADGE: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  waiting: 'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  audit_scheduled: 'bg-purple-100 text-purple-700',
  audit_completed: 'bg-cyan-100 text-cyan-700',
  returned_for_revision: 'bg-orange-100 text-orange-700',
};

/* ------------------------------------------------------------------ */
/*  Verification Reports List (multi-agency)                           */
/* ------------------------------------------------------------------ */

interface AgencyRequestRow {
  id: string;
  request_id: string;
  agency_name: string;
  agency_id: string;
  verification_status: string;
  assigned_verifier: string | null;
  audit_date: string | null;
  last_updated: string | null;
  carbon_passport_status: string | null;
}

function VerificationReportsList({ projectId, isOwner }: { projectId: string; isOwner: boolean }) {
  const [agencyRequests, setAgencyRequests] = React.useState<AgencyRequestRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const { data: requests } = await supabase
        .from('voc_requests')
        .select('id')
        .eq('project_id', projectId);

      if (requests && requests.length > 0) {
        const requestIds = requests.map((r: any) => r.id);
        const { data: apps } = await supabase
          .from('voc_agency_requests')
          .select('id, request_id, agency_name, agency_id, verification_status, assigned_verifier, audit_date, last_updated, carbon_passport_status')
          .in('request_id', requestIds)
          .order('created_at', { ascending: false });
        setAgencyRequests(apps || []);
      }
      setLoading(false);
    })();
  }, [projectId]);

  if (loading) {
    return (
      <Card className="p-6 shadow-sm border-border/60 space-y-4">
        <Skeleton className="h-5 w-48" />
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-sm border-border/60">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Verification Reports
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {agencyRequests.length} {agencyRequests.length === 1 ? 'verification' : 'verifications'} recorded for this project
          </p>
        </div>
        {isOwner && (
          <Button size="sm" asChild className="bg-green-600 hover:bg-green-700 text-white">
            <Link href={`/dashboard/projects/${projectId}/verification`}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Request New Verification
            </Link>
          </Button>
        )}
      </div>

      {agencyRequests.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <ShieldCheck className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No verification records yet</p>
          {isOwner && (
            <Button size="sm" variant="outline" className="mt-3" asChild>
              <Link href={`/dashboard/projects/${projectId}/verification`}>
                <Send className="mr-1.5 h-3.5 w-3.5" /> Request Verification
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {agencyRequests.map((req) => {
            const statusKey = req.verification_status || 'waiting';
            const isClickable = ['approved', 'returned_for_revision', 'rejected'].includes(statusKey);
            const cardContent = (
              <div className="flex items-center gap-4">
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  statusKey === 'approved' ? 'bg-emerald-100' : statusKey === 'rejected' ? 'bg-red-100' : 'bg-slate-100'
                )}>
                  {statusKey === 'approved' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : statusKey === 'rejected' ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : (
                    <ShieldCheck className="h-5 w-5 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{req.agency_name}</p>
                    <Badge className={cn('text-[10px] border-0', AGENCY_STATUS_BADGE[statusKey] || 'bg-slate-100 text-slate-600')}>
                      {APPLICATION_STATUS_LABELS[statusKey as keyof typeof APPLICATION_STATUS_LABELS] || statusKey}
                    </Badge>
                    {req.carbon_passport_status && req.carbon_passport_status !== 'none' && (
                      <Badge className="text-[10px] border-0 bg-blue-100 text-blue-700">
                        <Award className="mr-0.5 h-2.5 w-2.5" /> Passport
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    {req.assigned_verifier && (
                      <span>Verifier: {req.assigned_verifier}</span>
                    )}
                    {req.audit_date && (
                      <>
                        <span>•</span>
                        <span>Audit: {new Date(req.audit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </>
                    )}
                    {req.last_updated && (
                      <>
                        <span>•</span>
                        <span>Updated: {new Date(req.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </>
                    )}
                  </div>
                </div>
                {isClickable && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            );

            return isClickable ? (
              <Link
                key={req.id}
                href={`/dashboard/projects/${projectId}/verification/view/${req.id}`}
                className={cn(
                  'block p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer',
                  AGENCY_STATUS_STYLES[statusKey] || 'bg-white border-slate-200 hover:border-slate-300'
                )}
              >
                {cardContent}
              </Link>
            ) : (
              <div
                key={req.id}
                className={cn(
                  'p-4 rounded-xl border',
                  AGENCY_STATUS_STYLES[statusKey] || 'bg-white border-slate-200'
                )}
              >
                {cardContent}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { project, loading } = useProject(projectId);
  const { profile } = useAuth();

  const [projectData, setProjectData] = React.useState<any>(null);

  React.useEffect(() => {
    if (!projectId) return;
    supabase
      .from('projects')
      .select('*, profiles!projects_owner_id_fkey(full_name, organization, avatar_url)')
      .eq('id', projectId)
      .single()
      .then(({ data }: { data: any }) => setProjectData(data));
  }, [projectId]);

  if (loading && !projectData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const p = projectData || project;
  if (!p) return null;

  const isVerified = p.verification_status === 'approved';
  const ownerProfile = p.profiles;
  const isPartner = profile?.role === 'sustainability_partner';
  const isOwner = profile?.id === p.owner_id;

  // Verified project layout
  if (isVerified) {
    return (
      <div className="space-y-6 pb-20">
        {/* Verification Reports — single source of truth */}
        <VerificationReportsList projectId={projectId} isOwner={isOwner} />
      </div>
    );
  }

  // Unverified / In-progress project layout
  return (
    <div className="space-y-6 pb-20">
      {isPartner && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Evaluating this project?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Save it for later or follow for updates.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FollowProjectButton projectId={p.id} size="sm" />
              <SaveProjectButton projectId={p.id} size="sm" />
              <Button
                size="sm"
                onClick={() => router.push(`/dashboard/compare?ids=${p.id}`)}
                variant="secondary"
              >
                <GitCompare className="h-4 w-4 mr-1.5" /> Compare
              </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          <Card className="p-6 shadow-sm border-border/60">
            <h2 className="font-display text-xl font-semibold mb-4">About the Project</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <p>
                This{' '}
                {PROJECT_TYPE_LABELS[p.project_type as keyof typeof PROJECT_TYPE_LABELS]?.toLowerCase() ||
                  'blue carbon'}{' '}
                restoration project is located in {p.location_name || p.country || 'a critical ecosystem'}. It
                aims to restore {p.area_hectares} hectares of degraded coastal habitat, sequestering approximately{' '}
                {p.target_carbon_tonnes?.toLocaleString()} tonnes of CO₂ over its lifetime.
              </p>
              <p>
                This project contributes directly to climate change mitigation, coastal
                resilience, and biodiversity enhancement.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-muted/30 p-3 rounded-lg border">
                <Leaf className="h-4 w-4 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Ecosystem</p>
                <p className="text-sm font-semibold">
                  {PROJECT_TYPE_LABELS[p.project_type as keyof typeof PROJECT_TYPE_LABELS]}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border">
                <MapPin className="h-4 w-4 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-semibold truncate">
                  {p.location_name || p.country || 'N/A'}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border">
                <TrendingUp className="h-4 w-4 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Carbon Target</p>
                <p className="text-sm font-semibold">
                  {p.target_carbon_tonnes ? `${p.target_carbon_tonnes.toLocaleString()} t` : 'N/A'}
                </p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border">
                <Calendar className="h-4 w-4 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-semibold">
                  {p.expected_duration_months ? `${p.expected_duration_months} mo` : 'N/A'}
                </p>
              </div>
            </div>
          </Card>

          {/* Verification Reports — always visible */}
          <VerificationReportsList projectId={projectId} isOwner={isOwner} />

          <ProjectRelationshipCard project={p} />
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-primary/5 border-primary/20 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Verification
              </h3>
              <Badge>
                {PROJECT_STATUS_LABELS[p.status as keyof typeof PROJECT_STATUS_LABELS] || p.status}
              </Badge>
            </div>
            {p.health_score !== null && p.health_score !== undefined && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <HeartPulse className="h-4 w-4" /> Health Score
                  </span>
                  <span className="font-bold">{p.health_score}/100</span>
                </div>
                <Progress
                  value={p.health_score}
                  className={cn(
                    'h-2 mb-4',
                    p.health_score > 70 ? '[&>div]:bg-success' : '[&>div]:bg-warning'
                  )}
                />
              </>
            )}
            {isVerified ? (
              <div className="bg-green-50 rounded-lg p-3 text-xs text-green-700 flex items-start gap-2 border border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <p>
                  This project has been verified. A Carbon Passport can be issued upon request.
                </p>
              </div>
            ) : (
              <div className="bg-background rounded-lg p-3 text-xs text-muted-foreground flex items-start gap-2 border">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p>
                  This project is currently seeking verification. Once verified, a Carbon Passport will be issued.
                </p>
              </div>
            )}
            {isOwner && (
              <Button size="sm" className="w-full mt-3" asChild>
                <Link href={`/dashboard/projects/${projectId}/verification`}>
                  <Send className="mr-1.5 h-3.5 w-3.5" /> Request Verification
                </Link>
              </Button>
            )}
          </Card>

          <PartnershipLifecycleCard project={p as any} />
          <PartnershipInfoCard project={p as any} />

          <Card className="p-6 shadow-sm border-border/60">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Building className="h-4 w-4" /> Project Owner
            </h3>
            <div className="flex items-center gap-3 mb-4">
              {ownerProfile?.avatar_url ? (
                <img
                  src={ownerProfile.avatar_url}
                  alt={ownerProfile.full_name || 'Owner'}
                  className="h-10 w-10 rounded-full object-cover border"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted border flex items-center justify-center">
                  <Building className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium line-clamp-1">
                  {ownerProfile?.full_name || ownerProfile?.organization || 'Registered Organization'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ownerProfile?.organization || 'Project Developer'}
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full text-xs" size="sm" disabled>
              Coming Soon
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
