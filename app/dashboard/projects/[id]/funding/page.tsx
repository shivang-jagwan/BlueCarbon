'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useFunding } from '@/hooks/use-projects';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, HandHeart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    completed: 'bg-success/10 text-success',
    terminated: 'bg-destructive/10 text-destructive',
  };
  return map[status] || 'bg-muted text-muted-foreground';
}

export default function FundingPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { contributions, loading } = useFunding(projectId);

  const totalFunding = contributions
    .filter((c) => c.status === 'completed')
    .reduce((s, c) => s + c.amount_usd, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage support requests and track partner contributions
          </p>
        </div>
        <Button>
          <HandHeart className="mr-2 h-4 w-4" />
          Request Support
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Received</p>
              <p className="font-display text-xl font-semibold">${totalFunding.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="font-display text-xl font-semibold">
                ${contributions.filter((c) => c.status === 'pending').reduce((s, c) => s + c.amount_usd, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Supporters</p>
              <p className="font-display text-xl font-semibold">
                {new Set(contributions.map((c) => c.partner_id)).size}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Contributions */}
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Support Contributions</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : contributions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <HandHeart className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium">No support yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a support request to attract sustainability partners
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {contributions.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">${c.amount_usd.toLocaleString()}</p>
                    {c.carbon_credits_tonnes && (
                      <p className="text-xs text-muted-foreground">{c.carbon_credits_tonnes} t credits</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', statusBadge(c.status))}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
