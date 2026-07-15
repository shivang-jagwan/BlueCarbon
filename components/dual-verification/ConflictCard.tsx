'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VerificationConflict } from '@/lib/types';
import {
  CONFLICT_STATUS_LABELS,
  CONFLICT_SEVERITY_LABELS,
} from '@/lib/types';

interface ConflictCardProps {
  conflict: VerificationConflict;
  onResolve?: (id: string) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  moderate: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  major: 'bg-destructive/10 text-destructive',
  critical: 'bg-destructive/10 text-destructive',
};

const STATUS_COLORS: Record<string, string> = {
  detected: 'bg-destructive/10 text-destructive',
  admin_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  third_review_requested: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  resolved: 'bg-success/10 text-success',
  escalated: 'bg-destructive/10 text-destructive',
};

export function ConflictCard({ conflict, onResolve }: ConflictCardProps) {
  const canResolve = conflict.status === 'detected' || conflict.status === 'admin_review';

  return (
    <Card className="border-l-4 border-l-amber-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Verification Conflict
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', SEVERITY_COLORS[conflict.severity])}>
              {CONFLICT_SEVERITY_LABELS[conflict.severity]}
            </Badge>
            <Badge className={cn('text-xs', STATUS_COLORS[conflict.status])}>
              {CONFLICT_STATUS_LABELS[conflict.status]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Verifier 1:</span>
            <span className="font-mono text-xs">{conflict.verifier_1_id.slice(0, 8)}...</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Verifier 2:</span>
            <span className="font-mono text-xs">{conflict.verifier_2_id.slice(0, 8)}...</span>
          </div>
        </div>

        {conflict.recommendation_mismatch && (
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
            <p className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Recommendation Mismatch
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The two verifiers gave different final recommendations (approve vs reject).
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Conflicting Fields</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(conflict.conflict_fields).map((field) => (
              <Badge key={field} variant="secondary" className="text-xs capitalize">
                {field.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>

        {conflict.admin_decision && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Admin Decision</p>
            <Badge className={cn('text-xs mt-1', conflict.admin_decision === 'approved' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
              {conflict.admin_decision}
            </Badge>
            {conflict.admin_remarks && (
              <p className="text-xs text-muted-foreground mt-1">{conflict.admin_remarks}</p>
            )}
          </div>
        )}

        {canResolve && onResolve && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResolve(conflict.id)}
            className="gap-1.5"
          >
            <Gavel className="h-4 w-4" />
            Resolve Conflict
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
