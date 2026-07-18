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
  Inbox, Search, Clock, CheckCircle2, XCircle, Eye, ArrowRight,
  Building2, FileText, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getAgencyForProfile,
  getVerificationRequests,
  acceptAgencyRequest,
  declineAgencyRequest,
} from '@/lib/voc-services';
import {
  AGENCY_REQUEST_STATUS_LABELS,
  AGENCY_REQUEST_STATUS_COLORS,
  AGENCY_VERIFICATION_STATUS_LABELS,
  AGENCY_VERIFICATION_STATUS_COLORS,
  type VerificationRequest,
} from '@/lib/voc-types';

export default function VerificationInboxPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [requests, setRequests] = React.useState<VerificationRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [agencyId, setAgencyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!profile) return;
      const agency = await getAgencyForProfile(profile.id);
      if (cancelled) return;
      if (agency) {
        setAgencyId(agency.id);
        const allRequests = await getVerificationRequests();
        if (!cancelled) {
          const agencyRequests = allRequests.filter(r =>
            r.selectedAgencies.some(a => a.agencyId === agency.id),
          );
          setRequests(agencyRequests);
        }
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [profile]);

  const handleAccept = async (req: VerificationRequest) => {
    if (!agencyId) return;
    const agencyReq = req.selectedAgencies.find(a => a.agencyId === agencyId);
    if (!agencyReq) return;
    try {
      await acceptAgencyRequest(req.id, agencyId, agencyReq.agencyName);
      toast.success('Request accepted');
      setRequests(prev => prev.map(r => {
        if (r.id !== req.id) return r;
        return {
          ...r,
          selectedAgencies: r.selectedAgencies.map(a =>
            a.agencyId === agencyId ? { ...a, requestStatus: 'accepted' as const } : a,
          ),
        };
      }));
    } catch {
      toast.error('Failed to accept request');
    }
  };

  const handleDecline = async (req: VerificationRequest) => {
    if (!agencyId) return;
    const agencyReq = req.selectedAgencies.find(a => a.agencyId === agencyId);
    if (!agencyReq) return;
    try {
      await declineAgencyRequest(req.id, agencyId, agencyReq.agencyName);
      toast.success('Request declined');
      setRequests(prev => prev.map(r => {
        if (r.id !== req.id) return r;
        return {
          ...r,
          selectedAgencies: r.selectedAgencies.map(a =>
            a.agencyId === agencyId ? { ...a, requestStatus: 'declined' as const } : a,
          ),
        };
      }));
    } catch {
      toast.error('Failed to decline request');
    }
  };

  const filtered = React.useMemo(() => {
    return requests.filter(req => {
      const myAgency = req.selectedAgencies.find(a => a.agencyId === agencyId);
      if (!myAgency) return false;

      const matchesSearch = search === '' ||
        req.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
        req.projectName.toLowerCase().includes(search.toLowerCase()) ||
        req.projectOwnerName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || myAgency.requestStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter, agencyId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Inbox className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Request Inbox</h1>
            <p className="text-sm text-muted-foreground">Loading requests...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Inbox className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Request Inbox</h1>
          <p className="text-sm text-muted-foreground">Incoming verification requests from project owners.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search requests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="sent">Invitation Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</p>

      <div className="space-y-3">
        {filtered.map((req) => {
          const myAgency = req.selectedAgencies.find(a => a.agencyId === agencyId);
          if (!myAgency) return null;

          return (
            <Card key={req.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{req.requestNumber}</span>
                      <Badge className={cn('text-[10px]', AGENCY_REQUEST_STATUS_COLORS[myAgency.requestStatus])}>
                        {AGENCY_REQUEST_STATUS_LABELS[myAgency.requestStatus]}
                      </Badge>
                      <Badge variant="outline" className={cn('text-[10px]', AGENCY_VERIFICATION_STATUS_COLORS[myAgency.verificationStatus])}>
                        {AGENCY_VERIFICATION_STATUS_LABELS[myAgency.verificationStatus]}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold mt-1">{req.projectName}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Owner: {req.projectOwnerName}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {myAgency.requestStatus === 'sent' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleAccept(req)} className="gap-1 text-emerald-600 hover:text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDecline(req)} className="gap-1 text-red-600 hover:text-red-700">
                          <XCircle className="h-3.5 w-3.5" /> Decline
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const agencyReq = req.selectedAgencies.find(a => a.agencyId === agencyId);
                        if (agencyReq?.requestStatus === 'accepted') {
                          router.push(`/dashboard/verification/workspace/${req.id}`);
                        }
                      }}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Inbox className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No requests in your inbox.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Requests from project owners will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
