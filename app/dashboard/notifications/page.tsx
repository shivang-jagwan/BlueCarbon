'use client';

import * as React from 'react';
import { useNotifications } from '@/hooks/use-projects';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const { notifications, loading, refetch } = useNotifications();
  const { user } = useAuthUser();

  const handleMarkRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
      refetch();
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw error;
      toast.success('All notifications marked as read');
      refetch();
    } catch (err) {
      toast.error('Failed to update notifications');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No notifications</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You will be notified about verification updates, activity updates, and more
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                'flex items-start gap-3 p-4 transition-colors',
                !n.read && 'border-primary/30 bg-primary/5'
              )}
            >
              <div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-muted-foreground/30' : 'bg-primary')} />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{n.type}</Badge>
                  {!n.read && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleMarkRead(n.id)}>
                      <Check className="mr-1 h-3 w-3" />
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline hook to avoid circular dependency
import { useAuth } from '@/components/providers/auth-provider';
function useAuthUser() {
  return useAuth();
}
