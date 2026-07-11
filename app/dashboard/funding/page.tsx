'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign, Clock, HandHeart, TrendingUp, CheckCircle2, XCircle,
  AlertCircle, FileText, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { FundingContribution, Project } from '@/lib/types';

export default function FundingCenterPage() {
  const { user } = useAuth();
  const [contributions, setContributions] = React.useState<FundingContribution[]>([]);
  const [projects, setProjects] = React.useState<Record<string, Project>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('funding_contributions')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });
      const contribs = (data as FundingContribution[]) || [];
      setContributions(contribs);

      if (contribs.length > 0) {
        const projectIds = Array.from(new Set(contribs.map((c) => c.project_id)));
        const { data: projData } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds);
        const projMap: Record<string, Project> = {};
        (projData as Project[] || []).forEach((p) => { projMap[p.id] = p; });
        setProjects(projMap);
      }
      setLoading(false);
    })();
  }, [user]);

  const totalFunded = contributions.filter((c) => c.status === 'completed').reduce((s, c) => s + c.amount_usd, 0);
  const totalPledged = contributions.filter((c) => c.status === 'pledged').reduce((s, c) => s + c.amount_usd, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Funding Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Support verified restoration projects and track your funding portfolio
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success"><DollarSign className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Total Funded</p><p className="font-display text-xl font-semibold">${totalFunded.toLocaleString()}</p></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><Clock className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Pledged</p><p className="font-display text-xl font-semibold">${totalPledged.toLocaleString()}</p></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><TrendingUp className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Projects Supported</p><p className="font-display text-xl font-semibold">{new Set(contributions.map((c) => c.project_id)).size}</p></div>
          </div>
        </Card>
      </div>

      {/* Discover CTA */}
      <Card className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
        <div>
          <h2 className="font-semibold">Looking for projects to support?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Browse verified restoration projects seeking funding</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/discover">Discover Projects<ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </Card>

      {/* Funding History */}
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Funding History</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Clock className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : contributions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <HandHeart className="h-10 w-10 text-muted-foreground/40" />
            <div><p className="font-medium">No funding yet</p><p className="mt-1 text-sm text-muted-foreground">Start supporting projects from the discovery hub</p></div>
          </div>
        ) : (
          <div className="space-y-2">
            {contributions.map((c) => {
              const project = projects[c.project_id];
              return (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><DollarSign className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-medium">${c.amount_usd.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{project?.name || 'Unknown project'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <Badge variant="secondary" className={cn('capitalize', c.status === 'completed' ? 'bg-success/10 text-success' : c.status === 'pledged' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-destructive/10 text-destructive')}>
                      {c.status}
                    </Badge>
                    {project && (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/projects/${project.id}`}>View<ArrowRight className="ml-1 h-3 w-3" /></Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
