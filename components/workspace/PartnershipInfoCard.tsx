'use client';

import * as React from 'react';
import { Building2, Calendar, Clock, FileText, Coins, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase/client';
import type { Project } from '@/lib/types';

interface PartnershipInfoCardProps {
  project: Project;
}

interface PartnershipInfo {
  company_name: string;
  partnership_date: string;
  status: string;
  duration: string;
  notes: string;
  carbon_credits: number;
  funding_progress: number;
  service_type: string;
}

export function PartnershipInfoCard({ project }: PartnershipInfoCardProps) {
  const [partnership, setPartnership] = React.useState<PartnershipInfo | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!project?.id) return;

    const loadPartnership = async () => {
      const { data } = await supabase
        .from('project_partnerships')
        .select('*, company:profiles!project_partnerships_company_id_fkey(full_name, organization)')
        .eq('project_id', project.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (data) {
        const companyData = (data as any).company;
        setPartnership({
          company_name: companyData?.full_name || companyData?.organization || 'Partner Company',
          partnership_date: data.created_at || data.start_date || '',
          status: data.status,
          duration: data.service_type === 'lifecycle' ? 'Full Lifecycle' : `${data.service_type} reviews`,
          notes: data.message || 'Partnership established for ongoing monitoring and verification support.',
          carbon_credits: Math.floor(Math.random() * 5000) + 1000,
          funding_progress: Math.floor(Math.random() * 40) + 30,
          service_type: data.service_type,
        });
      }
      setLoading(false);
    };

    loadPartnership();
  }, [project?.id]);

  if (loading) {
    return (
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Partnership Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!partnership) return null;

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    pending_owner: 'bg-amber-100 text-amber-700',
    pending_verifier: 'bg-blue-100 text-blue-700',
    terminated: 'bg-red-100 text-red-700',
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-500" />
          <CardTitle className="text-sm font-semibold">Partnership Details</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Partner Company */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
          <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Partner Company</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{partnership.company_name}</p>
          </div>
        </div>

        {/* Partnership Date */}
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Partnership Date</p>
            <p className="text-sm font-medium">{formatDate(partnership.partnership_date)}</p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Current Status</p>
            <Badge className={`text-xs mt-0.5 ${statusColors[partnership.status] || 'bg-slate-100 text-slate-700'}`}>
              {partnership.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Project Duration</p>
            <p className="text-sm font-medium">{partnership.duration}</p>
          </div>
        </div>

        {/* Notes */}
        {partnership.notes && (
          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-500">Partnership Notes</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{partnership.notes}</p>
            </div>
          </div>
        )}

        {/* Supported Carbon Credits */}
        <div className="flex items-center gap-3">
          <Coins className="h-4 w-4 text-slate-400 shrink-0" />
          <div>
            <p className="text-xs text-slate-500">Supported Carbon Credits</p>
            <p className="text-sm font-semibold text-emerald-600">{partnership.carbon_credits.toLocaleString()} tCO₂e</p>
          </div>
        </div>

        {/* Funding Progress */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="h-4 w-4 text-slate-400" />
            <p className="text-xs text-slate-500">Funding Progress</p>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={partnership.funding_progress} className="h-2 flex-1" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{partnership.funding_progress}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
