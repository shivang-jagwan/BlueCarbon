'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuditLog } from '@/lib/types';
import { AUDIT_SEVERITY_COLORS } from '@/lib/types';

const SEVERITY_DOT: Record<string, string> = {
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
  security: 'bg-orange-500',
};

interface AuditTimelineProps {
  logs: AuditLog[];
}

export function AuditTimeline({ logs }: AuditTimelineProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-sm text-muted-foreground">No audit logs found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
      {logs.map((log) => (
        <AuditEntry key={log.id} log={log} />
      ))}
    </div>
  );
}

function AuditEntry({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = React.useState(false);
  const hasState = log.before_state || log.after_state;

  return (
    <div className="relative flex gap-4 py-3">
      <div className={cn(
        'relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-background',
        SEVERITY_DOT[log.severity] || 'bg-muted'
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium leading-none">
              {log.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{log.resource_type}</span>
              {log.resource_id && (
                <>
                  <span>·</span>
                  <span className="font-mono">{log.resource_id.slice(0, 8)}...</span>
                </>
              )}
              {log.role && (
                <>
                  <span>·</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {log.role}
                  </Badge>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={cn('text-[10px] px-1.5', AUDIT_SEVERITY_COLORS[log.severity])}>
              {log.severity}
            </Badge>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(log.timestamp).toLocaleString()}
            </span>
          </div>
        </div>

        {log.reason && (
          <p className="mt-1 text-xs text-muted-foreground italic">{log.reason}</p>
        )}

        {hasState && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
              {expanded ? 'Hide' : 'Show'} details
            </Button>
            {expanded && (
              <div className="mt-1 rounded-lg bg-muted/50 p-3 text-xs font-mono space-y-2 max-h-60 overflow-auto">
                {log.before_state && (
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Before</p>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log.before_state, null, 2)}</pre>
                  </div>
                )}
                {log.after_state && (
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">After</p>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log.after_state, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(log.ip_address || log.device) && (
          <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
            {log.ip_address && <span>IP: {log.ip_address}</span>}
            {log.device && <span>Device: {log.device}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
