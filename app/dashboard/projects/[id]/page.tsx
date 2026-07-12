'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SaveProjectButton } from '@/components/shared/SaveProjectButton';
import { FollowProjectButton } from '@/components/shared/FollowProjectButton';
import { SupportProjectModal } from '@/components/shared/SupportProjectModal';
import { useAuth } from '@/components/providers/auth-provider';
import {
  MapPin, TrendingUp, HeartPulse, Building, 
  Clock, CheckCircle2, AlertTriangle, ShieldCheck,
  FileText, Leaf, Droplets, Wind, ArrowRight,
  GitCompare, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { PROJECT_TYPE_LABELS, PROJECT_STATUS_LABELS, type ProjectActivity } from '@/lib/types';
import Link from 'next/link';

function RecentActivityCard({ projectId }: { projectId: string }) {
  const [activities, setActivities] = React.useState<ProjectActivity[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase
      .from('project_activity')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }: { data: any }) => {
        setActivities((data as ProjectActivity[]) || []);
        setLoading(false);
      });
  }, [projectId]);

  return (
    <Card className="p-6 shadow-sm border-border/60">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-semibold">Recent Activity</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/projects/${projectId}/timeline`}>View All Timeline</Link>
        </Button>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground py-4">Loading activity...</div>
      ) : activities.length === 0 ? (
        <div className="relative border-l-2 border-border ml-3 space-y-6">
          <div className="relative pl-6">
            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
            <p className="text-sm font-medium">Project Registered</p>
            <p className="text-xs text-muted-foreground mt-0.5">No activity yet</p>
          </div>
        </div>
      ) : (
        <div className="relative border-l-2 border-border ml-3 space-y-6">
          {activities.map((activity, idx) => (
            <div key={activity.id} className="relative pl-6">
              <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full ring-4 ring-background ${idx === 0 ? 'bg-primary' : 'bg-muted border-2 border-border'}`} />
              <p className="text-sm font-medium">{activity.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{new Date(activity.created_at).toLocaleDateString()}</p>
              {activity.description && <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { project, loading } = useProject(projectId);
  const { profile } = useAuth();
  
  const [relatedProjects, setRelatedProjects] = React.useState<any[]>([]);
  const [supportModalOpen, setSupportModalOpen] = React.useState(false);
  const [fundingRaised, setFundingRaised] = React.useState(0);

  React.useEffect(() => {
    if (!project) return;
    (async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name, project_type, location_name')
        .neq('id', project.id)
        .or(`project_type.eq.${project.project_type},country.eq.${project.country}`)
        .in('status', ['registered', 'verified', 'active'])
        .limit(3);
      setRelatedProjects(data || []);
    })();
  }, [project]);

  React.useEffect(() => {
    if (!project) return;
    supabase
      .from('project_support')
      .select('amount_usd')
      .eq('project_id', project.id)
      .eq('status', 'completed')
      .then(({ data }: { data: any }) => {
        const total = data?.reduce((sum: number, r: { amount_usd: number }) => sum + (r.amount_usd || 0), 0) ?? 0;
        setFundingRaised(total);
      });
  }, [project]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  const isPartner = profile?.role === 'sustainability_partner';
  const fundingGoal = project.target_carbon_tonnes ? project.target_carbon_tonnes * 25 : 50000;
  const fundingPercent = fundingGoal > 0 ? Math.min((fundingRaised / fundingGoal) * 100, 100) : 0;

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Actions (Partner Only) */}
      {isPartner && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-card p-4 rounded-xl border shadow-sm">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Evaluating this project?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Save it for later, follow for updates, or support it now.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FollowProjectButton projectId={project.id} size="sm" />
            <SaveProjectButton projectId={project.id} size="sm" />
            <Button size="sm" onClick={() => router.push(`/dashboard/compare?ids=${project.id}`)} variant="secondary">
              <GitCompare className="h-4 w-4 mr-1.5" /> Compare
            </Button>
            <Button size="sm" onClick={() => setSupportModalOpen(true)}>
              Support Project <ArrowRight className="h-4 w-4 ml-1.5" />
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
                This {PROJECT_TYPE_LABELS[project.project_type]?.toLowerCase() || 'blue carbon'} restoration project 
                is located in {project.location_name || project.country || 'a critical ecosystem'}. 
                It aims to restore {project.area_hectares} hectares of degraded coastal habitat, 
                sequestering approximately {project.target_carbon_tonnes?.toLocaleString()} tonnes of CO₂ over its lifetime.
              </p>
              <p>
                By supporting this project, you are contributing directly to climate change mitigation,
                coastal resilience, and biodiversity enhancement.
              </p>
            </div>
            
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-muted/30 p-3 rounded-lg border">
                <Leaf className="h-4 w-4 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Ecosystem</p>
                <p className="text-sm font-semibold">{PROJECT_TYPE_LABELS[project.project_type]}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border">
                <MapPin className="h-4 w-4 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-semibold truncate">{project.location_name || project.country || 'N/A'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border">
                <TrendingUp className="h-4 w-4 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Carbon Target</p>
                <p className="text-sm font-semibold">{project.target_carbon_tonnes ? `${project.target_carbon_tonnes.toLocaleString()} t` : 'N/A'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border">
                <Calendar className="h-4 w-4 text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-semibold">{project.expected_duration_months ? `${project.expected_duration_months} mo` : 'N/A'}</p>
              </div>
            </div>
          </Card>

          {/* Environmental Impact Estimates */}
          <Card className="p-6 shadow-sm border-border/60">
            <h2 className="font-display text-xl font-semibold mb-4">Estimated Environmental Impact</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 text-center border rounded-xl bg-gradient-to-b from-blue-500/10 to-transparent">
                <Droplets className="h-8 w-8 text-blue-500 mb-3" />
                <h4 className="font-semibold">Carbon Sequestration</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {project.verified_carbon_tonnes ? `${project.verified_carbon_tonnes.toLocaleString()} t verified` : project.target_carbon_tonnes ? `${project.target_carbon_tonnes.toLocaleString()} t targeted` : 'Awaiting data'}
                </p>
              </div>
              <div className="flex flex-col items-center p-4 text-center border rounded-xl bg-gradient-to-b from-emerald-500/10 to-transparent">
                <Leaf className="h-8 w-8 text-emerald-500 mb-3" />
                <h4 className="font-semibold">Habitat Area</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {project.area_hectares ? `${project.area_hectares.toLocaleString()} hectares` : 'Awaiting survey'}
                </p>
              </div>
              <div className="flex flex-col items-center p-4 text-center border rounded-xl bg-gradient-to-b from-cyan-500/10 to-transparent">
                <Wind className="h-8 w-8 text-cyan-500 mb-3" />
                <h4 className="font-semibold">Project Duration</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {project.start_date ? `Started ${new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'Not yet started'}
                </p>
              </div>
            </div>
          </Card>
          
          {/* Recent Activity / Timeline Preview */}
          <RecentActivityCard projectId={project.id} />
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          
          {/* Health & Verification Status */}
          <Card className="p-6 bg-primary/5 border-primary/20 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary"/> Verification</h3>
              <Badge>{PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS]}</Badge>
            </div>
            {project.health_score !== null && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-1.5"><HeartPulse className="h-4 w-4" /> Health Score</span>
                  <span className="font-bold">{project.health_score}/100</span>
                </div>
                <Progress value={project.health_score} className={cn("h-2 mb-4", project.health_score > 70 ? "[&>div]:bg-success" : "[&>div]:bg-warning")} />
              </>
            )}
            <div className="bg-background rounded-lg p-3 text-xs text-muted-foreground flex items-start gap-2 border">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p>This project is currently seeking verification. Once verified, a Carbon Passport will be issued.</p>
            </div>
          </Card>

          {/* Support Progress */}
          <Card className="p-6 shadow-sm border-border/60">
            <h3 className="font-semibold mb-4 flex items-center gap-2">Support Progress</h3>
            <div className="mb-2 flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">${fundingRaised.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">raised of ${fundingGoal.toLocaleString()} goal</p>
              </div>
              <p className="text-sm font-semibold text-primary">{Math.round(fundingPercent)}%</p>
            </div>
            <Progress value={fundingPercent} className="h-2 mb-4" />
            <Button className="w-full" onClick={() => setSupportModalOpen(true)}>Pledge Support</Button>
          </Card>

          {/* Owner Profile */}
          <Card className="p-6 shadow-sm border-border/60">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Building className="h-4 w-4"/> Project Owner</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-muted border flex items-center justify-center">
                <Building className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium line-clamp-1">{project.owner_id ? "Registered Organization" : "Unknown"}</p>
                <p className="text-xs text-muted-foreground">Project Developer</p>
              </div>
            </div>
            <Button variant="outline" className="w-full text-xs" size="sm" disabled>Coming Soon</Button>
          </Card>

          {/* Recommended Projects */}
          {isPartner && relatedProjects.length > 0 && (
            <Card className="p-6 shadow-sm border-border/60">
              <h3 className="font-semibold mb-4 text-sm">Similar Projects</h3>
              <div className="space-y-3">
                {relatedProjects.map(rp => (
                  <Link key={rp.id} href={`/dashboard/projects/${rp.id}`} className="block group">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {PROJECT_TYPE_LABELS[rp.project_type as keyof typeof PROJECT_TYPE_LABELS]?.[0] || 'P'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{rp.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{rp.location_name || 'View Details'}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

        </div>
      </div>

      <SupportProjectModal 
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
        ownerId={project.owner_id}
      />
    </div>
  );
}
