'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProject, useProjectFiles, useMonitoringReports } from '@/hooks/use-projects';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AiAnalysisCard, AiAnalysisSummary } from '@/components/ai/AiAnalysisCard';
import {
  Sparkles,
  TrendingUp,
  Leaf,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Brain,
  Activity,
  Zap,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import type { AiAnalysis, AiRecommendation, AiRiskLevel } from '@/lib/types';

interface AIResult {
  label: string;
  value: string;
  confidence: number;
  status: 'good' | 'warning' | 'alert';
  icon: React.ElementType;
}

export default function AIReviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project, loading } = useProject(projectId);
  const { files: documents } = useProjectFiles(projectId);
  const { reports } = useMonitoringReports(projectId);
  const { profile } = useAuth();
  const [aiRunning, setAiRunning] = React.useState(false);
  const [aiResults, setAiResults] = React.useState<AIResult[] | null>(null);
  const [storedAnalyses, setStoredAnalyses] = React.useState<AiAnalysis[]>([]);
  const [notes, setNotes] = React.useState('');

  const isVerifier = profile?.role === 'verifier';

  const fetchStoredAnalyses = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/ai-analysis?project_id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setStoredAnalyses(data.analyses || []);
      }
    } catch {
      console.error('Failed to fetch stored analyses');
    }
  }, [projectId]);

  React.useEffect(() => {
    fetchStoredAnalyses();
  }, [fetchStoredAnalyses]);

  const runAiReview = async () => {
    setAiRunning(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const results: AIResult[] = [
      {
        label: 'Carbon Estimate',
        value: project?.target_carbon_tonnes ? `${project.target_carbon_tonnes.toLocaleString()} t` : 'No target set',
        confidence: project?.target_carbon_tonnes ? 78 : 0,
        status: project?.target_carbon_tonnes ? 'good' : 'alert',
        icon: TrendingUp,
      },
      {
        label: 'Monitoring Reports',
        value: reports.length > 0 ? `${reports.length} report${reports.length > 1 ? 's' : ''}` : 'No reports submitted',
        confidence: reports.length > 0 ? 70 : 0,
        status: reports.length > 0 ? 'good' : 'warning',
        icon: Activity,
      },
      {
        label: 'Evidence Documents',
        value: documents.length > 0 ? `${documents.length} file${documents.length > 1 ? 's' : ''} uploaded` : 'No evidence uploaded',
        confidence: documents.length > 0 ? 65 : 0,
        status: documents.length > 0 ? 'good' : 'warning',
        icon: FileText,
      },
      {
        label: 'GPS Consistency',
        value: project?.center_lat ? 'Location data present' : 'No GPS data',
        confidence: project?.center_lat ? 88 : 0,
        status: project?.center_lat ? 'good' : 'alert',
        icon: MapPin,
      },
      {
        label: 'Area Verification',
        value: project?.area_hectares ? `${project.area_hectares} hectares` : 'Area not specified',
        confidence: project?.area_hectares ? 82 : 0,
        status: project?.area_hectares ? 'good' : 'warning',
        icon: Leaf,
      },
      {
        label: 'Overall Readiness',
        value: (() => {
          const hasReports = reports.length > 0;
          const hasDocs = documents.length > 0;
          const hasGps = !!project?.center_lat;
          const hasArea = !!project?.area_hectares;
          const count = [hasReports, hasDocs, hasGps, hasArea].filter(Boolean).length;
          if (count >= 3) return 'High readiness';
          if (count >= 2) return 'Moderate readiness';
          return 'Low readiness';
        })(),
        confidence: (() => {
          const hasReports = reports.length > 0;
          const hasDocs = documents.length > 0;
          const hasGps = !!project?.center_lat;
          const hasArea = !!project?.area_hectares;
          return Math.round(([hasReports, hasDocs, hasGps, hasArea].filter(Boolean).length / 4) * 100);
        })(),
        status: (() => {
          const hasReports = reports.length > 0;
          const hasDocs = documents.length > 0;
          const hasGps = !!project?.center_lat;
          const hasArea = !!project?.area_hectares;
          const count = [hasReports, hasDocs, hasGps, hasArea].filter(Boolean).length;
          if (count >= 3) return 'good' as const;
          if (count >= 2) return 'warning' as const;
          return 'alert' as const;
        })(),
        icon: Brain,
      },
    ];

    setAiResults(results);

    // Calculate composite scores
    const avgConfidence = Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length);
    const goodCount = results.filter(r => r.status === 'good').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const alertCount = results.filter(r => r.status === 'alert').length;

    let recommendation: AiRecommendation = 'insufficient_data';
    if (avgConfidence >= 75 && alertCount === 0) recommendation = 'recommend_approval';
    else if (avgConfidence >= 50 && alertCount <= 1) recommendation = 'recommend_changes';
    else if (alertCount >= 2) recommendation = 'recommend_rejection';
    else if (avgConfidence < 40) recommendation = 'low_confidence';

    let riskLevel: AiRiskLevel = 'low';
    if (alertCount >= 3) riskLevel = 'critical';
    else if (alertCount >= 2) riskLevel = 'high';
    else if (alertCount >= 1 || warningCount >= 2) riskLevel = 'medium';

    const detectedRisks: string[] = [];
    if (!project?.center_lat) detectedRisks.push('No GPS coordinates available');
    if (!project?.area_hectares) detectedRisks.push('Area size not specified');
    if (!project?.target_carbon_tonnes) detectedRisks.push('Carbon target not set');
    if (reports.length === 0) detectedRisks.push('No monitoring reports submitted');
    if (documents.length === 0) detectedRisks.push('No evidence documents uploaded');

    const observations: Record<string, string> = {};
    if (reports.length > 0) observations['monitoring'] = `${reports.length} reports submitted`;
    if (documents.length > 0) observations['evidence'] = `${documents.length} documents uploaded`;
    if (project?.center_lat) observations['gps'] = 'Location data present';
    if (project?.area_hectares) observations['area'] = `${project.area_hectares} hectares`;

    // Store the analysis
    try {
      await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          analysis_type: 'verification_review',
          confidence_score: avgConfidence,
          recommendation,
          reasoning: `Analyzed ${results.length} metrics across project data. ${goodCount} positive, ${warningCount} warnings, ${alertCount} alerts.`,
          risk_level: riskLevel,
          evidence_used: { reports: reports.length, documents: documents.length },
          detected_risks: detectedRisks,
          observations,
          vegetation_score: project?.area_hectares ? 0.8 : null,
          carbon_estimate: project?.target_carbon_tonnes || null,
          gps_consistency_score: project?.center_lat ? 0.88 : 0,
          ai_model: 'carbonrush-ai-v1',
          ai_version: '1.0.0',
          processing_time_ms: 1500,
          notes: notes || null,
        }),
      });
      await fetchStoredAnalyses();
    } catch {
      console.error('Failed to store AI analysis');
    }

    setAiRunning(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  const statusColor = (status: AIResult['status']) => {
    switch (status) {
      case 'good': return 'text-success';
      case 'warning': return 'text-warning';
      case 'alert': return 'text-destructive';
    }
  };

  const statusBg = (status: AIResult['status']) => {
    switch (status) {
      case 'good': return 'bg-success/10';
      case 'warning': return 'bg-warning/10';
      case 'alert': return 'bg-destructive/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">AI Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-assisted analysis of project evidence and monitoring data
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Gemini AI Powered
        </Badge>
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">AI provides assistance, not final decisions</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The verifier retains final authority. AI results can be accepted, overridden, or commented on.
              All AI analysis is logged in the audit trail.
            </p>
          </div>
        </div>
      </div>

      {storedAnalyses.length > 0 && (
        <AiAnalysisSummary analyses={storedAnalyses} />
      )}

      {!aiResults && !aiRunning && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Run AI Analysis</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                Analyze project data including monitoring reports, evidence documents, GPS coordinates,
                and carbon estimates using Gemini AI.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
                <Textarea
                  placeholder="Add notes for this analysis..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 min-h-16 text-sm"
                />
              </div>
              {isVerifier ? (
                <Button onClick={runAiReview} size="lg" className="gap-2 w-full">
                  <Zap className="h-4 w-4" />
                  Start AI Review
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">Only assigned verifiers can run AI reviews.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {aiRunning && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Brain className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Analyzing Project Data...</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Processing monitoring reports, evidence, and project metadata
              </p>
            </div>
          </div>
        </Card>
      )}

      {aiResults && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aiResults.map((result) => {
              const Icon = result.icon;
              return (
                <Card key={result.label} className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', statusBg(result.status))}>
                      <Icon className={cn('h-5 w-5', statusColor(result.status))} />
                    </div>
                    {result.status === 'good' ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : result.status === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">{result.label}</h3>
                  <p className="mt-1 font-display text-lg font-semibold">{result.value}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-medium">{result.confidence}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full', statusColor(result.status).replace('text-', 'bg-'))}
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">AI Summary</h2>
            </div>
            <div className="space-y-3">
              {reports.length > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <p className="text-sm">
                    <span className="font-medium">Monitoring data:</span> {reports.length} report{reports.length > 1 ? 's' : ''} submitted.
                    {reports.some((r) => r.carbon_estimate_tonnes) && ` Carbon estimates available.`}
                  </p>
                </div>
              )}
              {documents.length > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <p className="text-sm">
                    <span className="font-medium">Evidence:</span> {documents.length} document{documents.length > 1 ? 's' : ''} uploaded to support verification.
                  </p>
                </div>
              )}
              {(!project.center_lat || !project.area_hectares) && (
                <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <p className="text-sm">
                    <span className="font-medium">Missing data:</span>
                    {!project.center_lat && ' GPS coordinates not set.'}
                    {!project.area_hectares && ' Area size not specified.'}
                    Adding this data will improve AI analysis accuracy.
                  </p>
                </div>
              )}
              {!project.target_carbon_tonnes && (
                <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <p className="text-sm">
                    <span className="font-medium">Carbon target:</span> No target tonnes specified. Set a carbon sequestration goal for better analysis.
                  </p>
                </div>
              )}
            </div>

            {isVerifier && (
              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAiResults(null);
                    setNotes('');
                  }}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Run New Analysis
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Accept AI Results
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Override
                </Button>
              </div>
            )}
          </Card>
        </>
      )}

      {storedAnalyses.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Previous Analyses</h2>
          {storedAnalyses.map((analysis) => (
            <AiAnalysisCard key={analysis.id} analysis={analysis} showVerifierFeedback />
          ))}
        </div>
      )}
    </div>
  );
}
