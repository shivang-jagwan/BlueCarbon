'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const SAMPLE_EVENTS: Record<string, Array<{ title: string; type: string; time: string }>> = {
  '15': [{ title: 'Monthly Verification Due', type: 'verification', time: 'All day' }],
  '18': [{ title: 'Drone Survey', type: 'survey', time: '09:00' }],
  '22': [{ title: 'NGO Site Visit', type: 'visit', time: '14:00' }],
  '30': [{ title: 'Report Submission', type: 'report', time: '17:00' }],
};

const EVENT_COLORS: Record<string, string> = {
  verification: 'bg-amber-500',
  survey: 'bg-blue-500',
  visit: 'bg-success',
  report: 'bg-primary',
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ProjectCalendarPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verification dates, monitoring deadlines, and scheduled visits
          </p>
        </div>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      <Card className="p-6">
        {/* Calendar Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {DAYS.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const events = day ? SAMPLE_EVENTS[String(day)] || [] : [];
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            return (
              <div
                key={i}
                className={cn(
                  'min-h-20 rounded-lg border p-1.5 text-sm',
                  day ? 'border-border' : 'border-transparent',
                  isToday && 'border-primary bg-primary/5'
                )}
              >
                {day && (
                  <>
                    <span className={cn('text-xs font-medium', isToday && 'text-primary')}>{day}</span>
                    <div className="mt-1 space-y-0.5">
                      {events.map((event, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] hover:bg-muted/50"
                        >
                          <div className={cn('h-1.5 w-1.5 shrink-0 rounded-full', EVENT_COLORS[event.type])} />
                          <span className="truncate">{event.title}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Upcoming Events List */}
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Upcoming Events</h2>
        <div className="space-y-2">
          {Object.entries(SAMPLE_EVENTS).map(([day, events]) =>
            events.map((event, i) => (
              <div key={`${day}-${i}`} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className={cn('h-3 w-3 shrink-0 rounded-full', EVENT_COLORS[event.type])} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {MONTHS[month]} {day}, {year} · {event.time}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
