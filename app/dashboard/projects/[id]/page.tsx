'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject, useProjectActivity } from '@/hooks/use-projects';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { SaveProjectButton } from '@/components/shared/SaveProjectButton';
import { FollowProjectButton } from '@/components/shared/FollowProjectButton';
import { useAuth } from '@/components/providers/auth-provider';
import {
  MapPin, TrendingUp, HeartPulse, Building,
  Clock, CheckCircle2, AlertTriangle, ShieldCheck,
  FileText, Leaf, Droplets, Wind, ArrowRight,
  GitCompare, Calendar, Users, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  statusColor,
  type ProjectActivity,
} from '@/lib/types';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Verification Summary                                               */
/* ------------------------------------------------------------------ */

interface VerifRequest {
  request_type: string;
  status: string;
  verifier_id: string;
  profiles?: { full_name: string | null; organization: string | null } | null;
}
interface Partnership {
  status: string;
  verifier_id: string;
  profiles?: { full_name: string | null; organization: string | null } | null;
}

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    approved: 'bg-green-500',
    verified: 'bg-green-500',
    active: 'bg-green-500',
    pending: 'bg-amber-500',
    in_review: 'bg-blue-500',
    rejected: 'bg-red-500',
  };
  return (
    <span className={cn('inline-block h-2 w-2 rounded-full', colorMap[status] || 'bg-slate-400')} />
  );
}

