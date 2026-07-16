'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';

type NotificationType = 'verification' | 'monitoring' | 'event' | 'system' | 'passport';

interface NotifyParams {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  link?: string;
}

/**
 * Centralized notification service.
 * Uses insert_notification() SECURITY DEFINER function for cross-user notifications.
 */
export async function notify({ userId, title, body, type, link }: NotifyParams) {
  try {
    const supabase = await getSupabaseServerClient();

    // Use SECURITY DEFINER function to bypass RLS for cross-user notifications
    const { data, error } = await supabase.rpc('insert_notification', {
      p_user_id: userId,
      p_title: title,
      p_body: body,
      p_type: type,
      p_link: link || null,
    });

    if (error) {
      console.error('Notification failed:', error.message);
    }

    return { error, data };
  } catch (err) {
    console.error('Notification failed:', err);
    return { error: err };
  }
}

/**
 * Send notifications to multiple users at once.
 */
export async function notifyMany(userIds: string[], params: Omit<NotifyParams, 'userId'>) {
  try {
    const supabase = await getSupabaseServerClient();

    // Insert each notification via the SECURITY DEFINER function
    const results = await Promise.allSettled(
      userIds.map((userId) =>
        supabase.rpc('insert_notification', {
          p_user_id: userId,
          p_title: params.title,
          p_body: params.body,
          p_type: params.type,
          p_link: params.link || null,
        })
      )
    );

    const errors = results.filter((r) => r.status === 'rejected');
    if (errors.length > 0) {
      console.error('Batch notification failed:', errors.length, 'of', userIds.length);
    }

    return { error: errors.length > 0 ? errors : null };
  } catch (err) {
    console.error('Batch notification failed:', err);
    return { error: err };
  }
}
