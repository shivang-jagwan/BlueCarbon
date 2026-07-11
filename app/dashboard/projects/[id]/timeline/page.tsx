'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProjectActivity } from '@/hooks/use-projects';
import { Card } from '@/components/ui/card';
import { Clock, Activity, FileText, Upload, ShieldCheck, DollarSign, Award, MapPin, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_ICONS: Record<string, React.ElementType> = {
  project_created: FileText,
  evidence_uploaded: Upload,
  verification_requested: ShieldCheck,
  ngo_assigned: ShieldCheck,
  funding_received: DollarSign,
  passport_issued: Award,
  land_registered: MapPin,
  monitoring_submitted: CheckCircle2,
  default: Activity,
};

export default function TimelinePage() {
  const params = useParams();
  const projectId = params.id as string;
  const { activities, loading } = useProjectActivity(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Activity Timeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every event in the project lifecycle, most recent first
        </p>
      </div>

      {activities.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Activity className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No activity yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Activity will appear here as the project progresses
            </p>
          </div>
        </Card>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {activities.map((a) => {
              const Icon = EVENT_ICONS[a.event_type] || EVENT_ICONS.default;
              return (
                <div key={a.id} className="relative flex gap-4 pl-0">
                  <div className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <Card className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold">{a.title}</h3>
                        {a.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
