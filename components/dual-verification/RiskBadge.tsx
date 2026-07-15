'use client';

import { Badge } from '@/components/ui/badge';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
import { RISK_LEVEL_LABELS, RISK_LEVEL_COLORS, type RiskLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
  size?: 'default' | 'lg';
}

const ICONS: Record<RiskLevel, React.ElementType> = {
  low: ShieldCheck,
  medium: Shield,
  high: ShieldAlert,
  critical: ShieldX,
};

export function RiskBadge({ level, score, showScore = false, size = 'default' }: RiskBadgeProps) {
  const Icon = ICONS[level];
  const iconSize = size === 'lg' ? 'h-4 w-4' : 'h-3 w-3';

  return (
    <Badge className={cn('gap-1.5', RISK_LEVEL_COLORS[level], size === 'lg' && 'text-sm px-3 py-1')}>
      <Icon className={iconSize} />
      {RISK_LEVEL_LABELS[level]}
      {showScore && score !== undefined && (
        <span className="ml-1 font-mono opacity-80">{score}</span>
      )}
    </Badge>
  );
}
