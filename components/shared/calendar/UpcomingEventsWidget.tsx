'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, ArrowRight, Clock } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/use-calendar';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/lib/types';

export const EVENT_COLORS: Record<string, string> = {
  verification: 'bg-amber-500',
  monthly_monitoring: 'bg-blue-500',
  site_visit: 'bg-success',
  drone_survey: 'bg-indigo-500',
  project_deadline: 'bg-destructive',
  meeting: 'bg-primary',
  reminder: 'bg-warning',
  support_review: 'bg-emerald-500',
  ngo_visit: 'bg-teal-500',
  custom: 'bg-muted-foreground',
};

export function UpcomingEventsWidget() {
  const { events, loading } = useCalendarEvents();

  const upcomingEvents = React.useMemo(() => {
    return events
      .filter((e) => e.status === 'upcoming')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 5);
  }, [events]);

  return (
    <Card className="p-5 flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4.5 w-4.5 text-primary" />
          <h3 className="font-semibold">Upcoming</h3>
        </div>
      </div>
      
      <div className="space-y-3 flex-1">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground justify-center py-4">
            <Clock className="h-4 w-4 animate-spin" /> <span className="text-sm">Loading...</span>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">No upcoming events</p>
          </div>
        ) : (
          upcomingEvents.map((event: CalendarEvent) => {
            const dateStr = new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <div key={event.id} className="flex items-start gap-3">
                <div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', EVENT_COLORS[event.event_type] || EVENT_COLORS.custom)} />
                <div className="flex-1">
                  <p className="text-sm font-medium leading-tight line-clamp-1">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {dateStr} {!event.all_day && `· ${new Date(event.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <Button asChild variant="ghost" size="sm" className="mt-4 w-full">
        <Link href="/dashboard/calendar">
          View Calendar<ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </Button>
    </Card>
  );
}
