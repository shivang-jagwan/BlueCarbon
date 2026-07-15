'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Clock,
  ArrowRight,
  ExternalLink,
  Map,
  ClipboardCheck,
  Building2,
  CalendarDays,
} from 'lucide-react';
import {
  VERIFICATION_REQUEST_TYPE_LABELS,
  VERIF_REQUEST_STATUS_LABELS,
  verificationStatusColor,
  priorityColor,
  type VerificationRequestType,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const TYPE_ICONS: Record<VerificationRequestType, React.ElementType> = {
  land: Map,
  project: ClipboardCheck,
  corporate: Building2,
  monthly: CalendarDays,
};

export default function ProjectVerificationPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('verification_service_requests')
        .select('*, profiles!verification_service_requests_verifier_id_fkey(full_name, organization)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (data) {
        setRequests(data);
      }
      setLoading(false);
    })();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Verification Status</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track verification requests and decisions for this project.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/verifiers">
            Find Verifiers
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No Verification Requests</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You haven&apos;t requested verification for this project yet.
              Browse the Verifier Directory to get started.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const TypeIcon = TYPE_ICONS[req.request_type as VerificationRequestType] || ShieldCheck;
            const verifierName = req.profiles?.full_name || req.profiles?.organization || 'Verifier';
            return (
              <Card key={req.id} className="p-5 transition-all hover:shadow-soft">
                <div className="flex items-start gap-4">
                  {/* Priority indicator */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div className={cn('h-3 w-3 rounded-full', priorityColor(req.priority))} />
                    <span className="text-[10px] font-medium text-muted-foreground capitalize">
                      {req.priority}
                    </span>
                  </div>

                  {/* Type icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <TypeIcon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold leading-tight">
                          {VERIFICATION_REQUEST_TYPE_LABELS[req.request_type as VerificationRequestType] || req.request_type} Verification
                        </h3>
                        <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                          Requested from <Link href={`/dashboard/verifiers/${req.verifier_id}`} className="text-primary hover:underline">{verifierName}</Link>
                        </p>
                      </div>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', verificationStatusColor(req.status))}>
                        {VERIF_REQUEST_STATUS_LABELS[req.status as keyof typeof VERIF_REQUEST_STATUS_LABELS] || req.status}
                      </span>
                    </div>

                    {req.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{req.description}</p>
                    )}

                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
                      <span>Submitted on {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {req.due_date && (
                        <span className={cn(
                          'flex items-center gap-1',
                          new Date(req.due_date) < new Date() && 'text-destructive font-medium'
                        )}>
                          <Clock className="h-3 w-3" />
                          Target Due: {new Date(req.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
