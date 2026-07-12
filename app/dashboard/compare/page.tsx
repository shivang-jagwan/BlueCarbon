'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { GitCompare, X, Plus, Clock, TrendingUp, Ruler, Leaf, ShieldCheck, Award, MapPin, Building, Activity, PieChart } from 'lucide-react';
import {
  PROJECT_TYPE_LABELS, PROJECT_STATUS_LABELS, VERIFICATION_STATUS_LABELS,
  type Project, type ProjectStatus
} from '@/lib/types';
import { cn } from '@/lib/utils';

// Extend Project type for join data
type ProjectWithProfile = Project & {
  profiles?: {
    full_name: string | null;
    organization: string | null;
  } | null;
};

export default function ComparePage() {
  const searchParams = useSearchParams();
  const initialIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];

  const [allProjects, setAllProjects] = React.useState<ProjectWithProfile[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>(initialIds);
  const [loading, setLoading] = React.useState(true);
  const [showPicker, setShowPicker] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('projects')
        .select('*, profiles!owner_id(full_name, organization)')
        .in('status', ['registered', 'verified', 'active', 'completed', 'in_verification'])
        .order('created_at', { ascending: false });
      
      const fetchedProjects = (data as ProjectWithProfile[]) || [];
      setAllProjects(fetchedProjects);
      
      // Filter out any invalid IDs from initial load
      const validIds = initialIds.filter(id => fetchedProjects.some(p => p.id === id));
      if (validIds.length !== initialIds.length) {
        setSelectedIds(validIds);
      }
      
      setLoading(false);
    })();
  }, []);

  const addProject = (id: string) => {
    if (selectedIds.length >= 4 || selectedIds.includes(id)) return;
    setSelectedIds([...selectedIds, id]);
    setShowPicker(false);
  };

  const removeProject = (id: string) => {
    setSelectedIds(selectedIds.filter(i => i !== id));
  };

  const selected = selectedIds.map(id => allProjects.find(p => p.id === id)).filter(Boolean) as ProjectWithProfile[];
  
  const availableProjects = allProjects.filter(p => !selectedIds.includes(p.id));

  const metrics: Array<{ label: string; key: string; icon: any; format: (p: ProjectWithProfile) => string | null }> = [
    { label: 'Project Type', key: 'project_type', icon: Leaf, format: (p) => PROJECT_TYPE_LABELS[p.project_type] },
    { label: 'Status', key: 'status', icon: Activity, format: (p) => PROJECT_STATUS_LABELS[p.status as ProjectStatus] },
    { label: 'Owner', key: 'owner', icon: Building, format: (p) => p.profiles?.organization || p.profiles?.full_name || 'Unknown' },
    { label: 'Area', key: 'area_hectares', icon: Ruler, format: (p) => p.area_hectares ? `${p.area_hectares.toLocaleString()} ha` : '—' },
    { label: 'Carbon Target', key: 'target_carbon_tonnes', icon: TrendingUp, format: (p) => p.target_carbon_tonnes ? `${p.target_carbon_tonnes.toLocaleString()} t` : '—' },
    { label: 'Health Score', key: 'health_score', icon: Award, format: (p) => p.health_score ? `${p.health_score}/100` : '—' },
    { label: 'Completion %', key: 'completion', icon: PieChart, format: (p) => p.status === 'completed' ? '100%' : p.status === 'active' ? 'In Progress' : '0%' },
    { label: 'Verification', key: 'verification_status', icon: ShieldCheck, format: (p) => VERIFICATION_STATUS_LABELS[p.verification_status as keyof typeof VERIFICATION_STATUS_LABELS] || 'Not Submitted' },
    { label: 'Location', key: 'location_name', icon: MapPin, format: (p) => p.location_name || '—' },
    { label: 'Duration', key: 'expected_duration_months', icon: Clock, format: (p) => p.expected_duration_months ? `${p.expected_duration_months} months` : '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Project Comparison</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare up to 4 projects side by side to make informed support decisions
          </p>
        </div>
        {selected.length < 4 && (
          <Button onClick={() => setShowPicker(!showPicker)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Project
          </Button>
        )}
      </div>

      {/* Project Picker */}
      {showPicker && (
        <Card className="p-4 animate-fade-in border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Select a project to compare</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowPicker(false)}>Cancel</Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Clock className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : availableProjects.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No more projects available to compare</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[300px] overflow-y-auto pr-2">
              {availableProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => addProject(project.id)}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 bg-background hover:bg-muted/30"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {PROJECT_TYPE_LABELS[project.project_type]?.[0] || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{project.location_name || 'No location'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Comparison Table */}
      {loading && selected.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Clock className="h-8 w-8 animate-spin mb-4" />
          <p>Loading projects...</p>
        </Card>
      ) : selected.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center border-dashed bg-muted/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <GitCompare className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-semibold">No projects selected for comparison</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add up to 4 projects to compare them side by side across key metrics
            </p>
          </div>
          <Button onClick={() => setShowPicker(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Project
          </Button>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider w-[200px] align-top">
                  Metric
                </th>
                {selected.map((project) => (
                  <th key={project.id} className="p-4 min-w-[280px] align-top">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate leading-tight" title={project.name}>{project.name}</p>
                          <Badge variant="secondary" className="mt-1.5 text-xs font-medium bg-background border border-border/50">
                            {PROJECT_TYPE_LABELS[project.project_type]}
                          </Badge>
                        </div>
                        <button onClick={() => removeProject(project.id)} className="text-muted-foreground hover:text-destructive shrink-0 transition-colors bg-background rounded-full p-1 border">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                const values = selected.map((p) => metric.format(p));
                // Very basic 'best' highlight logic (only works if sorting numbers descending is always better)
                let best: string | null = null;
                if (['target_carbon_tonnes', 'health_score', 'area_hectares'].includes(metric.key)) {
                  const nums = values.map(v => v ? parseFloat(v.replace(/,/g, '')) : 0);
                  const max = Math.max(...nums.filter(n => !isNaN(n)));
                  if (max > 0) {
                     best = values.find(v => v && parseFloat(v.replace(/,/g, '')) === max) || null;
                  }
                }
                
                return (
                  <tr key={metric.key} className="transition-colors hover:bg-muted/10">
                    <td className="p-4 bg-muted/5 font-medium">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground/70" />
                        <span className="text-sm text-foreground/80">{metric.label}</span>
                      </div>
                    </td>
                    {selected.map((project) => {
                      const value = metric.format(project);
                      const isBest = best && value === best;
                      return (
                        <td key={project.id} className="p-4 text-sm">
                          <span className={cn(
                            isBest ? 'font-semibold text-primary bg-primary/10 px-2 py-1 rounded-md' : 'text-muted-foreground'
                          )}>
                            {value || '—'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Visual Comparison Charts */}
      {selected.length >= 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-sm flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" /> Area Comparison</h3>
            <div className="space-y-4">
              {selected.map((project) => {
                const area = project.area_hectares || 0;
                const maxArea = Math.max(...selected.map((p) => p.area_hectares || 0), 1);
                return (
                  <div key={project.id}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="truncate font-medium pr-4">{project.name}</span>
                      <span className="text-muted-foreground font-semibold">{area.toLocaleString()} ha</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${(area / maxArea) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" /> Carbon Target Comparison</h3>
            <div className="space-y-4">
              {selected.map((project) => {
                const carbon = project.target_carbon_tonnes || 0;
                const maxCarbon = Math.max(...selected.map((p) => p.target_carbon_tonnes || 0), 1);
                return (
                  <div key={project.id}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="truncate font-medium pr-4">{project.name}</span>
                      <span className="text-muted-foreground font-semibold">{carbon.toLocaleString()} t</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-success transition-all duration-1000" style={{ width: `${(carbon / maxCarbon) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
