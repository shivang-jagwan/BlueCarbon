'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VerificationReview, VerificationConflict } from '@/lib/types';
import { VERIFICATION_DECISION_LABELS } from '@/lib/types';

interface ReviewComparisonProps {
  review1: VerificationReview;
  review2: VerificationReview;
  conflict?: VerificationConflict;
}

interface MetricRow {
  label: string;
  value1: string | number;
  value2: string | number;
  differs: boolean;
}

function computeMetrics(r1: VerificationReview, r2: VerificationReview): MetricRow[] {
  const pctDiff = (a: number | null, b: number | null) => {
    if (a === null || b === null || a === 0) return false;
    return Math.abs(a - b) / Math.abs(a) > 0.15;
  };

  const numDiff = (a: number | null, b: number | null) => {
    if (a === null && b === null) return false;
    if (a === null || b === null) return true;
    return a !== b;
  };

  return [
    {
      label: 'Vegetation Score',
      value1: r1.vegetation_score !== null ? `${(r1.vegetation_score * 100).toFixed(0)}%` : '—',
      value2: r2.vegetation_score !== null ? `${(r2.vegetation_score * 100).toFixed(0)}%` : '—',
      differs: pctDiff(r1.vegetation_score, r2.vegetation_score),
    },
    {
      label: 'Carbon Estimate',
      value1: r1.carbon_estimate !== null ? `${r1.carbon_estimate.toFixed(1)} t` : '—',
      value2: r2.carbon_estimate !== null ? `${r2.carbon_estimate.toFixed(1)} t` : '—',
      differs: pctDiff(r1.carbon_estimate, r2.carbon_estimate),
    },
    {
      label: 'Boundary Area',
      value1: r1.boundary_area_hectares !== null ? `${r1.boundary_area_hectares.toFixed(1)} ha` : '—',
      value2: r2.boundary_area_hectares !== null ? `${r2.boundary_area_hectares.toFixed(1)} ha` : '—',
      differs: pctDiff(r1.boundary_area_hectares, r2.boundary_area_hectares),
    },
    {
      label: 'Evidence Quality',
      value1: r1.evidence_quality_score !== null ? `${r1.evidence_quality_score}%` : '—',
      value2: r2.evidence_quality_score !== null ? `${r2.evidence_quality_score}%` : '—',
      differs: numDiff(r1.evidence_quality_score, r2.evidence_quality_score),
    },
    {
      label: 'Recommendation',
      value1: VERIFICATION_DECISION_LABELS[r1.recommendation as keyof typeof VERIFICATION_DECISION_LABELS] || r1.recommendation,
      value2: VERIFICATION_DECISION_LABELS[r2.recommendation as keyof typeof VERIFICATION_DECISION_LABELS] || r2.recommendation,
      differs: r1.recommendation !== r2.recommendation,
    },
    {
      label: 'Confidence',
      value1: r1.overall_confidence !== null ? `${r1.overall_confidence}%` : '—',
      value2: r2.overall_confidence !== null ? `${r2.overall_confidence}%` : '—',
      differs: numDiff(r1.overall_confidence, r2.overall_confidence),
    },
  ];
}

export function ReviewComparison({ review1, review2, conflict }: ReviewComparisonProps) {
  const metrics = React.useMemo(() => computeMetrics(review1, review2), [review1, review2]);
  const diffCount = metrics.filter(m => m.differs).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4 text-primary" />
            Blind Verification Comparison
          </CardTitle>
          {conflict && (
            <Badge className={cn(
              conflict.severity === 'critical' || conflict.severity === 'major'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            )}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {diffCount} Difference{diffCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">Metric</TableHead>
              <TableHead className="w-[30%]">
                <span className="flex items-center gap-1">
                  <EyeOff className="h-3 w-3" /> Reviewer 1
                </span>
              </TableHead>
              <TableHead className="w-[30%]">
                <span className="flex items-center gap-1">
                  <EyeOff className="h-3 w-3" /> Reviewer 2
                </span>
              </TableHead>
              <TableHead className="w-[5%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric) => (
              <TableRow
                key={metric.label}
                className={cn(
                  metric.differs && 'bg-amber-50 dark:bg-amber-900/10'
                )}
              >
                <TableCell className="font-medium text-sm">{metric.label}</TableCell>
                <TableCell className="text-sm">{metric.value1}</TableCell>
                <TableCell className="text-sm">{metric.value2}</TableCell>
                <TableCell>
                  {metric.differs && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {conflict && (
          <div className="mt-4 rounded-lg border p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Conflict Fields</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(conflict.conflict_fields).map((field) => (
                <Badge key={field} variant="secondary" className="text-xs">
                  {field.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
            {conflict.admin_remarks && (
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium">Admin notes:</span> {conflict.admin_remarks}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
