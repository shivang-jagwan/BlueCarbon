'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fraudScoreLabel, fraudScoreColor } from '@/lib/types';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

interface FraudScoreBadgeProps {
  score: number;
  showIcon?: boolean;
  className?: string;
}

export function FraudScoreBadge({ score, showIcon = true, className }: FraudScoreBadgeProps) {
  const label = fraudScoreLabel(score);
  const colorClass = fraudScoreColor(score);

  const Icon = score <= 20 ? ShieldCheck : score <= 50 ? Shield : ShieldAlert;

  return (
    <Badge
      variant="secondary"
      className={cn('gap-1.5 text-xs font-medium', colorClass, className)}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {score}/100 — {label}
    </Badge>
  );
}
