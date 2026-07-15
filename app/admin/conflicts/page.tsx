'use client';

import * as React from 'react';
import { useActiveConflicts, useDualVerificationSettings, useResolveConflict } from '@/hooks/use-dual-verification';
import { ConflictCard } from '@/components/dual-verification/ConflictCard';
import { ReviewComparison } from '@/components/dual-verification/ReviewComparison';
import { RiskBadge } from '@/components/dual-verification/RiskBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Settings,
  Gavel,
  Clock,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import type { DualVerificationSetting, VerificationDecision } from '@/lib/types';

export default function AdminConflictsPage() {
  const { user } = useAuth();
  const { conflicts, total, loading, refetch } = useActiveConflicts();
  const { settings, loading: settingsLoading, refetch: refetchSettings } = useDualVerificationSettings();
  const { resolve, loading: resolving } = useResolveConflict();

  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = React.useState(false);
  const [selectedConflictId, setSelectedConflictId] = React.useState<string | null>(null);
  const [decision, setDecision] = React.useState<VerificationDecision>('approved');
  const [remarks, setRemarks] = React.useState('');
  const [reasoning, setReasoning] = React.useState('');
  const [savingSettings, setSavingSettings] = React.useState(false);

  const [riskThresholds, setRiskThresholds] = React.useState({ medium: 30, high: 60, critical: 85 });
  const [comparisonThresholds, setComparisonThresholds] = React.useState({ vegetation: 15, carbon: 15, boundary: 10, evidence: 10 });
  const [autoAssign, setAutoAssign] = React.useState(true);
  const [blindVerification, setBlindVerification] = React.useState(true);

  React.useEffect(() => {
    settings.forEach((s: DualVerificationSetting) => {
      if (s.setting_key === 'risk_thresholds' && s.setting_value) {
        setRiskThresholds({
          medium: (s.setting_value as any).medium ?? 30,
          high: (s.setting_value as any).high ?? 60,
          critical: (s.setting_value as any).critical ?? 85,
        });
      }
      if (s.setting_key === 'comparison_thresholds' && s.setting_value) {
        setComparisonThresholds({
          vegetation: (s.setting_value as any).vegetation ?? 15,
          carbon: (s.setting_value as any).carbon ?? 15,
          boundary: (s.setting_value as any).boundary ?? 10,
          evidence: (s.setting_value as any).evidence ?? 10,
        });
      }
      if (s.setting_key === 'auto_assign_verifiers' && s.setting_value) {
        setAutoAssign((s.setting_value as any).enabled ?? true);
      }
      if (s.setting_key === 'blind_verification' && s.setting_value) {
        setBlindVerification((s.setting_value as any).enabled ?? true);
      }
    });
  }, [settings]);

  const activeConflicts = conflicts.filter((c) => c.status !== 'resolved');
  const resolvedCount = conflicts.filter((c) => c.status === 'resolved').length;
  const escalatedCount = conflicts.filter((c) => c.status === 'escalated').length;

  const openResolveDialog = (id: string) => {
    setSelectedConflictId(id);
    setDecision('approved');
    setRemarks('');
    setReasoning('');
    setResolveDialogOpen(true);
  };

  const handleResolve = async () => {
    if (!selectedConflictId) return;
    const result = await resolve(selectedConflictId, {
      admin_decision: decision,
      admin_remarks: remarks || undefined,
      resolution_reasoning: reasoning || undefined,
    });
    if (result) {
      toast.success('Conflict resolved successfully');
      setResolveDialogOpen(false);
      setSelectedConflictId(null);
      refetch();
    } else {
      toast.error('Failed to resolve conflict');
    }
  };

  const handleSaveSettings = async () => {
    if (!user?.id) return;
    setSavingSettings(true);
    try {
      const updates = [
        { key: 'risk_thresholds', value: riskThresholds },
        { key: 'comparison_thresholds', value: comparisonThresholds },
        { key: 'auto_assign_verifiers', value: { enabled: autoAssign } },
        { key: 'blind_verification', value: { enabled: blindVerification } },
      ];
      for (const update of updates) {
        await fetch('/api/dual-verification/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...update, adminId: user.id }),
        });
      }
      toast.success('Settings updated successfully');
      refetchSettings();
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const selectedConflict = conflicts.find((c) => c.id === selectedConflictId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Verification Conflicts</h1>
            <p className="text-sm text-muted-foreground">Review and resolve dual verification conflicts</p>
          </div>
        </div>
        <Button variant="outline" onClick={refetch}>
          <Clock className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Conflicts</p>
          <p className="text-2xl font-bold">{total}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activeConflicts.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold">{resolvedCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Escalated</p>
              <p className="text-2xl font-bold">{escalatedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="conflicts" className="w-full">
        <div className="overflow-x-auto mb-4">
          <TabsList className="bg-muted/50 p-1 min-w-max">
            <TabsTrigger value="conflicts" className="rounded-sm whitespace-nowrap gap-2">
              <AlertTriangle className="h-4 w-4" /> Active Conflicts
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-sm whitespace-nowrap gap-2">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="conflicts" className="m-0 border-none space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeConflicts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <CheckCircle2 className="h-10 w-10 text-success/40" />
                <p className="text-sm font-medium text-muted-foreground">No active conflicts</p>
                <p className="text-xs text-muted-foreground">All verification conflicts have been resolved</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeConflicts.map((conflict) => (
                <div key={conflict.id} className="space-y-3">
                  <ConflictCard
                    conflict={conflict}
                    onResolve={openResolveDialog}
                  />
                  {expandedId === conflict.id && (
                    <Card className="ml-6">
                      <CardContent className="p-4">
                        <ReviewComparison
                          review1={conflict as any}
                          review2={conflict as any}
                          conflict={conflict}
                        />
                      </CardContent>
                    </Card>
                  )}
                  <div className="ml-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === conflict.id ? null : conflict.id)}
                      className="gap-1.5 text-xs"
                    >
                      {expandedId === conflict.id ? (
                        <><EyeOff className="h-3 w-3" /> Hide Comparison</>
                      ) : (
                        <><Eye className="h-3 w-3" /> View Comparison</>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="m-0 border-none space-y-4">
          {settingsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Risk Thresholds</CardTitle>
                  <CardDescription>Configure risk level boundaries for project assessments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="riskMedium">Medium Risk Threshold</Label>
                      <Input
                        id="riskMedium"
                        type="number"
                        min={0}
                        max={100}
                        value={riskThresholds.medium}
                        onChange={(e) =>
                          setRiskThresholds({ ...riskThresholds, medium: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="riskHigh">High Risk Threshold</Label>
                      <Input
                        id="riskHigh"
                        type="number"
                        min={0}
                        max={100}
                        value={riskThresholds.high}
                        onChange={(e) =>
                          setRiskThresholds({ ...riskThresholds, high: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="riskCritical">Critical Risk Threshold</Label>
                      <Input
                        id="riskCritical"
                        type="number"
                        min={0}
                        max={100}
                        value={riskThresholds.critical}
                        onChange={(e) =>
                          setRiskThresholds({ ...riskThresholds, critical: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comparison Thresholds</CardTitle>
                  <CardDescription>Maximum allowed percentage difference before flagging a metric conflict</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="cmpVegetation">Vegetation Score (%)</Label>
                      <Input
                        id="cmpVegetation"
                        type="number"
                        min={0}
                        max={100}
                        value={comparisonThresholds.vegetation}
                        onChange={(e) =>
                          setComparisonThresholds({ ...comparisonThresholds, vegetation: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cmpCarbon">Carbon Estimate (%)</Label>
                      <Input
                        id="cmpCarbon"
                        type="number"
                        min={0}
                        max={100}
                        value={comparisonThresholds.carbon}
                        onChange={(e) =>
                          setComparisonThresholds({ ...comparisonThresholds, carbon: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cmpBoundary">Boundary Area (%)</Label>
                      <Input
                        id="cmpBoundary"
                        type="number"
                        min={0}
                        max={100}
                        value={comparisonThresholds.boundary}
                        onChange={(e) =>
                          setComparisonThresholds({ ...comparisonThresholds, boundary: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cmpEvidence">Evidence Quality (%)</Label>
                      <Input
                        id="cmpEvidence"
                        type="number"
                        min={0}
                        max={100}
                        value={comparisonThresholds.evidence}
                        onChange={(e) =>
                          setComparisonThresholds({ ...comparisonThresholds, evidence: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Verification Behavior</CardTitle>
                  <CardDescription>Control dual verification workflow defaults</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Auto-Assign Verifiers</Label>
                      <p className="text-sm text-muted-foreground">Automatically assign two verifiers when a new verification request is created</p>
                    </div>
                    <Switch checked={autoAssign} onCheckedChange={setAutoAssign} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Blind Verification</Label>
                      <p className="text-sm text-muted-foreground">Hide each verifier&apos;s review from the other until both have submitted</p>
                    </div>
                    <Switch checked={blindVerification} onCheckedChange={setBlindVerification} />
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border pt-6">
                  <Button onClick={handleSaveSettings} disabled={savingSettings} className="ml-auto w-40">
                    {savingSettings ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      <>Save Changes</>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Resolve Verification Conflict
            </DialogTitle>
          </DialogHeader>
          {selectedConflict && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Review 1</p>
                  <p className="font-mono text-sm mt-1">{selectedConflict.review_1_id.slice(0, 12)}...</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Review 2</p>
                  <p className="font-mono text-sm mt-1">{selectedConflict.review_2_id.slice(0, 12)}...</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {selectedConflict.severity}
                </Badge>
                {selectedConflict.recommendation_mismatch && (
                  <Badge className="bg-destructive/10 text-destructive text-xs">
                    Recommendation Mismatch
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="decision">Admin Decision</Label>
                <select
                  id="decision"
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as VerificationDecision)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="changes_requested">Changes Requested</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Admin Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Explain the rationale for this decision..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reasoning">Resolution Reasoning (optional)</Label>
                <Textarea
                  id="reasoning"
                  placeholder="Detailed reasoning for audit trail..."
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={resolving || !selectedConflictId}>
              {resolving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resolving...</>
              ) : (
                <><CheckCircle2 className="mr-2 h-4 w-4" /> Resolve</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
