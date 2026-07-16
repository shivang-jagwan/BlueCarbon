'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon, Clock, AlertTriangle, CheckCircle2, FileText,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VOCCalendarEvent } from '@/lib/voc-types';

const EVENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  audit: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  review: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  deadline: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  completed: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  audit: <AlertTriangle className="h-4 w-4" />,
  review: <FileText className="h-4 w-4" />,
  deadline: <Clock className="h-4 w-4" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
};

function generateCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

export default function VOCCalendarPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date(2026, 6, 1));
  const events: VOCCalendarEvent[] = [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = generateCalendarDays(year, month);
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const today = new Date();
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <CalendarIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Verification Calendar</h1>
          <p className="text-sm text-muted-foreground">Scheduled audits, reviews, and upcoming verifications.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{monthLabel}</CardTitle>
              <div className="flex gap-1">
                <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-border/60 rounded-lg overflow-hidden">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
              {days.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    'bg-background p-2 min-h-[80px]',
                    day === null && 'bg-muted/30',
                  )}
                >
                  {day !== null && (
                    <>
                      <span className={cn('text-xs font-medium', isToday(day) && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center')}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {getEventsForDay(day).map(evt => (
                          <div key={evt.id} className={cn('text-[9px] px-1 py-0.5 rounded border truncate', EVENT_COLORS[evt.type]?.bg)}>
                            {evt.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Sidebar */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.sort((a, b) => a.date.localeCompare(b.date)).map(evt => (
                <div key={evt.id} className={cn('p-3 rounded-lg border', EVENT_COLORS[evt.type]?.bg)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={EVENT_COLORS[evt.type]?.text}>{EVENT_ICONS[evt.type]}</span>
                    <span className={cn('text-xs font-semibold', EVENT_COLORS[evt.type]?.text)}>
                      {evt.type.charAt(0).toUpperCase() + evt.type.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{evt.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{evt.project_name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {evt.time}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
