'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, ExternalLink, Archive, Ban, Trash2, MapPin, Activity, Loader2, Download, TreePine } from 'lucide-react';
import { ProjectStatus } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { usePagination } from '@/hooks/use-pagination';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const statusColor = (status: ProjectStatus) => {
  switch (status) {
    case 'verified':
      return 'bg-success/10 text-success hover:bg-success/20';
    case 'in_verification':
      return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
    case 'active':
      return 'bg-primary/10 text-primary hover:bg-primary/20';
    case 'rejected':
      return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
    case 'draft':
    default:
      return 'bg-muted text-muted-foreground hover:bg-muted/80';
  }
};

type ProjectWithProfile = {
  id: string;
  name: string;
  status: ProjectStatus;
  location_lat: number | null;
  location_lng: number | null;
  area_hectares: number | null;
  health_score: number | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    organization: string | null;
  } | null;
};

export default function ProjectManagementPage() {
  const [projects, setProjects] = React.useState<ProjectWithProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, status, location_lat, location_lng, area_hectares, health_score, created_at, profiles:owner_id(full_name, organization)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load projects: ' + error.message);
    } else {
      setProjects(data as unknown as ProjectWithProfile[]);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchProjects();
  }, []);

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
        
      if (error) throw error;
      toast.success(`Project status updated to ${newStatus}`);
      fetchProjects();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredProjects = projects.filter((p) => {
    const nameStr = (p.name || '').toLowerCase();
    const ownerStr = (p.profiles?.full_name || p.profiles?.organization || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return nameStr.includes(search) || ownerStr.includes(search);
  });

  const { page, totalPages, paginatedItems, setPage } = usePagination(filteredProjects, 20);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Project Management</h1>
          <p className="text-sm text-muted-foreground">Manage all blue carbon projects across the platform</p>
        </div>
        <Button variant="outline" onClick={fetchProjects}>
          <Download className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4 sm:px-6 sm:py-4 border-b border-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects or owners..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Additional filters can go here */}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead className="hidden sm:table-cell">Owner</TableHead>
                <TableHead className="hidden md:table-cell">Location & Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Health Score</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Loader2 className="mb-2 h-6 w-6 animate-spin" />
                      Loading projects...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <TreePine className="h-8 w-8 opacity-40" />
                      <p className="text-sm font-medium">No projects found</p>
                      <p className="text-xs">Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((proj) => {
                  const ownerName = proj.profiles?.organization || proj.profiles?.full_name || 'Unknown Owner';
                  const locationStr = proj.location_lat && proj.location_lng 
                    ? `${proj.location_lat.toFixed(2)}, ${proj.location_lng.toFixed(2)}` 
                    : 'Location TBD';
                  const areaStr = proj.area_hectares ? `${proj.area_hectares.toLocaleString()} ha` : 'Area TBD';

                  return (
                    <TableRow key={proj.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-primary hover:underline cursor-pointer">{proj.name}</span>
                          <span className="text-xs text-muted-foreground">{proj.id.substring(0, 8)}...</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm">{ownerName}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {locationStr}
                          </div>
                          <span className="text-xs font-medium">{areaStr}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColor(proj.status)}>
                          {proj.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {proj.health_score !== null ? (
                          <div className="flex items-center gap-2">
                            <Activity className={`h-4 w-4 ${proj.health_score > 80 ? 'text-success' : proj.health_score > 50 ? 'text-warning' : 'text-destructive'}`} />
                            <span className="font-medium text-sm">{proj.health_score}/100</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {proj.created_at ? format(new Date(proj.created_at), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem><ExternalLink className="mr-2 h-4 w-4" /> Open Workspace</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {proj.status !== 'rejected' && (
                              <DropdownMenuItem className="text-warning" onClick={() => handleStatusChange(proj.id, 'rejected')}>
                                <Ban className="mr-2 h-4 w-4" /> Reject/Suspend
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Project</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground hidden sm:block">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, filteredProjects.length)} of {filteredProjects.length} projects
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setPage(page - 1)} className={page === 1 ? 'pointer-events-none opacity-50' : ''} />
              </PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink isActive={pageNum === page} onClick={() => setPage(pageNum)}>
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext onClick={() => setPage(page + 1)} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
