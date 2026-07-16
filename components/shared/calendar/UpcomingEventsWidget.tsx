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
  partner_review: 'bg-emerald-500',
  ngo_visit: 'bg-teal-500',
  custom: 'bg-muted-foreground',
};

export function UpcomingEventsWidget() {
  const { events, loading } = useCalendarEvents();

  const upcomingEvents = React.useMemo(() => {
    return events
      .filter((e) => e.status === 'upcoming')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [events]);

  const eventCount = upcomingEvents.length;
  const visibleEvents = upcomingEvents.slice(0, 8);
  const hasMore = eventCount > 8;

  return (
    <Card className="p-5 flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Upcoming</h3>
        </div>
        {eventCount > 0 && (
          <span className="text-[10px] text-muted-foreground">{eventCount} event{eventCount !== 1 ? 's' : ''}</span>
        )}
      </div>
      
      <div className={cn('space-y-2', eventCount > 5 && 'max-h-[240px] overflow-y-auto pr-1')}>
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground justify-center py-3">
            <Clock className="h-3.5 w-3.5 animate-spin" /> <span className="text-xs">Loading...</span>
          </div>
        ) : eventCount === 0 ? (
          <div className="py-4 text-center">
            <CalendarDays className="mx-auto h-6 w-6 text-muted-foreground/30 mb-1.5" />
            <p className="text-xs text-muted-foreground">No upcoming events</p>
          </div>
        ) : (
          visibleEvents.map((event: CalendarEvent) => {
            const eventDate = new Date(event.start_date);
            const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const isToday = eventDate.toDateString() === new Date().toDateString();
            const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
            const relativeDay = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dateStr;
            return (
              <div key={event.id} className="flex items-start gap-2.5 rounded-md border border-border/50 px-2.5 py-2 hover:border-primary/30 transition-colors">
                <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', EVENT_COLORS[event.event_type] || EVENT_COLORS.custom)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-tight line-clamp-1">{event.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {relativeDay} {!event.all_day && `· ${eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {hasMore && (
          <p className="text-[10px] text-center text-muted-foreground py-1">
            +{eventCount - 8} more
          </p>
        )}
      </div>
      
      <Button asChild variant="ghost" size="sm" className="mt-3 w-full h-8 text-xs">
        <Link href="/dashboard/calendar">
          View Calendar<ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </Button>
    </Card>
  );
}
