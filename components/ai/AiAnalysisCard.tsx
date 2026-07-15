'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, AlertTriangle, CheckCircle, XCircle, Info, Clock } from 'lucide-react';
import type {
  AiAnalysis,
  AiRecommendation,
  AiRiskLevel,
} from '@/lib/types';
import {
  AI_RECOMMENDATION_LABELS,
  AI_RISK_LEVEL_LABELS,
  aiRecommendationColor,
  aiRiskLevelColor,
} from '@/lib/types';
import { cn } from '@/lib/utils';

interface AiAnalysisCardProps {
  analysis: AiAnalysis;
  showVerifierFeedback?: boolean;
  compact?: boolean;
}

function RecommendationIcon({ recommendation }: { recommendation: AiRecommendation }) {
  switch (recommendation) {
    case 'recommend_approval':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'recommend_rejection':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'recommend_changes':
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

function ConfidenceGauge({ score, size = 'default' }: { score: number; size?: 'default' | 'lg' }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-success';
    if (s >= 60) return 'text-amber-600';
    if (s >= 40) return 'text-orange-600';
    return 'text-destructive';
  };

  return (
    <div className={cn('flex items-center gap-2', size === 'lg' && 'gap-3')}>
      <div className="relative">
        <svg
          className={cn(
            size === 'lg' ? 'h-16 w-16' : 'h-12 w-12',
            'transform -rotate-90'
          )}
          viewBox="0 0 36 36"
        >
          <circle
            cx="18"
            cy="18"
            r="15.91549430918954"
            fill="none"
            className="stroke-muted"
            strokeWidth="2"
          />
          <circle
            cx="18"
            cy="18"
            r="15.91549430918954"
            fill="none"
            className={cn('stroke-current', getColor(score))}
            strokeWidth="2"
            strokeDasharray={`${score} ${100 - score}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', getColor(score), size === 'lg' ? 'text-lg' : 'text-sm')}>
            {score}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AiAnalysisCard({ analysis, showVerifierFeedback = false, compact = false }: AiAnalysisCardProps) {
  if (compact) {
    return (
      <Card className="border-l-4 border-l-primary/30">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn('text-xs', aiRecommendationColor(analysis.recommendation))}>
                {AI_RECOMMENDATION_LABELS[analysis.recommendation]}
              </Badge>
              <Badge className={cn('text-xs', aiRiskLevelColor(analysis.risk_level))}>
                {AI_RISK_LEVEL_LABELS[analysis.risk_level]}
              </Badge>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <ConfidenceGauge score={analysis.confidence_score} />
            <p className="text-xs text-muted-foreground line-clamp-2">
              {analysis.reasoning || 'No reasoning provided'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary" />
            AI Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', aiRecommendationColor(analysis.recommendation))}>
              <RecommendationIcon recommendation={analysis.recommendation} />
              <span className="ml-1">{AI_RECOMMENDATION_LABELS[analysis.recommendation]}</span>
            </Badge>
            <Badge className={cn('text-xs', aiRiskLevelColor(analysis.risk_level))}>
              {AI_RISK_LEVEL_LABELS[analysis.risk_level]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <ConfidenceGauge score={analysis.confidence_score} size="lg" />
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Confidence Score</p>
              <p className="text-sm">{analysis.confidence_score}/100</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Reasoning</p>
              <p className="text-sm text-muted-foreground">
                {analysis.reasoning || 'No reasoning provided'}
              </p>
            </div>
          </div>
        </div>

        {(analysis.vegetation_score !== null || analysis.carbon_estimate !== null || 
          analysis.gps_consistency_score !== null || analysis.similarity_score !== null) && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {analysis.vegetation_score !== null && (
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">Vegetation</p>
                <p className="text-sm font-medium">{Math.round(analysis.vegetation_score * 100)}%</p>
              </div>
            )}
            {analysis.carbon_estimate !== null && (
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">Carbon Est.</p>
                <p className="text-sm font-medium">{analysis.carbon_estimate.toFixed(1)}t</p>
              </div>
            )}
            {analysis.gps_consistency_score !== null && (
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">GPS Consistency</p>
                <p className="text-sm font-medium">{Math.round(analysis.gps_consistency_score * 100)}%</p>
              </div>
            )}
            {analysis.similarity_score !== null && (
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground">Similarity</p>
                <p className="text-sm font-medium">{Math.round(analysis.similarity_score * 100)}%</p>
              </div>
            )}
          </div>
        )}

        {analysis.detected_risks && Array.isArray(analysis.detected_risks) && analysis.detected_risks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Detected Risks</p>
            <div className="space-y-1">
              {(analysis.detected_risks as string[]).map((risk, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.observations && typeof analysis.observations === 'object' && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Observations</p>
            <div className="rounded-lg bg-muted/50 p-3">
              {Object.entries(analysis.observations as Record<string, unknown>).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm py-1">
                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(analysis.created_at).toLocaleString()}</span>
          </div>
          {analysis.ai_model && <span>Model: {analysis.ai_model}</span>}
          {analysis.processing_time_ms && <span>{analysis.processing_time_ms}ms</span>}
        </div>

        {showVerifierFeedback && analysis.verifier_agreed_with_ai !== null && (
          <div className="rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Verifier Feedback</p>
            <div className="flex items-center gap-2">
              {analysis.verifier_agreed_with_ai ? (
                <Badge className="bg-success/10 text-success text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Agreed with AI
                </Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs">
                  <XCircle className="h-3 w-3 mr-1" />
                  Overridden
                </Badge>
              )}
              {analysis.verifier_override_reason && (
                <p className="text-xs text-muted-foreground">{analysis.verifier_override_reason}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AiAnalysisSummary({ analyses }: { analyses: AiAnalysis[] }) {
  if (analyses.length === 0) return null;

  const latest = analyses[0];
  const avgConfidence = Math.round(analyses.reduce((sum, a) => sum + a.confidence_score, 0) / analyses.length);

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <Brain className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">AI Analysis</p>
          <Badge className={cn('text-xs', aiRecommendationColor(latest.recommendation))}>
            {AI_RECOMMENDATION_LABELS[latest.recommendation]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {analyses.length} analysis{analyses.length > 1 ? 'es' : ''} • Avg confidence: {avgConfidence}%
        </p>
      </div>
      <ConfidenceGauge score={avgConfidence} />
    </div>
  );
}
