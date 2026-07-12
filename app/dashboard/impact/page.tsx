'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { KpiCard } from '@/components/shared/kpi-card';
import { Card } from '@/components/ui/card';
import {
  Ruler, Leaf, Users, Sprout, Building2, FolderKanban,
  TrendingUp, MapPin, BarChart3, Globe,
} from 'lucide-react';
import { PROJECT_TYPE_LABELS, type Project, type ProjectType, type ProjectSupport } from '@/lib/types';

export default function ImpactDashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: contribs } = await supabase
        .from('project_support')
        .select('project_id')
        .eq('partner_id', user.id);
      const projectIds = Array.from(new Set((contribs || []).map((c: ProjectSupport) => c.project_id)));
      if (projectIds.length > 0) {
        const { data: projData } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds);
        setProjects((projData as Project[]) || []);
      }
      setLoading(false);
    })();
  }, [user]);

  const totalArea = projects.reduce((s, p) => s + (p.area_hectares || 0), 0);
  const totalCarbon = projects.reduce((s, p) => s + (p.target_carbon_tonnes || 0), 0);
  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'verified').length;

  const typeBreakdown = projects.reduce((acc, p) => {
    acc[p.project_type] = (acc[p.project_type] || 0) + 1;
    return acc;
  }, {} as Record<ProjectType, number>);

  const maxTypeCount = Math.max(...Object.values(typeBreakdown), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Impact Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Executive overview of your sustainability support and environmental impact
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Area Restored" value={`${totalArea.toFixed(1)} ha`} icon={Ruler} />
        <KpiCard label="Est. CO₂ Sequestered" value={`${totalCarbon} t`} icon={Leaf} />
        <KpiCard label="Active Projects" value={activeProjects} icon={FolderKanban} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Communities Supported" value="—" hint="Coming soon" icon={Users} />
        <KpiCard label="Mangroves Restored" value={`${(typeBreakdown.mangrove || 0)} projects`} icon={Sprout} />
        <KpiCard label="Wetlands Restored" value={`${(typeBreakdown.salt_marsh || 0) + (typeBreakdown.seagrass || 0)} projects`} icon={Globe} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Project Type Distribution */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4.5 w-4.5 text-primary" />
            <h2 className="font-semibold">Project Type Distribution</h2>
          </div>
          {Object.keys(typeBreakdown).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No projects yet</p>
          ) : (
            <div className="space-y-3">
              {(Object.keys(typeBreakdown) as ProjectType[]).map((type) => (
                <div key={type}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{PROJECT_TYPE_LABELS[type]}</span>
                    <span className="text-muted-foreground">{typeBreakdown[type]} projects</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(typeBreakdown[type] / maxTypeCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Carbon Impact */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-primary" />
            <h2 className="font-semibold">Carbon Impact by Project</h2>
          </div>
          {projects.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No projects yet</p>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 6).map((project) => {
                const carbon = project.target_carbon_tonnes || 0;
                const maxCarbon = Math.max(...projects.map((p) => p.target_carbon_tonnes || 0), 1);
                return (
                  <div key={project.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="truncate font-medium">{project.name}</span>
                      <span className="text-muted-foreground">{carbon} t</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-success" style={{ width: `${(carbon / maxCarbon) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Map Placeholder */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-4.5 w-4.5 text-primary" />
          <h2 className="font-semibold">Supported Project Locations</h2>
        </div>
        <div className="relative h-64 overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
          {projects.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Globe className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No supported projects yet</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MapPin className="mx-auto h-10 w-10 text-primary/40" />
                <p className="mt-2 text-sm text-muted-foreground">{projects.length} project locations</p>
                <p className="text-xs text-muted-foreground/70">Interactive map coming soon</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