function VerificationSummary({ projectId }: { projectId: string }) {
  const [verifRequests, setVerifRequests] = React.useState<VerifRequest[]>([]);
  const [partnerships, setPartnerships] = React.useState<Partnership[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      supabase
        .from('verification_service_requests')
        .select('request_type, status, verifier_id, profiles!verification_requests_verifier_id_fkey(full_name, organization)')
        .eq('project_id', projectId),
      supabase
        .from('project_partnerships')
        .select('status, verifier_id, profiles!project_partnerships_verifier_id_fkey(full_name, organization)')
        .eq('project_id', projectId),
    ]).then(([reqRes, partRes]) => {
      setVerifRequests((reqRes.data as VerifRequest[]) || []);
      setPartnerships((partRes.data as Partnership[]) || []);
      setLoading(false);
    });
  }, [projectId]);

  if (loading) {
    return (
      <Card className="p-6 shadow-sm border-border/60 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full mt-2" />
      </Card>
    );
  }

  const landVerifs = verifRequests.filter((r) => r.request_type === 'land');
  const projectVerifs = verifRequests.filter((r) => r.request_type === 'project');
  const activeMonitoring = partnerships.filter((p) => p.status === 'active');

  const landCount = landVerifs.length || 0;
  const projectCount = projectVerifs.length || 0;
  const monitoringCount = activeMonitoring.length || 0;

  const allVerifs = [...landVerifs, ...projectVerifs];
  const approvedCount = allVerifs.filter((v) => v.status === 'approved').length;
  const totalVerifs = allVerifs.length || 1;
  const progress = Math.min(Math.round((approvedCount / totalVerifs) * 100), 100);

  const monitoringOrg = activeMonitoring[0]?.profiles;

  return (
    <Card className="p-6 shadow-sm border-border/60">
      <h2 className="font-display text-xl font-semibold mb-4">Verification Summary</h2>
      <div className="space-y-4">
        {/* Land Verification */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
          <div>
            <p className="text-sm font-medium">Land Verification</p>
            <p className="text-xs text-muted-foreground">
              {landCount} {landCount === 1 ? 'Organization' : 'Organizations'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot status={landVerifs[0]?.status || 'not_submitted'} />
            <span className="text-xs font-medium">
              {landVerifs[0]?.status ? VERIFICATION_STATUS_LABELS[landVerifs[0].status as keyof typeof VERIFICATION_STATUS_LABELS] || landVerifs[0].status : 'Not Requested'}
            </span>
          </div>
        </div>

        {/* Project Verification */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
          <div>
            <p className="text-sm font-medium">Project Verification</p>
            <p className="text-xs text-muted-foreground">
              {projectCount} {projectCount === 1 ? 'Organization' : 'Organizations'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot status={projectVerifs[0]?.status || 'not_submitted'} />
            <span className="text-xs font-medium">
              {projectVerifs[0]?.status ? VERIFICATION_STATUS_LABELS[projectVerifs[0].status as keyof typeof VERIFICATION_STATUS_LABELS] || projectVerifs[0].status : 'Not Requested'}
            </span>
          </div>
        </div>

        {/* Monitoring Organization */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
          <div>
            <p className="text-sm font-medium">Monitoring Organization</p>
            <p className="text-xs text-muted-foreground">
              {monitoringOrg?.organization || monitoringOrg?.full_name || 'No monitoring partner'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot status={activeMonitoring.length > 0 ? 'active' : 'not_submitted'} />
            <span className="text-xs font-medium">
              {activeMonitoring.length > 0 ? 'Active' : 'None'}
            </span>
          </div>
        </div>

        {/* Verification Progress */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Verification Progress</span>
            <span className="text-sm font-semibold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline Summary (replaces RecentActivityCard)                     */
/* ------------------------------------------------------------------ */

function TimelineSummary({ projectId }: { projectId: string }) {
  const { activities, loading } = useProjectActivity(projectId);
  const display = activities.slice(0, 6);

  return (
    <Card className="p-6 shadow-sm border-border/60">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold">Timeline</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/projects/${projectId}/timeline`}>
            View Full Timeline <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-3 w-3 rounded-full mt-1.5 shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : display.length === 0 ? (
        <div className="relative border-l-2 border-border ml-3 space-y-6">
          <div className="relative pl-6">
            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
            <p className="text-sm font-medium">Project Registered</p>
            <p className="text-xs text-muted-foreground mt-0.5">No activity yet</p>
          </div>
        </div>
      ) : (
        <div className="relative border-l-2 border-border ml-3 space-y-6">
          {display.map((activity, idx) => (
            <div key={activity.id} className="relative pl-6">
              <div
                className={cn(
                  'absolute -left-[9px] top-1 h-4 w-4 rounded-full ring-4 ring-background',
                  idx === 0 ? 'bg-primary' : 'bg-muted border-2 border-border'
                )}
              />
              <p className="text-sm font-medium">{activity.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(activity.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {activity.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {activity.description}
                </p>
              )}
            </div>
          ))}
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
  const [relatedProjects, setRelatedProjects] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!projectId) return;
    supabase
      .from('projects')
      .select('*, profiles!projects_owner_id_fkey(full_name, organization, avatar_url)')
      .eq('id', projectId)
      .single()
      .then(({ data }: { data: any }) => setProjectData(data));
  }, [projectId]);

  React.useEffect(() => {
    const p = projectData || project;
    if (!p) return;
    (async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name, project_type, location_name')
        .neq('id', p.id)
        .or(`project_type.eq.${p.project_type},country.eq.${p.country}`)
        .in('status', ['registered', 'verified', 'active'])
        .limit(3);
      setRelatedProjects(data || []);
    })();
  }, [projectData, project]);

  if (loading && !projectData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const p = projectData || project;
  if (!p) return null;

  const ownerProfile = p.profiles;
  const isPartner = profile?.role === 'sustainability_partner';

  return (
    <div className="space-y-6 pb-20">
      {/* Top Actions (Partner Only) */}
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

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2/3 width) */}
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

          {/* Verification Summary */}
          <VerificationSummary projectId={projectId} />

          {/* Environmental Impact Estimates */}
          <Card className="p-6 shadow-sm border-border/60">
            <h2 className="font-display text-xl font-semibold mb-4">Estimated Environmental Impact</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 text-center border rounded-xl bg-gradient-to-b from-blue-500/10 to-transparent">
                <Droplets className="h-8 w-8 text-blue-500 mb-3" />
                <h4 className="font-semibold">Carbon Sequestration</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.verified_carbon_tonnes
                    ? `${p.verified_carbon_tonnes.toLocaleString()} t verified`
                    : p.target_carbon_tonnes
                      ? `${p.target_carbon_tonnes.toLocaleString()} t targeted`
                      : 'Awaiting data'}
                </p>
              </div>
              <div className="flex flex-col items-center p-4 text-center border rounded-xl bg-gradient-to-b from-emerald-500/10 to-transparent">
                <Leaf className="h-8 w-8 text-emerald-500 mb-3" />
                <h4 className="font-semibold">Habitat Area</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.area_hectares
                    ? `${p.area_hectares.toLocaleString()} hectares`
                    : 'Awaiting survey'}
                </p>
              </div>
              <div className="flex flex-col items-center p-4 text-center border rounded-xl bg-gradient-to-b from-cyan-500/10 to-transparent">
                <Wind className="h-8 w-8 text-cyan-500 mb-3" />
                <h4 className="font-semibold">Project Duration</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.start_date
                    ? `Started ${new Date(p.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                    : 'Not yet started'}
                </p>
              </div>
            </div>
          </Card>

          {/* Timeline Summary */}
          <TimelineSummary projectId={projectId} />
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Health & Verification Status */}
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
            <div className="bg-background rounded-lg p-3 text-xs text-muted-foreground flex items-start gap-2 border">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p>
                This project is currently seeking verification. Once verified, a Carbon Passport will be issued.
              </p>
            </div>
          </Card>

          {/* Owner Profile */}
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

          {/* Recommended Projects */}
          {isPartner && relatedProjects.length > 0 && (
            <Card className="p-6 shadow-sm border-border/60">
              <h3 className="font-semibold mb-4 text-sm">Similar Projects</h3>
              <div className="space-y-3">
                {relatedProjects.map((rp) => (
                  <Link key={rp.id} href={`/dashboard/projects/${rp.id}`} className="block group">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {(PROJECT_TYPE_LABELS[rp.project_type as keyof typeof PROJECT_TYPE_LABELS] as string)?.[0] ||
                          'P'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {rp.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {rp.location_name || 'View Details'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

    </div>
  );
}
