'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, CheckCircle2, XCircle, Eye, Calendar, ClipboardCheck, RotateCcw, Award, Clock, Activity } from 'lucide-react';

interface ActivityEntry {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  actor_name: string | null;
  actor_role: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  verification_requests_sent: Send,
  agency_accepted: CheckCircle2,
  agency_declined: XCircle,
  verifier_assigned: Eye,
  verification_audit_scheduled: Calendar,
  verification_audit_completed: ClipboardCheck,
  verification_application_approved: CheckCircle2,
  verification_application_returned: RotateCcw,
  verification_application_rejected: XCircle,
  carbon_passport_applied: Award,
  carbon_passport_issued: Award,
};

export function ActivityTab({ activities }: { activities: ActivityEntry[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" /> Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {activities.map((act) => {
                const Icon = ACTIVITY_ICONS[act.event_type] || Clock;
                return (
                  <div key={act.id} className="relative flex gap-3 pl-10">
                    <div className="absolute left-2.5 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{act.title}</p>
                      {act.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{act.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        {act.actor_name && <span>{act.actor_name}</span>}
                        {act.actor_role && <span className="px-1.5 py-0.5 rounded bg-muted">{act.actor_role}</span>}
                        <span>{new Date(act.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
