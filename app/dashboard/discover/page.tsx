'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SaveProjectButton } from '@/components/shared/SaveProjectButton';
import { FollowProjectButton } from '@/components/shared/FollowProjectButton';
import {
  Search,
  MapPin,
  Ruler,
  Clock,
  Globe,
  HeartPulse,
  ShieldCheck,
  Filter,
  BarChart3,
  GitCompare
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  statusColor,
  type Project,
  type ProjectType,
  type ProjectStatus,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { usePagination } from '@/hooks/use-pagination';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

type ProjectWithProfile = Project & {
  profiles?: {
    full_name: string | null;
    organization: string | null;
    state: string | null;
    district: string | null;
  } | null;
  isPartnered: boolean;
};

export default function DiscoverPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = React.useState<ProjectWithProfile[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [countryFilter, setCountryFilter] = React.useState('all');

  const [sortBy, setSortBy] = React.useState('newest');

  const [compareIds, setCompareIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*, profiles!owner_id(full_name, organization, state, district)')
        .in('status', ['registered', 'verified', 'active', 'completed', 'in_verification']);

      const { data: activePartnerships } = await supabase
        .from('project_partnerships')
        .select('project_id')
        .eq('status', 'active');

      const partneredIds = new Set((activePartnerships || []).map((p: { project_id: string }) => p.project_id));

      const enriched = ((projectsData as ProjectWithProfile[]) || []).map((p) => ({
        ...p,
        isPartnered: partneredIds.has(p.id),
      }));

      setProjects(enriched);
      setLoading(false);
    })();
  }, []);

  const uniqueCountries = Array.from(new Set(projects.map(p => p.country).filter(Boolean))) as string[];

  // Single reusable discovery filter — used by stats, cards, search, and map
  const discoverableProjects = React.useMemo(() => {
    return projects.filter((p) => {
      if (p.isPartnered) return false;

      const hasValidStatus = ['verified', 'active', 'completed'].includes(p.status);
      const hasPassport = p.passport_issued_at !== null;
      if (!hasValidStatus && !hasPassport) return false;

      return true;
    });
  }, [projects]);

  const filtered = discoverableProjects.filter((p) => {
    const ownerName = p.profiles?.organization || p.profiles?.full_name || '';
    const state = p.profiles?.state || '';
    const district = p.profiles?.district || '';

    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.location_name || '').toLowerCase().includes(search.toLowerCase()) ||
      state.toLowerCase().includes(search.toLowerCase()) ||
      district.toLowerCase().includes(search.toLowerCase()) ||
      ownerName.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'all' || p.project_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesCountry = countryFilter === 'all' || p.country === countryFilter;

    return matchesSearch && matchesType && matchesStatus && matchesCountry;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'carbon_potential':
        return (b.target_carbon_tonnes || 0) - (a.target_carbon_tonnes || 0);
      case 'health':
        return (b.health_score || 0) - (a.health_score || 0);
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const { page: projPage, totalPages: projTotalPages, paginatedItems: paginatedProjects, setPage: setProjPage } = usePagination(sorted, 9);

  const totalProjects = discoverableProjects.length;
  const verifiedProjects = discoverableProjects.filter(p => p.status === 'verified').length;
  const avgCarbon = discoverableProjects.length > 0
    ? Math.round(discoverableProjects.reduce((acc, p) => acc + (p.target_carbon_tonnes || 0), 0) / discoverableProjects.length)
    : 0;

  const handleCompareToggle = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const getCustomStatusBadge = (project: ProjectWithProfile) => {
    if (project.status === 'active') return <Badge className="bg-indigo-500 hover:bg-indigo-600 border-0 text-white">Monitoring Active</Badge>;
    if (project.status === 'completed') return <Badge className="bg-primary hover:bg-primary border-0 text-white">Completed</Badge>;
    return (
      <Badge className={cn('shadow-sm text-white border-0', statusColor(project.status as ProjectStatus))}>
        {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
      </Badge>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Project Discovery Hub</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and evaluate verified blue carbon restoration projects around the globe.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex flex-col justify-center bg-card shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Globe className="h-4 w-4" />
            <h3 className="text-sm font-medium">Available Projects</h3>
          </div>
          <p className="text-2xl font-display font-bold">{totalProjects}</p>
        </Card>
        <Card className="p-4 flex flex-col justify-center bg-card shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ShieldCheck className="h-4 w-4" />
            <h3 className="text-sm font-medium">Verified Projects</h3>
          </div>
          <p className="text-2xl font-display font-bold">{verifiedProjects}</p>
        </Card>
        <Card className="p-4 flex flex-col justify-center bg-card shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="h-4 w-4" />
            <h3 className="text-sm font-medium">Avg Carbon Potential</h3>
          </div>
          <p className="text-2xl font-display font-bold">{avgCarbon.toLocaleString()} t</p>
        </Card>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-4 rounded-xl shadow-sm border border-border/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by project, owner, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border-r pr-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ecosystems</SelectItem>
                {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((t) => (
                  <SelectItem key={t} value={t}>{PROJECT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="in_verification">In Verification</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {uniqueCountries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="carbon_potential">Highest Carbon Potential</SelectItem>
              <SelectItem value="health">Highest Health Score</SelectItem>
              <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Clock className="h-8 w-8 animate-spin" />
            <p>Loading projects...</p>
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-16 text-center border-dashed bg-muted/30">
          <div className="rounded-full bg-background p-4 shadow-sm">
            <Globe className="h-10 w-10 text-muted-foreground/60" />
          </div>
          <div className="max-w-sm">
            <h3 className="font-semibold text-lg">No projects found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {search || typeFilter !== 'all' || statusFilter !== 'all' || countryFilter !== 'all'
                ? 'Try adjusting your filters or search query to find more projects.'
                : 'No projects are currently available for discovery.'}
            </p>
          </div>
          {(search || typeFilter !== 'all' || statusFilter !== 'all' || countryFilter !== 'all') && (
            <Button variant="outline" onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setCountryFilter('all'); }} className="mt-2">
              Clear all filters
            </Button>
          )}
        </Card>
      ) : (
        <>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedProjects.map((project) => {
            const ownerName = project.profiles?.organization || project.profiles?.full_name || 'Unknown Owner';
            const isVerifiedOrHigher = ['verified', 'active', 'completed'].includes(project.status);
            const hasPassport = project.passport_issued_at !== null;
            const isAvailable = !project.isPartnered;

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
                    {getCustomStatusBadge(project)}
                    {profile?.role === 'sustainability_partner' && (
                      <>
                        <FollowProjectButton projectId={project.id} size="icon" variant="secondary" className="h-8 w-8 bg-background/90 hover:bg-background backdrop-blur border-0 shadow-sm rounded-full" showText={false} />
                        <SaveProjectButton projectId={project.id} size="icon" variant="secondary" className="h-8 w-8 bg-background/90 hover:bg-background backdrop-blur border-0 shadow-sm rounded-full" showText={false} />
                      </>
                    )}
                  </div>

                  <div className="absolute top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm border border-border/50">
                    <Checkbox
                      id={`compare-${project.id}`}
                      checked={compareIds.includes(project.id)}
                      onCheckedChange={() => handleCompareToggle(project.id)}
                      disabled={!compareIds.includes(project.id) && compareIds.length >= 3}
                    />
                    <label htmlFor={`compare-${project.id}`} className="text-xs font-medium cursor-pointer">
                      Compare
                    </label>
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
                    {project.health_score !== null && project.health_score > 0 && (
                      <div className="flex flex-col items-end">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5 flex items-center gap-1"><HeartPulse className="h-3 w-3" /> Health</p>
                        <p className={cn("text-sm font-semibold", project.health_score > 80 ? "text-success" : project.health_score > 50 ? "text-warning" : "text-destructive")}>{project.health_score}/100</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {isVerifiedOrHigher && (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 border-0 text-white text-[10px] px-2 py-0.5">
                        Verified
                      </Badge>
                    )}
                    <Badge className="bg-sky-500 hover:bg-sky-600 border-0 text-white text-[10px] px-2 py-0.5">
                      Blue Carbon
                    </Badge>
                    {hasPassport && (
                      <Badge className="bg-purple-500 hover:bg-purple-600 border-0 text-white text-[10px] px-2 py-0.5">
                        Carbon Passport
                      </Badge>
                    )}
                    {isAvailable && (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 border-0 text-white text-[10px] px-2 py-0.5">
                        Available
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 flex-1">
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                        <MapPin className="h-3.5 w-3.5" /> Project Type
                      </p>
                      <p className="text-sm font-medium">
                        {project.project_type || 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                        <Ruler className="h-3.5 w-3.5" /> Project Area
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

        {projTotalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Page {projPage} of {projTotalPages} ({sorted.length} projects)
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => setProjPage(projPage - 1)} className={projPage === 1 ? 'pointer-events-none opacity-50' : ''} />
                </PaginationItem>
                {Array.from({ length: Math.min(projTotalPages, 5) }, (_, i) => {
                  const pageNum = projTotalPages <= 5 ? i + 1 : Math.max(1, Math.min(projPage - 2, projTotalPages - 4)) + i;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink isActive={pageNum === projPage} onClick={() => setProjPage(pageNum)}>
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext onClick={() => setProjPage(projPage + 1)} className={projPage === projTotalPages ? 'pointer-events-none opacity-50' : ''} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
        </>
      )}

      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-background border border-border shadow-soft-xl rounded-full px-6 py-3 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                {compareIds.length}
              </span>
              <span className="text-sm font-medium">Projects Selected</span>
              <span className="text-xs text-muted-foreground ml-1">(Max 3)</span>
            </div>
            <div className="flex items-center gap-3 border-l pl-6">
              <Button variant="ghost" size="sm" onClick={() => setCompareIds([])}>
                Clear
              </Button>
              <Button size="sm" onClick={() => router.push(`/dashboard/compare?ids=${compareIds.join(',')}`)}>
                <GitCompare className="h-4 w-4 mr-2" />
                Compare Projects
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
