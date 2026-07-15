'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function checkRateLimit(
  identifier: string,
  action: string,
  maxAttempts: number = 5,
  windowSeconds: number = 300,
  lockoutSeconds: number = 900
) {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: identifier,
    p_action: action,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
    p_lockout_seconds: lockoutSeconds,
  });

  if (error) {
    console.error('Rate limit check failed:', error);
    throw new Error('Rate limit check failed');
  }

  return data as {
    allowed: boolean;
    locked: boolean;
    attempts: number;
    remaining: number;
    reset_at: string;
  };
}

export async function resetRateLimit(identifier: string, action: string) {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.rpc('reset_rate_limit', {
    p_identifier: identifier,
    p_action: action,
  });

  if (error) {
    console.error('Rate limit reset failed:', error);
    throw new Error('Rate limit reset failed');
  }
}

export async function logSecurityEvent(input: {
  userId?: string;
  eventType: string;
  severity?: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
  details?: Record<string, unknown>;
}) {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.from('security_events').insert({
    user_id: input.userId ?? null,
    event_type: input.eventType,
    severity: input.severity ?? 'low',
    ip_address: input.ipAddress ?? null,
    device: input.device ?? null,
    browser: input.browser ?? null,
    details: input.details ?? null,
  });

  if (error) {
    console.error('Security event logging failed:', error);
    throw new Error('Security event logging failed');
  }
}

export async function getFailedLoginAttempts(
  identifier: string,
  windowMinutes: number = 15
): Promise<number> {
  const supabase = await getSupabaseServerClient();
  const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from('security_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'failed_login')
    .eq('details->>identifier', identifier)
    .gte('created_at', cutoff);

  if (error) {
    console.error('Failed login query failed:', error);
    throw new Error('Failed login query failed');
  }

  return count ?? 0;
}

export async function checkBruteForce(identifier: string) {
  const attempts = await getFailedLoginAttempts(identifier, 15);

  if (attempts > 10) {
    await logSecurityEvent({
      eventType: 'brute_force_detected',
      severity: 'critical',
      details: { identifier, failedAttempts: attempts },
    });

    return { blocked: true };
  }

  return { blocked: false };
}

export async function getSessionInfo() {
  return {
    timestamp: new Date().toISOString(),
    sessionId: crypto.randomUUID(),
    environment: process.env.NODE_ENV ?? 'development',
  };
}
