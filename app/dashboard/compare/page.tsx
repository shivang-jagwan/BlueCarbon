'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitCompare, X, Plus, Clock, TrendingUp, Ruler, Leaf, ShieldCheck, Award, MapPin } from 'lucide-react';
import {
  PROJECT_TYPE_LABELS, PROJECT_STATUS_LABELS, VERIFICATION_STATUS_LABELS,
  statusColor, type Project,
} from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ComparePage() {
  const [allProjects, setAllProjects] = React.useState<Project[]>([]);
  const [selected, setSelected] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showPicker, setShowPicker] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('projects')
        .select('*')
        .in('status', ['verified', 'active', 'completed', 'in_verification'])
        .order('created_at', { ascending: false });
      setAllProjects((data as Project[]) || []);
      setLoading(false);
    })();
  }, []);

  const addProject = (project: Project) => {
    if (selected.length >= 4 || selected.find((p) => p.id === project.id)) return;
    setSelected([...selected, project]);
    setShowPicker(false);
  };

  const removeProject = (id: string) => {
    setSelected(selected.filter((p) => p.id !== id));
  };

  const availableProjects = allProjects.filter(
    (p) => !selected.find((s) => s.id === p.id)
  );

  const metrics: Array<{ label: string; key: string; icon: any; format: (p: Project) => string | null }> = [
    { label: 'Project Type', key: 'project_type', icon: Leaf, format: (p) => PROJECT_TYPE_LABELS[p.project_type] },
    { label: 'Status', key: 'status', icon: ShieldCheck, format: (p) => PROJECT_STATUS_LABELS[p.status] },
    { label: 'Area', key: 'area_hectares', icon: Ruler, format: (p) => p.area_hectares ? `${p.area_hectares.toFixed(1)} ha` : '—' },
    { label: 'Carbon Target', key: 'target_carbon_tonnes', icon: TrendingUp, format: (p) => p.target_carbon_tonnes ? `${p.target_carbon_tonnes} t` : '—' },
    { label: 'Health Score', key: 'health_score', icon: Award, format: (p) => p.health_score ? `${p.health_score}/100` : '—' },
    { label: 'Verification', key: 'verification_status', icon: ShieldCheck, format: (p) => VERIFICATION_STATUS_LABELS[p.verification_status] },
    { label: 'Location', key: 'location_name', icon: MapPin, format: (p) => p.location_name || '—' },
    { label: 'Duration', key: 'expected_duration_months', icon: Clock, format: (p) => p.expected_duration_months ? `${p.expected_duration_months} months` : '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Project Comparison</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare up to 4 projects side by side to make informed funding decisions
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
        <Card className="p-4 animate-fade-in">
          <h3 className="mb-3 text-sm font-semibold">Select a project to compare</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Clock className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : availableProjects.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No more projects available to compare</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {availableProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => addProject(project)}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                    {PROJECT_TYPE_LABELS[project.project_type]?.[0] || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.location_name || 'No location'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Comparison Table */}
      {selected.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
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
        <Card className="overflow-x-auto p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left text-xs font-medium text-muted-foreground">Metric</th>
                {selected.map((project) => (
                  <th key={project.id} className="p-4 text-left min-w-48">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{project.name}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">{PROJECT_TYPE_LABELS[project.project_type]}</Badge>
                      </div>
                      <button onClick={() => removeProject(project.id)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => {
                const Icon = metric.icon;
                const values = selected.map((p) => metric.format(p));
                const best = values.filter((v) => v && v !== '—').length > 1 ? values.filter((v) => v && v !== '—').sort()[0] : null;
                return (
                  <tr key={metric.key} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{metric.label}</span>
                      </div>
                    </td>
                    {selected.map((project) => {
                      const value = metric.format(project);
                      const isBest = best && value === best;
                      return (
                        <td key={project.id} className="p-4">
                          <span className={cn('text-sm', isBest && 'font-semibold text-success')}>
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
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Area Comparison</h3>
            <div className="space-y-3">
              {selected.map((project) => {
                const area = project.area_hectares || 0;
                const maxArea = Math.max(...selected.map((p) => p.area_hectares || 0), 1);
                return (
                  <div key={project.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="truncate font-medium">{project.name}</span>
                      <span className="text-muted-foreground">{area.toFixed(1)} ha</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(area / maxArea) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Carbon Target Comparison</h3>
            <div className="space-y-3">
              {selected.map((project) => {
                const carbon = project.target_carbon_tonnes || 0;
                const maxCarbon = Math.max(...selected.map((p) => p.target_carbon_tonnes || 0), 1);
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
          </Card>
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Health Score Comparison</h3>
            <div className="space-y-3">
              {selected.map((project) => {
                const score = project.health_score || 0;
                return (
                  <div key={project.id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="truncate font-medium">{project.name}</span>
                      <span className="text-muted-foreground">{score}/100</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={cn('h-full rounded-full', score >= 70 ? 'bg-success' : score >= 40 ? 'bg-warning' : 'bg-destructive')} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="mb-4 font-semibold">Verification Status</h3>
            <div className="space-y-3">
              {selected.map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium">{project.name}</span>
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusColor(project.status))}>
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
