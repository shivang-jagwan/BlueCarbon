import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'success' | 'compact';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  if (variant === 'success') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3 py-10 text-center', className)}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <Icon className="h-7 w-7 text-success/70" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2 py-6 text-center', className)}>
        <Icon className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground/70">{description}</p>}
        {action && <div className="mt-1">{action}</div>}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground/40">
        <Icon className="h-8 w-8" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
