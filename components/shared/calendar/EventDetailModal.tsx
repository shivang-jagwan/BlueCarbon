'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { deleteEvent, updateEvent } from '@/hooks/use-calendar';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash, Edit, CheckCircle, Video, MapPin, AlignLeft, Calendar as CalendarIcon, Clock } from 'lucide-react';
import type { CalendarEvent } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onSuccess: () => void;
}

export function EventDetailModal({ event, isOpen, onClose, onEdit, onSuccess }: EventDetailModalProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isCompleting, setIsCompleting] = React.useState(false);

  if (!event) return null;

  const canEdit = event.created_by === user?.id || event.assigned_to === user?.id; // In reality, depends on project roles too, but this is a safe basic check

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    setIsDeleting(true);
    const { error } = await deleteEvent(event.id, event.project_id, user?.id);
    setIsDeleting(false);
    
    if (error) {
      toast.error('Failed to delete event');
    } else {
      toast.success('Event deleted');
      onSuccess();
      onClose();
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    const { error } = await updateEvent(event.id, { status: 'completed' }, user?.id);
    setIsCompleting(false);
    
    if (error) {
      toast.error('Failed to mark event as completed');
    } else {
      toast.success('Event marked as completed');
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between pr-6">
            <span className="text-xl leading-tight">{event.title}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">Event details and actions</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Status & Priority Badges */}
          <div className="flex gap-2">
            <Badge variant="outline" className={cn(
              "capitalize",
              event.status === 'upcoming' && "text-primary border-primary/30",
              event.status === 'completed' && "text-success border-success/30",
              event.status === 'cancelled' && "text-muted-foreground",
              event.status === 'overdue' && "text-destructive border-destructive/30",
            )}>
              {event.status}
            </Badge>
            <Badge variant="secondary" className="capitalize">{event.event_type.replace('_', ' ')}</Badge>
            <Badge variant="secondary" className="capitalize">{event.priority} Priority</Badge>
          </div>

          <div className="grid gap-4 text-sm">
            <div className="flex items-start gap-3">
              <CalendarIcon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-medium">
                  {new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {!event.all_day && (
                  <p className="text-muted-foreground">
                    {new Date(event.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(event.end_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                {event.all_day && <p className="text-muted-foreground">All Day</p>}
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>{event.location}</span>
              </div>
            )}

            {event.meeting_link && (
              <div className="flex items-start gap-3">
                <Video className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <a href={event.meeting_link} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                  {event.meeting_link}
                </a>
              </div>
            )}

            {event.description && (
              <div className="flex items-start gap-3">
                <AlignLeft className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <p className="whitespace-pre-wrap">{event.description}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            {canEdit ? (
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(event); }}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
              </div>
            ) : <div />}
            
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>Close</Button>
              {canEdit && event.status !== 'completed' && (
                <Button variant="default" onClick={handleComplete} disabled={isCompleting}>
                  {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
