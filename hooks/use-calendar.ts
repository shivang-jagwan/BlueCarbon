import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { sendNotification } from '@/lib/voc-services';
import type { CalendarEvent } from '@/lib/types';
import { toast } from 'sonner';

export function useCalendarEvents(projectId?: string | null) {
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchEvents = React.useCallback(async () => {
    setLoading(true);
    let query = supabase.from('calendar_events').select('*').order('start_date', { ascending: true });
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    const { data, error } = await query;
    if (error) {
      toast.error('Failed to fetch calendar events');
    } else {
      setEvents((data as CalendarEvent[]) || []);
    }
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, refetch: fetchEvents };
}

export async function createEvent(eventData: Partial<CalendarEvent>) {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({ ...eventData, status: 'upcoming' })
      .select()
      .single();

    if (error) throw error;

    // Log Activity
    if (eventData.project_id && eventData.created_by) {
      await supabase.from('project_activity').insert({
        project_id: eventData.project_id,
        actor_id: eventData.created_by,
        event_type: 'event_created',
        title: 'Event Scheduled',
        description: `Scheduled "${eventData.title}" for ${new Date(eventData.start_date!).toLocaleDateString()}`,
      });
    }

    // Send Notification
    if (eventData.assigned_to && eventData.assigned_to !== eventData.created_by) {
      await sendNotification({
        title: 'New Calendar Event Assigned',
        body: `You have been assigned to: ${eventData.title}`,
        type: 'event',
        targetUserId: eventData.assigned_to,
        link: '/dashboard/calendar',
      });
    }

    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err };
  }
}

export async function updateEvent(id: string, updates: Partial<CalendarEvent>, actorId?: string) {
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (updates.project_id && actorId) {
       await supabase.from('project_activity').insert({
        project_id: updates.project_id,
        actor_id: actorId,
        event_type: updates.status === 'completed' ? 'event_completed' : 'event_updated',
        title: updates.status === 'completed' ? 'Event Completed' : 'Event Updated',
        description: updates.status === 'completed' 
          ? `Completed "${data.title}"` 
          : `Updated details for "${data.title}"`,
      });
    }

    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err };
  }
}

export async function deleteEvent(id: string, projectId?: string | null, actorId?: string | null) {
  try {
    // Need to fetch title before delete for activity logging
    let eventTitle = 'Event';
    if (projectId && actorId) {
      const { data: existing } = await supabase.from('calendar_events').select('title').eq('id', id).single();
      if (existing) eventTitle = existing.title;
    }

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (projectId && actorId) {
      await supabase.from('project_activity').insert({
        project_id: projectId,
        actor_id: actorId,
        event_type: 'event_cancelled',
        title: 'Event Cancelled',
        description: `Cancelled event "${eventTitle}"`,
      });
    }

    return { error: null };
  } catch (err: unknown) {
    return { error: err };
  }
}
