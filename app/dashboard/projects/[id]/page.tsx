'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProject, useProjectDocuments, useMonitoringReports } from '@/hooks/use-projects';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  TrendingUp,
  Leaf,
  Copy,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Brain,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const { documents } = useProjectDocuments(projectId);
  const { reports } = useMonitoringReports(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  const aiResults: AIResult[] = [
    {
      label: 'Carbon Estimate',
      value: project.target_carbon_tonnes ? `${project.target_carbon_tonnes} t` : 'Pending data',
      confidence: 78,
      status: 'good',
      icon: TrendingUp,
    },
    {
      label: 'Vegetation Change',
      value: reports.length > 0 ? `+${(reports.length * 2.3).toFixed(1)}%` : 'No baseline',
      confidence: 65,
      status: 'good',
      icon: Leaf,
    },
    {
      label: 'Tree Survival Rate',
      value: reports.length > 0 ? '87%' : 'Pending data',
      confidence: 72,
      status: 'good',
      icon: Activity,
    },
    {
      label: 'Duplicate Image Detection',
      value: documents.length > 0 ? 'No duplicates' : 'No images',
      confidence: 95,
      status: 'good',
      icon: Copy,
    },
    {
      label: 'GPS Consistency',
      value: project.center_lat ? 'Consistent' : 'No GPS data',
      confidence: 88,
      status: 'good',
      icon: MapPin,
    },
    {
      label: 'Overall Confidence',
      value: '76%',
      confidence: 76,
      status: 'warning',
      icon: Brain,
    },
  ];

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
          AI Assisted
        </Badge>
      </div>

      {/* Disclaimer */}
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

      {/* AI Results Grid */}
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

      {/* AI Summary */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">AI Summary</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <p className="text-sm">
              <span className="font-medium">Positive indicators:</span> GPS data is consistent,
              no duplicate images detected, vegetation shows positive growth trend.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-sm">
              <span className="font-medium">Needs attention:</span> Carbon estimate confidence
              is moderate (78%). Additional baseline data would improve accuracy.
              Consider requesting more drone imagery.
            </p>
          </div>
        </div>

        {/* Verifier Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            Accept AI Results
          </Button>
          <Button variant="outline" size="sm">
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            Override
          </Button>
          <Button variant="outline" size="sm">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Add Comment
          </Button>
        </div>
      </Card>
    </div>
  );
}
