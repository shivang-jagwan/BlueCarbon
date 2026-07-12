'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useProjects } from '@/hooks/use-projects';
import { createEvent, updateEvent } from '@/hooks/use-calendar';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { CalendarEvent, CalendarEventType, CalendarEventPriority } from '@/lib/types';
import { Switch } from '@/components/ui/switch';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date;
  eventToEdit?: CalendarEvent;
  fixedProjectId?: string;
}

export function AddEventModal({ isOpen, onClose, onSuccess, initialDate, eventToEdit, fixedProjectId }: AddEventModalProps) {
  const { user } = useAuth();
  const { projects, loading: loadingProjects } = useProjects();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [eventType, setEventType] = React.useState<CalendarEventType | ''>('');
  const [priority, setPriority] = React.useState<CalendarEventPriority>('medium');
  const [projectId, setProjectId] = React.useState<string>('none');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [allDay, setAllDay] = React.useState(false);
  const [location, setLocation] = React.useState('');
  const [meetingLink, setMeetingLink] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setTitle(eventToEdit.title);
        setDescription(eventToEdit.description || '');
        setEventType(eventToEdit.event_type as CalendarEventType);
        setPriority(eventToEdit.priority);
        setProjectId(eventToEdit.project_id || 'none');
        setStartDate(new Date(eventToEdit.start_date).toISOString().slice(0, 16));
        setEndDate(new Date(eventToEdit.end_date).toISOString().slice(0, 16));
        setAllDay(eventToEdit.all_day);
        setLocation(eventToEdit.location || '');
        setMeetingLink(eventToEdit.meeting_link || '');
      } else {
        setTitle('');
        setDescription('');
        setEventType('');
        setPriority('medium');
        setProjectId(fixedProjectId || 'none');
        const defaultDate = initialDate ? new Date(initialDate) : new Date();
        defaultDate.setHours(9, 0, 0, 0);
        setStartDate(defaultDate.toISOString().slice(0, 16));
        
        const defaultEnd = new Date(defaultDate);
        defaultEnd.setHours(10, 0, 0, 0);
        setEndDate(defaultEnd.toISOString().slice(0, 16));
        setAllDay(false);
        setLocation('');
        setMeetingLink('');
      }
    }
  }, [isOpen, eventToEdit, initialDate, fixedProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate || !eventType) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date cannot be before start date.');
      return;
    }

    setIsSubmitting(true);
    
    const eventData: Partial<CalendarEvent> = {
      title,
      description: description || null,
      event_type: eventType,
      priority,
      project_id: projectId === 'none' ? null : projectId,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      all_day: allDay,
      location: location || null,
      meeting_link: meetingLink || null,
    };

    let result;
    if (eventToEdit) {
      result = await updateEvent(eventToEdit.id, eventData, user?.id);
    } else {
      eventData.created_by = user?.id;
      result = await createEvent(eventData);
    }

    setIsSubmitting(false);

    if (result.error) {
      toast.error((result.error as any).message || 'Failed to save event');
    } else {
      toast.success(eventToEdit ? 'Event updated!' : 'Event created!');
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{eventToEdit ? 'Edit Event' : 'Add Event'}</DialogTitle>
          <DialogDescription className="sr-only">Create or edit a calendar event</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type *</Label>
              <Select value={eventType} onValueChange={(val) => setEventType(val as CalendarEventType)}>
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="Choose type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verification">Verification</SelectItem>
                  <SelectItem value="monthly_monitoring">Monthly Monitoring</SelectItem>
                  <SelectItem value="site_visit">Site Visit</SelectItem>
                  <SelectItem value="drone_survey">Drone Survey</SelectItem>
                  <SelectItem value="project_deadline">Project Deadline</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="support_review">Support Review</SelectItem>
                  <SelectItem value="ngo_visit">NGO Visit</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as CalendarEventPriority)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Related Project (Optional)</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={loadingProjects || !!fixedProjectId}>
              <SelectTrigger id="project">
                <SelectValue placeholder={loadingProjects ? "Loading..." : "None"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Personal Event)</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 py-2">
            <Switch id="allDay" checked={allDay} onCheckedChange={setAllDay} />
            <Label htmlFor="allDay">All-day event</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start *</Label>
              <Input 
                id="startDate" 
                type={allDay ? "date" : "datetime-local"} 
                value={allDay ? startDate.split('T')[0] : startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End *</Label>
              <Input 
                id="endDate" 
                type={allDay ? "date" : "datetime-local"} 
                value={allDay ? endDate.split('T')[0] : endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Physical location or City" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingLink">Meeting Link</Label>
            <Input id="meetingLink" type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description & Notes</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
