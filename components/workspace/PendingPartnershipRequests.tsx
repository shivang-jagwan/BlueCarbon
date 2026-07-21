'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { sendNotification } from '@/lib/voc-services';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Clock, Coins, Calendar, MessageSquare,
  CheckCircle2, XCircle, Loader2, Handshake,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PendingRequest {
  id: string;
  project_id: string;
  company_id: string;
  company_name: string;
  company_org: string | null;
  service_type: string;
  start_date: string | null;
  budget_usd: number | null;
  message: string | null;
  created_at: string;
}

const SERVICE_LABELS: Record<string, string> = {
  monthly: 'Monthly Monitoring',
  quarterly: 'Quarterly Monitoring',
  annual: 'Annual Monitoring',
  lifecycle: 'Full Lifecycle',
};

export function PendingPartnershipRequests({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [requests, setRequests] = React.useState<PendingRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actingId, setActingId] = React.useState<string | null>(null);

  const loadRequests = React.useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('project_partnerships')
      .select('id, project_id, company_id, company:profiles!project_partnerships_company_id_fkey(full_name, organization), service_type, start_date, budget_usd, message, created_at')
      .eq('project_id', projectId)
      .eq('status', 'pending_owner')
      .order('created_at', { ascending: false });

    if (data) {
      setRequests(data.map((r: any) => ({
        id: r.id,
        project_id: r.project_id,
        company_id: r.company_id,
        company_name: r.company?.full_name || 'Unknown Company',
        company_org: r.company?.organization || null,
        service_type: r.service_type,
        start_date: r.start_date,
        budget_usd: r.budget_usd,
        message: r.message,
        created_at: r.created_at,
      })));
    }
    setLoading(false);
  }, [user, projectId]);

  React.useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleAccept = async (req: PendingRequest) => {
    setActingId(req.id);
    try {
      const { error } = await supabase
        .from('project_partnerships')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', req.id);

      if (error) throw error;

      await supabase.from('project_activity').insert({
        project_id: projectId,
        actor_id: user?.id,
        event_type: 'partnership_established',
        title: 'Partnership Accepted',
        description: `Accepted monitoring partnership with ${req.company_name}`,
      });

      await sendNotification({
        title: 'Partnership Accepted',
        body: `Your monitoring partnership request for this project has been accepted.`,
        type: 'partnership_accepted',
        targetUserId: req.company_id,
        link: `/dashboard/projects/${projectId}`,
      });

      toast.success('Partnership accepted.');
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (req: PendingRequest) => {
    setActingId(req.id);
    try {
      const { error } = await supabase
        .from('project_partnerships')
        .update({ status: 'rejected' })
        .eq('id', req.id);

      if (error) throw error;

      await supabase.from('project_activity').insert({
        project_id: projectId,
        actor_id: user?.id,
        event_type: 'partnership_terminated',
        title: 'Partnership Rejected',
        description: `Rejected monitoring partnership request from ${req.company_name}`,
      });

      await sendNotification({
        title: 'Partnership Rejected',
        body: `Your monitoring partnership request has been declined.`,
        type: 'verification',
        targetUserId: req.company_id,
        link: `/dashboard/projects/${projectId}`,
      });

      toast.success('Request rejected.');
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setActingId(null);
    }
  };

  if (loading || requests.length === 0) return null;

  return (
    <Card className="p-6 shadow-sm border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/10">
      <div className="flex items-center gap-2 mb-4">
        <Handshake className="h-5 w-5 text-amber-600" />
        <h2 className="font-display text-base font-semibold">Partnership Requests</h2>
        <Badge className="ml-1 bg-amber-100 text-amber-700 border-amber-200 text-[10px]">{requests.length}</Badge>
      </div>

      <div className="space-y-3">
        {requests.map(req => (
          <div
            key={req.id}
            className="p-4 rounded-xl border border-amber-200/60 bg-white dark:bg-slate-900 dark:border-amber-800/30 space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Building2 className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{req.company_name}</p>
                {req.company_org && (
                  <p className="text-xs text-muted-foreground">{req.company_org}</p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {SERVICE_LABELS[req.service_type] || req.service_type}
              </span>
              {req.budget_usd && (
                <span className="flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  ${req.budget_usd.toLocaleString()}
                </span>
              )}
              {req.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(req.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>

            {req.message && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
                <p className="line-clamp-3">{req.message}</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleAccept(req)}
                disabled={actingId === req.id}
              >
                {actingId === req.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept</>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleReject(req)}
                disabled={actingId === req.id}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" /> Decline
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
