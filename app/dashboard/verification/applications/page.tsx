'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, ArrowRight, Clock, FileText, Shield, CheckCircle2, Eye, ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApplications, getAgencyForProfile } from '@/lib/voc-services';
import { useAuth } from '@/components/providers/auth-provider';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  type VerificationApplication,
} from '@/lib/voc-types';

const STATUS_ICONS: Record<string, React.ReactNode> = {
  draft: <FileText className="h-4 w-4" />,
  submitted: <ClipboardCheck className="h-4 w-4" />,
  under_review: <Eye className="h-4 w-4" />,
  audit_scheduled: <Clock className="h-4 w-4" />,
  audit_completed: <CheckCircle2 className="h-4 w-4" />,
  approved: <Shield className="h-4 w-4" />,
  returned_for_revision: <FileText className="h-4 w-4" />,
  rejected: <FileText className="h-4 w-4" />,
};

export default function VerificationApplicationsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const [allApplications, setAllApplications] = React.useState<import('@/lib/voc-types').VerificationApplication[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await getApplications();
      if (!cancelled) {
        if (!profile) {
          setAllApplications(all);
        } else {
          const agency = await getAgencyForProfile(profile.id);
          if (!cancelled) {
            setAllApplications(agency ? all.filter(app => app.verification_agency_id === agency.id) : all);
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [profile]);

  const filtered = React.useMemo(() => {
    return allApplications.filter(app => {
      const matchesSearch = search === '' ||
        app.application_number.toLowerCase().includes(search.toLowerCase()) ||
        app.project_name.toLowerCase().includes(search.toLowerCase()) ||
        app.project_owner_name.toLowerCase().includes(search.toLowerCase()) ||
        app.ngo_name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [allApplications, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Verification Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">All verification applications submitted for certification.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search applications..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="audit_scheduled">Audit Scheduled</SelectItem>
            <SelectItem value="audit_completed">Audit Completed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="returned_for_revision">Returned for Revision</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} application{filtered.length !== 1 ? 's' : ''} found</p>

      <div className="space-y-3">
        {filtered.map((app) => (
          <Card key={app.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/dashboard/verification/workspace/${app.id}`)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  {STATUS_ICONS[app.status] || <FileText className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{app.application_number}</span>
                    <Badge className={cn('text-[10px]', APPLICATION_STATUS_COLORS[app.status])}>
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold mt-1">{app.project_name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>Owner: {app.project_owner_name}</span>
                    <span>NGO: {app.ngo_name}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(app.submitted_date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{app.snapshot?.description}</p>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0">
                  Open Application <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No applications match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
