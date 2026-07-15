'use client';

import { Card } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, CheckCircle, Lock, Unlock, ShieldAlert,
  Key, Clock, Ban, Globe, Users, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SecurityEvent } from '@/lib/types';
import { SECURITY_EVENT_LABELS, AUDIT_SEVERITY_COLORS, type SecurityEventType } from '@/lib/types';

const EVENT_ICONS: Record<SecurityEventType, React.ElementType> = {
  failed_login: AlertTriangle,
  successful_login: CheckCircle,
  account_locked: Lock,
  account_unlocked: Unlock,
  password_changed: Key,
  brute_force_detected: ShieldAlert,
  session_expired: Clock,
  unauthorized_access: Ban,
  rate_limit_exceeded: AlertTriangle,
  suspicious_ip: Globe,
  concurrent_session: Users,
};

interface SecurityEventsTableProps {
  events: SecurityEvent[];
  onResolve?: (id: string) => void;
}

export function SecurityEventsTable({ events, onResolve }: SecurityEventsTableProps) {
  if (events.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No security events</p>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => {
            const Icon = EVENT_ICONS[event.event_type] || AlertTriangle;
            return (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">
                      {SECURITY_EVENT_LABELS[event.event_type]}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={cn('text-xs', AUDIT_SEVERITY_COLORS[event.severity])}>
                    {event.severity}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {event.ip_address || '—'}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {event.user_id ? event.user_id.slice(0, 8) + '...' : '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  {event.resolved ? (
                    <Badge className="bg-success/10 text-success text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" /> Resolved
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                      <Eye className="h-3 w-3 mr-1" /> Open
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {!event.resolved && onResolve && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onResolve(event.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
