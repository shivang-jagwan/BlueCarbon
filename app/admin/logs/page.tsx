'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Activity, Clock, ScrollText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { usePagination } from '@/hooks/use-pagination';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface LogEntry {
  id: string;
  user_name: string;
  action: string;
  details: string;
  type: string;
  created_at: string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('project_activity')
        .select('*, profiles:actor_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(100);

      const entries: LogEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        user_name: row.profiles?.full_name || 'System',
        action: row.event_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        details: row.title || row.description || '',
        type: row.event_type.includes('project') ? 'project' :
              row.event_type.includes('verif') ? 'verification' :
              row.event_type.includes('fund') ? 'funding' :
              row.event_type.includes('passport') ? 'passport' :
              row.event_type.includes('user') ? 'auth' : 'activity',
        created_at: row.created_at,
      }));

      setLogs(entries);
      setLoading(false);
    })();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const { page, totalPages, paginatedItems, setPage } = usePagination(filteredLogs, 25);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">System Activity Logs</h1>
        <p className="text-sm text-muted-foreground">Audit trail of platform events</p>
      </div>

      <Card>
        <CardHeader className="p-4 sm:px-6 sm:py-4 border-b border-border">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="project">Projects</SelectItem>
                <SelectItem value="verification">Verifications</SelectItem>
                <SelectItem value="funding">Support</SelectItem>
                <SelectItem value="passport">Passports</SelectItem>
                <SelectItem value="activity">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Clock className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ScrollText className="h-8 w-8 opacity-40" />
                    <p className="text-sm font-medium">No activity logs found</p>
                    <p className="text-xs">User activity will appear here as the platform is used</p>
                  </div>
                </TableCell>
              </TableRow>
              ) : (
                paginatedItems.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">{log.user_name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm">{log.action}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{log.details}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground hidden sm:block">
            Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, filteredLogs.length)} of {filteredLogs.length} logs
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
