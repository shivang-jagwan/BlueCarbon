'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useMonitoringReports, useProject } from '@/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ClipboardList,
  Plus,
  Clock,
  TrendingUp,
  Leaf,
  Droplets,
  AlertCircle,
} from 'lucide-react';
import { MONITORING_STATUS_LABELS, type MonitoringStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

function statusBadge(status: MonitoringStatus) {
  const map: Record<MonitoringStatus, string> = {
    draft: 'bg-muted text-muted-foreground',
    submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    reviewed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    approved: 'bg-success/10 text-success',
  };
  return map[status];
}

export default function MonitoringPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { reports, loading, refetch } = useMonitoringReports(projectId);
  const { project } = useProject(projectId);
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [formData, setFormData] = React.useState({
    period_month: currentMonth,
    area_observed_hectares: '',
    ndvi_avg: '',
    carbon_estimate_tonnes: '',
    notes: '',
  });

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('monitoring_reports').insert({
        project_id: projectId,
        period_month: formData.period_month,
        area_observed_hectares: formData.area_observed_hectares ? parseFloat(formData.area_observed_hectares) : null,
        ndvi_avg: formData.ndvi_avg ? parseFloat(formData.ndvi_avg) : null,
        carbon_estimate_tonnes: formData.carbon_estimate_tonnes ? parseFloat(formData.carbon_estimate_tonnes) : null,
        notes: formData.notes || null,
        status: 'submitted',
        created_by: user.id,
      });

      if (error) throw error;

      await supabase.from('project_activity').insert({
        project_id: projectId,
        actor_id: user.id,
        event_type: 'monitoring_submitted',
        title: 'Monthly Monitoring Submitted',
        description: `Monitoring report for ${formData.period_month} submitted`,
      });

      toast.success('Monitoring report submitted');
      setDialogOpen(false);
      setFormData({
        period_month: currentMonth,
        area_observed_hectares: '',
        ndvi_avg: '',
        carbon_estimate_tonnes: '',
        notes: '',
      });
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Monthly Monitoring</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track restoration progress with monthly monitoring reports
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Monitoring Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Period (Month)</Label>
                <Input
                  type="month"
                  value={formData.period_month}
                  onChange={(e) => setFormData({ ...formData, period_month: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Area Observed (ha)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={formData.area_observed_hectares}
                    onChange={(e) => setFormData({ ...formData, area_observed_hectares: e.target.value })}
                  />
                </div>
                <div>
                  <Label>NDVI Average</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.ndvi_avg}
                    onChange={(e) => setFormData({ ...formData, ndvi_avg: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Carbon Est. (t)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={formData.carbon_estimate_tonnes}
                    onChange={(e) => setFormData({ ...formData, carbon_estimate_tonnes: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Observations, challenges, growth patterns..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reports */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No monitoring reports yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first monthly monitoring report to start tracking progress
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {new Date(report.period_month + '-01').toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </h3>
                    <span
                      className={cn(
                        'mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusBadge(report.status)
                      )}
                    >
                      {MONITORING_STATUS_LABELS[report.status]}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {report.area_observed_hectares !== null && (
                  <MetricItem icon={TrendingUp} label="Area Observed" value={`${report.area_observed_hectares} ha`} />
                )}
                {report.ndvi_avg !== null && (
                  <MetricItem icon={Leaf} label="NDVI Average" value={report.ndvi_avg.toFixed(2)} />
                )}
                {report.carbon_estimate_tonnes !== null && (
                  <MetricItem icon={TrendingUp} label="Carbon Est." value={`${report.carbon_estimate_tonnes} t`} />
                )}
              </div>

              {report.notes && (
                <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm text-muted-foreground">{report.notes}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
