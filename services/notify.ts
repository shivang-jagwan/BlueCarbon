import { supabase } from '@/lib/supabase/client';

type NotificationType = 'verification' | 'monitoring' | 'support' | 'event' | 'system' | 'passport';

interface NotifyParams {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  link?: string;
}

/**
 * Centralized notification service.
 * All platform notifications should go through this function
 * to ensure consistent format, logging, and future extensibility
 * (e.g., email digests, push notifications, in-app only).
 */
export async function notify({ userId, title, body, type, link }: NotifyParams) {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      body,
      type,
      link: link || null,
    });

    if (error) {
      console.error('Notification failed:', error.message);
    }

    return { error };
  } catch (err) {
    console.error('Notification failed:', err);
    return { error: err };
  }
}

/**
 * Send notifications to multiple users at once.
 */
export async function notifyMany(userIds: string[], params: Omit<NotifyParams, 'userId'>) {
  const rows = userIds.map((userId) => ({
    user_id: userId,
    title: params.title,
    body: params.body,
    type: params.type,
    link: params.link || null,
  }));

  try {
    const { error } = await supabase.from('notifications').insert(rows);
    if (error) {
      console.error('Batch notification failed:', error.message);
    }
    return { error };
  } catch (err) {
    console.error('Batch notification failed:', err);
    return { error: err };
  }
}
