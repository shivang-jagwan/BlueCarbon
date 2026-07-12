'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCalendarEvents } from '@/hooks/use-calendar';
import { AddEventModal } from '@/components/shared/calendar/AddEventModal';
import { EventDetailModal } from '@/components/shared/calendar/EventDetailModal';
import { EVENT_COLORS } from '@/components/shared/calendar/UpcomingEventsWidget';
import type { CalendarEvent } from '@/lib/types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const { events, loading, refetch } = useCalendarEvents();
  
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarEvent | null>(null);
  const [eventToEdit, setEventToEdit] = React.useState<CalendarEvent | undefined>(undefined);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handleDayClick = (dayNumber: number) => {
    setSelectedDate(new Date(year, month, dayNumber));
    setEventToEdit(undefined);
    setAddModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setDetailModalOpen(true);
  };

  const upcomingEventsList = React.useMemo(() => {
    return events
      .filter((e) => e.status === 'upcoming')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 5);
  }, [events]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verification dates, monitoring deadlines, and scheduled events
          </p>
        </div>
        <Button onClick={() => { setSelectedDate(undefined); setEventToEdit(undefined); setAddModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      <Card className="p-6">
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

        <div className="mb-2 grid grid-cols-7 gap-1">
          {DAYS.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            
            // Get events for this specific day
            const dayEvents = day ? events.filter(e => {
              const eDate = new Date(e.start_date);
              return eDate.getDate() === day && eDate.getMonth() === month && eDate.getFullYear() === year;
            }) : [];

            return (
              <div
                key={i}
                onClick={() => day && handleDayClick(day)}
                className={cn(
                  'min-h-[100px] rounded-lg border p-1.5 text-sm transition-colors',
                  day ? 'border-border cursor-pointer hover:bg-muted/30' : 'border-transparent cursor-default',
                  isToday && 'border-primary bg-primary/5 hover:bg-primary/10'
                )}
              >
                {day && (
                  <>
                    <span className={cn('text-xs font-medium', isToday && 'text-primary')}>{day}</span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => handleEventClick(e, event)}
                          className="flex items-center gap-1.5 rounded px-1.5 py-1 text-[10px] hover:bg-accent/80 transition-colors"
                        >
                          <div className={cn('h-2 w-2 shrink-0 rounded-full', EVENT_COLORS[event.event_type] || EVENT_COLORS.custom)} />
                          <span className={cn('truncate', event.status === 'completed' && 'line-through opacity-60')}>
                            {event.title}
                          </span>
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

      <Card className="p-5">
        <h2 className="mb-4 font-semibold flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" /> Upcoming Events
        </h2>
        
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Clock className="h-4 w-4 animate-spin" /> <span className="text-sm">Loading events...</span>
          </div>
        ) : upcomingEventsList.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
            <CalendarDays className="h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">No upcoming events</p>
            <p className="text-xs">Create events to schedule site visits, meetings, and deadlines</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEventsList.map((event) => {
              const eventDate = new Date(event.start_date);
              return (
                <div key={event.id} onClick={(e) => handleEventClick(e as any, event)} className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/40 transition-colors">
                  <div className={cn('h-3 w-3 shrink-0 rounded-full', EVENT_COLORS[event.event_type] || EVENT_COLORS.custom)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {MONTHS[eventDate.getMonth()]} {eventDate.getDate()}, {eventDate.getFullYear()}
                      {!event.all_day && ` · ${eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <AddEventModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={refetch}
        initialDate={selectedDate}
        eventToEdit={eventToEdit}
      />

      <EventDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        event={selectedEvent}
        onEdit={(e) => {
          setEventToEdit(e);
          setDetailModalOpen(false);
          setAddModalOpen(true);
        }}
        onSuccess={refetch}
      />
    </div>
  );
}
