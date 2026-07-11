'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  MapPin,
  Ruler,
  TrendingUp,
  Clock,
  Globe,
  Sprout,
} from 'lucide-react';
import Link from 'next/link';
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  statusColor,
  type Project,
  type ProjectType,
} from '@/lib/types';
import { cn } from '@/lib/utils';

export default function DiscoverPage() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('projects')
        .select('*')
        .in('status', ['verified', 'active', 'completed', 'in_verification'])
        .order('created_at', { ascending: false });
      setProjects((data as Project[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.location_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || p.project_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Project Discovery Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse verified blue carbon restoration projects seeking support
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Project type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((t) => (
              <SelectItem key={t} value={t}>{PROJECT_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="in_verification">In Verification</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Globe className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No projects found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No verified projects are available yet'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="group h-full overflow-hidden p-0 transition-all hover:shadow-soft-lg hover:border-primary/30">
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/15 to-accent/15">
                  <div className="absolute left-3 top-3 flex gap-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                      {PROJECT_TYPE_LABELS[project.project_type]}
                    </Badge>
                  </div>
                  <div className="absolute right-3 top-3">
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', statusColor(project.status))}>
                      {PROJECT_STATUS_LABELS[project.status]}
                    </span>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    {project.location_name && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {project.location_name}
                      </div>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3 w-3" />
                      {project.area_hectares ? `${project.area_hectares.toFixed(1)} ha` : '—'}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {project.target_carbon_tonnes ? `${project.target_carbon_tonnes} t target` : '—'}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
