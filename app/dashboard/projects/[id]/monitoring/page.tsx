'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useMonitoringReports, useProject, useProjectPartnerships } from '@/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { FileUpload } from '@/components/shared/FileUpload';
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
  DialogDescription,
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
  Building2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Handshake,
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
  const { reports, loading, refetch: refetchReports } = useMonitoringReports(projectId);
  const { partnerships, refetch: refetchPartnerships } = useProjectPartnerships(projectId);
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

  const role = (user as any)?.user_metadata?.role;

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
      refetchReports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  // Owner accepts/rejects: pending_owner → pending_verifier or rejected
  const handleOwnerDecision = async (partnershipId: string, decision: 'accept' | 'reject') => {
    try {
      const newStatus = decision === 'accept' ? 'pending_verifier' : 'rejected';
      const { error } = await supabase
        .from('project_partnerships')
        .update({ status: newStatus })
        .eq('id', partnershipId);
      if (error) throw error;

      if (decision === 'accept') {
        // Notify verifier that they need to accept
        const partnership = partnerships.find(p => p.id === partnershipId);
        if (partnership?.verifier_id) {
          await supabase.from('notifications').insert({
            user_id: partnership.verifier_id,
            title: 'Monitoring Partnership — Acceptance Required',
            body: `The Project Owner has accepted the monitoring partnership. Please review and accept.`,
            type: 'verification',
            link: `/dashboard/projects/${projectId}/monitoring`,
          });
        }
      }

      toast.success(decision === 'accept' ? 'Partnership accepted. Awaiting verifier confirmation.' : 'Partnership rejected');
      refetchPartnerships();
    } catch (err) {
      toast.error('Failed to update partnership status');
    }
  };

  // Verifier accepts/rejects: pending_verifier → active or rejected
  const handleVerifierDecision = async (partnershipId: string, decision: 'accept' | 'reject') => {
    try {
      const update: any = decision === 'accept'
        ? { status: 'active', started_at: new Date().toISOString() }
        : { status: 'rejected' };

      const { error } = await supabase
        .from('project_partnerships')
        .update(update)
        .eq('id', partnershipId);
      if (error) throw error;

      if (decision === 'accept') {
        // Notify owner that partnership is now active
        const partnership = partnerships.find(p => p.id === partnershipId);
        if (partnership?.owner_id) {
          await supabase.from('notifications').insert({
            user_id: partnership.owner_id,
            title: 'Monitoring Partnership Activated',
            body: `The verifier has accepted the monitoring partnership. The project is now under active monitoring.`,
            type: 'verification',
            link: `/dashboard/projects/${projectId}/monitoring`,
          });
        }

        await supabase.from('project_activity').insert({
          project_id: projectId,
          actor_id: user?.id,
          event_type: 'monitoring_partnership_activated',
          title: 'Monitoring Partnership Activated',
          description: 'Verifier accepted the monitoring partnership. Active monitoring has begun.',
        });
      }

      toast.success(decision === 'accept' ? 'Partnership activated. Monitoring has begun.' : 'Partnership rejected');
      refetchPartnerships();
    } catch (err) {
      toast.error('Failed to update partnership status');
    }
  };

  const isOwner = project?.owner_id === user?.id;
  const isVerifier = partnerships.some(p => p.verifier_id === user?.id);

  const pendingOwnerReview = partnerships.filter(p => p.status === 'pending_owner');
  const pendingVerifierReview = partnerships.filter(p => p.status === 'pending_verifier' && p.verifier_id === user?.id);
  const activePartnerships = partnerships.filter(p => p.status === 'active');

  const showPartnerships = (pendingOwnerReview.length > 0 || pendingVerifierReview.length > 0 || activePartnerships.length > 0) && (isOwner || isVerifier);

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/* MONITORING PARTNERSHIPS SECTION                              */}
      {/* ============================================================ */}
      {showPartnerships && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" />
                Monitoring Partnerships
              </h2>
              <p className="text-sm text-muted-foreground">
                Permanent monitoring relationships between Company, Owner, and Verifier
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {/* Owner: pending invitations to review */}
            {isOwner && pendingOwnerReview.map(p => (
              <Card key={p.id} className="p-5 border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      {p.profiles?.organization || p.profiles?.full_name || 'Sustainability Partner'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Wants to fund <span className="font-medium">{p.service_type}</span> monitoring by <span className="font-medium">{p.verifier?.organization || p.verifier?.full_name || 'Verifier'}</span>
                    </p>
                    <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                      {p.budget_usd && <span><span className="font-medium">Budget:</span> ${p.budget_usd.toLocaleString()}</span>}
                      {p.start_date && <span><span className="font-medium">Starts:</span> {p.start_date}</span>}
                    </div>
                    {p.message && (
                      <p className="mt-2 text-sm text-muted-foreground italic">&ldquo;{p.message}&rdquo;</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleOwnerDecision(p.id, 'reject')}>
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button onClick={() => handleOwnerDecision(p.id, 'accept')}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Accept
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Verifier: pending invitations to review */}
            {isVerifier && pendingVerifierReview.map(p => (
              <Card key={p.id} className="p-5 border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-amber-600" />
                      Monitoring Invitation
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      The Project Owner has accepted. You are invited to provide <span className="font-medium">{p.service_type}</span> monitoring for this project.
                    </p>
                    <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                      {p.budget_usd && <span><span className="font-medium">Budget:</span> ${p.budget_usd.toLocaleString()}</span>}
                      {p.start_date && <span><span className="font-medium">Starts:</span> {p.start_date}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleVerifierDecision(p.id, 'reject')}>
                      <XCircle className="mr-2 h-4 w-4" /> Decline
                    </Button>
                    <Button onClick={() => handleVerifierDecision(p.id, 'accept')}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Accept
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Active partnerships */}
            {activePartnerships.map(p => (
              <Card key={p.id} className="p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      Active Partnership
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">{p.profiles?.organization || p.profiles?.full_name || 'Company'}</span>
                      {' '}funds{' '}
                      <span className="font-medium">{p.service_type}</span>
                      {' '}monitoring by{' '}
                      <span className="font-medium">{p.verifier?.organization || p.verifier?.full_name || 'Verifier'}</span>
                    </p>
                    {p.started_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Active since {new Date(p.started_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">Active</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MONTHLY MONITORING REPORTS                                   */}
      {/* ============================================================ */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pt-4 border-t">
        <div>
          <h2 className="font-display text-xl font-semibold">Monthly Monitoring Reports</h2>
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
              <DialogDescription className="sr-only">Submit a new monitoring report for this project</DialogDescription>
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
              <div>
                <Label>Supporting Document (Optional)</Label>
                <div className="mt-1.5">
                  <FileUpload
                    projectId={projectId}
                    bucket="project-documents"
                    category="monitoring"
                    onUploadSuccess={() => {
                      toast.success('Document successfully attached to project');
                    }}
                  />
                </div>
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
