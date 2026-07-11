'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { useVerificationRequests } from '@/hooks/use-projects';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Map,
  ClipboardCheck,
  Building2,
  CalendarDays,
  Clock,
  ArrowRight,
  Filter,
  Inbox,
} from 'lucide-react';
import {
  VERIFICATION_REQUEST_TYPE_LABELS,
  VERIF_REQUEST_STATUS_LABELS,
  verificationStatusColor,
  priorityColor,
  type VerificationRequestType,
} from '@/lib/types';
import { cn } from '@/lib/utils';

const TYPE_ICONS: Record<VerificationRequestType, React.ElementType> = {
  land: Map,
  project: ClipboardCheck,
  corporate: Building2,
  monthly: CalendarDays,
};

const TYPE_FILTERS = [
  { id: 'all', label: 'All Requests', icon: Inbox },
  { id: 'land', label: 'Land Verification', icon: Map },
  { id: 'project', label: 'Project Verification', icon: ClipboardCheck },
  { id: 'corporate', label: 'Corporate Verification', icon: Building2 },
  { id: 'monthly', label: 'Monthly Monitoring', icon: CalendarDays },
];

const STATUS_FILTERS = ['all', 'pending', 'in_review', 'approved', 'rejected', 'changes_requested'];

export default function VerificationCenterPage() {
  const { user } = useAuth();
  const { requests, loading, refetch } = useVerificationRequests(user?.id ?? null);
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const filtered = requests.filter((r) => {
    const matchesType = typeFilter === 'all' || r.request_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const handleStatusUpdate = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('verification_requests')
        .update({ status })
        .eq('id', requestId);
      if (error) throw error;
      toast.success(`Marked as ${status.replace('_', ' ')}`);
      refetch();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Verification Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unified inbox for all verification requests — land, project, corporate, and monthly monitoring
        </p>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = typeFilter === filter.id;
          const count = filter.id === 'all'
            ? requests.length
            : requests.filter((r) => r.request_type === filter.id).length;
          return (
            <button
              key={filter.id}
              onClick={() => setTypeFilter(filter.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {filter.label}
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                isActive ? 'bg-primary/20' : 'bg-muted'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No verification requests</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'New requests will appear here when projects are assigned'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const TypeIcon = TYPE_ICONS[req.request_type];
            return (
              <Card key={req.id} className="p-4 transition-all hover:shadow-soft">
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
                          {VERIFICATION_REQUEST_TYPE_LABELS[req.request_type]}
                        </h3>
                        {req.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{req.description}</p>
                        )}
                      </div>
                      <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', verificationStatusColor(req.status))}>
                        {VERIF_REQUEST_STATUS_LABELS[req.status]}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Created {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      {req.due_date && (
                        <span className={cn(
                          'flex items-center gap-1',
                          new Date(req.due_date) < new Date() && 'text-destructive font-medium'
                        )}>
                          <Clock className="h-3 w-3" />
                          Due {new Date(req.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-2">
                      <Button asChild size="sm" variant="default">
                        <Link href={`/dashboard/projects/${req.project_id}`}>
                          Open Project
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      {req.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(req.id, 'in_review')}
                        >
                          Start Review
                        </Button>
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
