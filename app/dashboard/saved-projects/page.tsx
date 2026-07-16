'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SaveProjectButton } from '@/components/shared/SaveProjectButton';
import { MapPin, TrendingUp, Ruler, ShieldCheck, Bookmark, Clock, Globe } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  statusColor,
  type Project,
  type ProjectStatus,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';

type ProjectWithProfile = Project & {
  profiles?: {
    full_name: string | null;
    organization: string | null;
    state: string | null;
    district: string | null;
  } | null;
};

export default function SavedProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = React.useState<ProjectWithProfile[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchSavedProjects = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    // First get the saved project IDs for the user
    const { data: savedData } = await supabase
      .from('saved_projects')
      .select('project_id')
      .eq('company_id', user.id);
      
    if (!savedData || savedData.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }
    
    const projectIds = savedData.map((s: { project_id: string }) => s.project_id);
    
    // Then fetch those projects
    const { data: projectsData } = await supabase
      .from('projects')
      .select('*, profiles!owner_id(full_name, organization, state, district)')
      .in('id', projectIds)
      .order('created_at', { ascending: false });
      
    setProjects((projectsData as ProjectWithProfile[]) || []);
    setLoading(false);
  }, [user]);

  React.useEffect(() => {
    fetchSavedProjects();
  }, [fetchSavedProjects]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Saved Projects</h1>
          <p className="mt-2 text-muted-foreground">
            Projects you&apos;ve bookmarked for future evaluation.
          </p>
        </div>
        {projects.length > 0 && (
          <Button onClick={() => router.push(`/dashboard/compare?ids=${projects.slice(0, 4).map(p => p.id).join(',')}`)}>
            Compare Saved Projects
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Clock className="h-8 w-8 animate-spin" />
            <p>Loading your saved projects...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-16 text-center border-dashed bg-muted/30">
          <div className="rounded-full bg-primary/10 p-4 shadow-sm">
            <Bookmark className="h-10 w-10 text-primary" />
          </div>
          <div className="max-w-sm">
            <h3 className="font-semibold text-lg">No saved projects</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You haven&apos;t bookmarked any projects yet. Head over to the Discovery Hub to find projects.
            </p>
          </div>
          <Button asChild className="mt-2">
            <Link href="/dashboard/discover">Explore Discovery Hub</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const ownerName = project.profiles?.organization || project.profiles?.full_name || 'Unknown Owner';
            
            return (
              <Card key={project.id} className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-soft-xl hover:-translate-y-1 hover:border-primary/40 border-border/60">
                <div className="relative h-48 w-full overflow-hidden bg-muted">
                  {project.cover_image_url ? (
                    <img src={project.cover_image_url} alt={project.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Globe className="h-12 w-12 text-primary/30" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                  
                  <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur shadow-sm font-medium">
                      {PROJECT_TYPE_LABELS[project.project_type]}
                    </Badge>
                  </div>
                  
                  <div className="absolute right-3 top-3 flex flex-col gap-2 items-end">
                    <Badge className={cn('shadow-sm text-white border-0', statusColor(project.status as ProjectStatus))}>
                      {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
                    </Badge>
                    <div onClick={() => setTimeout(fetchSavedProjects, 500)}>
                      <SaveProjectButton projectId={project.id} size="icon" variant="secondary" className="h-8 w-8 bg-background/90 hover:bg-background backdrop-blur border-0 shadow-sm rounded-full" showText={false} />
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-display font-semibold text-lg leading-tight line-clamp-1 group-hover:text-primary-100 transition-colors text-shadow-sm">
                      {project.name}
                    </h3>
                    <p className="text-xs text-white/80 mt-1 font-medium flex items-center gap-1.5 line-clamp-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {project.location_name || [project.profiles?.state, project.country].filter(Boolean).join(', ') || 'Location pending'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-5 space-y-4">
                  <div className="flex items-start justify-between border-b border-border/50 pb-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Project Owner</p>
                      <p className="text-sm font-medium line-clamp-1">{ownerName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 flex-1">
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                        <TrendingUp className="h-3.5 w-3.5" /> Carbon Target
                      </p>
                      <p className="text-sm font-medium">
                        {project.target_carbon_tonnes ? `${project.target_carbon_tonnes.toLocaleString()} tCO₂e` : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                        <Ruler className="h-3.5 w-3.5" /> Area
                      </p>
                      <p className="text-sm font-medium">
                        {project.area_hectares ? `${project.area_hectares.toLocaleString()} ha` : 'Pending'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                        <ShieldCheck className="h-3.5 w-3.5" /> Verification
                      </p>
                      <p className="text-sm font-medium">
                        {VERIFICATION_STATUS_LABELS[project.verification_status as keyof typeof VERIFICATION_STATUS_LABELS] || 'Not Submitted'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3 mt-auto">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/dashboard/projects/${project.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
