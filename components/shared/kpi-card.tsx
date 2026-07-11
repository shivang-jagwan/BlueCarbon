'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function KpiCard({ label, value, hint, icon: Icon, trend, className }: KpiCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={cn(
              'text-xs font-medium',
              trend.positive ? 'text-success' : 'text-destructive'
            )}
          >
            {trend.positive ? '+' : ''}
            {trend.value}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </Card>
  );
}
