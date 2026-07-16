'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Lock,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  FileText,
} from 'lucide-react';
import {
  IMMUTABLE_FIELDS,
  IMMUTABLE_FIELD_LABELS,
  CHANGE_REQUEST_STATUS_LABELS,
} from '@/lib/types';
import type { ProjectChangeRequest } from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';

interface ChangeRequestPanelProps {
  projectId: string;
  project: any;
}

function StatusBadge({ status }: { status: ProjectChangeRequest['status'] }) {
  const config: Record<string, { icon: React.ElementType; color: string }> = {
    pending: { icon: Clock, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    approved: { icon: CheckCircle, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    rejected: { icon: XCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  };
  const { icon: Icon, color } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {CHANGE_REQUEST_STATUS_LABELS[status] || status}
    </span>
  );
}

function formatFieldValue(field: string, value: any): string {
  if (value === null || value === undefined) return 'Not set';
  if (field === 'boundary_geojson') return value ? 'GeoJSON exists' : 'No boundary set';
  if (field === 'area_hectares') return value ? `${value} Hectares` : 'Not set';
  if (field === 'perimeter_km') return value ? `${value} km` : 'Not set';
  if (field === 'created_at') {
    return new Date(value).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  if (field === 'ownership_type') {
    const labels: Record<string, string> = {
      private: 'Private',
      government: 'Government',
      community: 'Community',
      leased: 'Leased',
    };
    return labels[value] || value;
  }
  return String(value);
}

export function ChangeRequestPanel({ projectId, project }: ChangeRequestPanelProps) {
  const { user } = useAuth();
  const [requests, setRequests] = React.useState<ProjectChangeRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const [selectedField, setSelectedField] = React.useState('');
  const [proposedValue, setProposedValue] = React.useState('');
  const [reason, setReason] = React.useState('');

  const loadRequests = React.useCallback(() => {
    supabase
      .from('project_change_requests')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .then(({ data }: { data: any }) => {
        setRequests((data as ProjectChangeRequest[]) || []);
        setLoading(false);
      });
  }, [projectId]);

  React.useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const currentValue = selectedField ? project?.[selectedField] : null;

  const handleSubmit = async () => {
    if (!selectedField || !proposedValue.trim() || !reason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('project_change_requests').insert({
      project_id: projectId,
      requested_by: user?.id,
      field_name: selectedField,
      current_value: currentValue != null ? String(currentValue) : null,
      proposed_value: proposedValue.trim(),
      reason: reason.trim(),
      status: 'pending',
    });

    if (error) {
      toast.error('Failed to submit change request');
    } else {
      toast.success('Change request submitted');
      setShowForm(false);
      setSelectedField('');
      setProposedValue('');
      setReason('');
      loadRequests();
    }
    setSubmitting(false);
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Immutable Fields */}
      <Card className="p-6 shadow-sm border-border/60">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Immutable Project Information</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Fields locked after registration. Changes require admin approval via Change Request.
        </p>

        <div className="space-y-0">
          {IMMUTABLE_FIELDS.map((field) => {
            const value = project?.[field];
            return (
              <div
                key={field}
                className="flex items-center justify-between py-3 border-b border-border/60 last:border-b-0"
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {IMMUTABLE_FIELD_LABELS[field as keyof typeof IMMUTABLE_FIELD_LABELS] || field}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatFieldValue(field, value)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-border/60">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} variant="outline" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Request Change
            </Button>
          ) : (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">New Change Request</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedField('');
                    setProposedValue('');
                    setReason('');
                  }}
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Select Field</Label>
                <Select
                  value={selectedField}
                  onValueChange={(val) => {
                    setSelectedField(val);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a field to change" />
                  </SelectTrigger>
                  <SelectContent>
                    {IMMUTABLE_FIELDS.map((field) => (
                      <SelectItem key={field} value={field}>
                        {IMMUTABLE_FIELD_LABELS[field as keyof typeof IMMUTABLE_FIELD_LABELS] || field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedField && (
                <div className="space-y-2">
                  <Label className="text-xs">Current Value</Label>
                  <Input
                    value={formatFieldValue(selectedField, currentValue)}
                    readOnly
                    className="bg-muted text-muted-foreground"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">Proposed Value</Label>
                <Input
                  value={proposedValue}
                  onChange={(e) => setProposedValue(e.target.value)}
                  placeholder="Enter the new value"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Reason for Change</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this change is necessary..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!selectedField || !proposedValue.trim() || !reason.trim() || submitting}
                className="w-full"
              >
                {submitting ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit Change Request
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Existing Requests */}
      {loading ? (
        <Card className="p-6 shadow-sm border-border/60 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </Card>
      ) : requests.length > 0 ? (
        <Card className="p-6 shadow-sm border-border/60">
          <h3 className="font-display text-lg font-semibold mb-4">Change Request History</h3>

          {pendingRequests.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                Pending
              </p>
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-lg border bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {IMMUTABLE_FIELD_LABELS[req.field_name as keyof typeof IMMUTABLE_FIELD_LABELS] || req.field_name}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    {req.current_value && (
                      <p className="text-xs text-muted-foreground">
                        Current: {formatFieldValue(req.field_name, req.current_value)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Proposed: {req.proposed_value}
                    </p>
                    {req.reason && (
                      <p className="text-xs text-muted-foreground mt-1 italic">Reason: {req.reason}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Submitted: {new Date(req.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {processedRequests.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                Processed
              </p>
              <div className="space-y-3">
                {processedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-lg border bg-muted/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {IMMUTABLE_FIELD_LABELS[req.field_name as keyof typeof IMMUTABLE_FIELD_LABELS] || req.field_name}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>
                    {req.current_value && (
                      <p className="text-xs text-muted-foreground">
                        Current: {formatFieldValue(req.field_name, req.current_value)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Proposed: {req.proposed_value}
                    </p>
                    {req.reason && (
                      <p className="text-xs text-muted-foreground mt-1 italic">Reason: {req.reason}</p>
                    )}
                    {req.review_notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Review note: {req.review_notes}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Submitted: {new Date(req.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {req.reviewed_at && (
                        <> · Reviewed: {new Date(req.reviewed_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
