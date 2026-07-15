'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import type {
  AuditLog,
  AuditAction,
  AuditSeverity,
  SecurityEvent,
  SecurityEventType,
} from '@/lib/types';

interface AuditEventInput {
  userId: string;
  role?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  reason?: string;
  severity?: AuditSeverity;
  sessionId?: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
  location?: Record<string, unknown>;
}

interface AuditLogFilters {
  userId?: string;
  action?: AuditAction;
  resourceType?: string;
  resourceId?: string;
  severity?: AuditSeverity;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

interface SecurityEventFilters {
  userId?: string;
  eventType?: SecurityEventType;
  severity?: AuditSeverity;
  resolved?: boolean;
  page?: number;
  limit?: number;
}

export async function logAuditEvent(input: AuditEventInput) {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.rpc('insert_audit_log', {
    p_user_id: input.userId,
    p_role: input.role ?? null,
    p_action: input.action,
    p_resource_type: input.resourceType,
    p_resource_id: input.resourceId ?? null,
    p_before_state: input.beforeState ? JSON.stringify(input.beforeState) : null,
    p_after_state: input.afterState ? JSON.stringify(input.afterState) : null,
    p_reason: input.reason ?? null,
    p_severity: input.severity ?? 'info',
    p_session_id: input.sessionId ?? null,
    p_ip_address: input.ipAddress ?? null,
    p_device: input.device ?? null,
    p_browser: input.browser ?? null,
    p_location: input.location ? JSON.stringify(input.location) : null,
  });

  if (error) {
    console.error('Failed to insert audit log:', error);
    throw new Error('Audit log insertion failed');
  }
}

export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const supabase = await getSupabaseServerClient();
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 25, 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false });

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters.action) {
    query = query.eq('action', filters.action);
  }
  if (filters.resourceType) {
    query = query.eq('resource_type', filters.resourceType);
  }
  if (filters.resourceId) {
    query = query.eq('resource_id', filters.resourceId);
  }
  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters.dateFrom) {
    query = query.gte('timestamp', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('timestamp', filters.dateTo);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Failed to fetch audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }

  return { logs: (data ?? []) as AuditLog[], total: count ?? 0 };
}

export async function getAuditLogsByUser(
  userId: string,
  page: number = 1,
  limit: number = 25,
) {
  return getAuditLogs({ userId, page, limit });
}

export async function getAuditLogsByProject(
  projectId: string,
  page: number = 1,
  limit: number = 25,
) {
  return getAuditLogs({
    resourceType: 'project',
    resourceId: projectId,
    page,
    limit,
  });
}

export async function getSecurityEvents(filters: SecurityEventFilters = {}) {
  const supabase = await getSupabaseServerClient();
  const page = filters.page ?? 1;
  const limit = Math.min(filters.limit ?? 25, 100);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('security_events')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters.userId) {
    query = query.eq('user_id', filters.userId);
  }
  if (filters.eventType) {
    query = query.eq('event_type', filters.eventType);
  }
  if (filters.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters.resolved !== undefined) {
    query = query.eq('resolved', filters.resolved);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Failed to fetch security events:', error);
    throw new Error('Failed to fetch security events');
  }

  return { events: (data ?? []) as SecurityEvent[], total: count ?? 0 };
}

export async function getAuditStats() {
  const supabase = await getSupabaseServerClient();

  const [totalResult, actionResult, severityResult, roleResult, securityResult] =
    await Promise.all([
      supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('audit_logs')
        .select('action')
        .order('timestamp', { ascending: false })
        .limit(1000),
      supabase
        .from('audit_logs')
        .select('severity')
        .order('timestamp', { ascending: false })
        .limit(1000),
      supabase
        .from('audit_logs')
        .select('role')
        .not('role', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(1000),
      supabase
        .from('security_events')
        .select('id', { count: 'exact', head: true })
        .eq('resolved', false),
    ]);

  if (totalResult.error) {
    console.error('Audit stats query failed:', totalResult.error);
    throw new Error('Audit stats query failed');
  }

  const actionCounts: Record<string, number> = {};
  if (!actionResult.error && actionResult.data) {
    for (const row of actionResult.data) {
      const action = row.action as string;
      actionCounts[action] = (actionCounts[action] ?? 0) + 1;
    }
  }
  const logsByAction = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([action, count]) => ({ action: action as AuditAction, count }));

  const severityCounts: Record<string, number> = {};
  if (!severityResult.error && severityResult.data) {
    for (const row of severityResult.data) {
      const sev = row.severity as string;
      severityCounts[sev] = (severityCounts[sev] ?? 0) + 1;
    }
  }
  const logsBySeverity = Object.entries(severityCounts).map(
    ([severity, count]) => ({ severity: severity as AuditSeverity, count }),
  );

  const roleCounts: Record<string, number> = {};
  if (!roleResult.error && roleResult.data) {
    for (const row of roleResult.data) {
      const role = row.role as string;
      roleCounts[role] = (roleCounts[role] ?? 0) + 1;
    }
  }
  const logsByRole = Object.entries(roleCounts).map(
    ([role, count]) => ({ role, count }),
  );

  return {
    totalLogs: totalResult.count ?? 0,
    logsByAction,
    logsBySeverity,
    logsByRole,
    recentSecurityEvents: securityResult.count ?? 0,
  };
}

export async function verifyAuditIntegrity(logId: string) {
  const supabase = await getSupabaseServerClient();

  const { data: log, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (error || !log) {
    throw new Error(`Audit log ${logId} not found`);
  }

  const { data: verified, error: verifyError } = await supabase.rpc(
    'verify_audit_checksum',
    { p_log_id: logId },
  );

  if (verifyError) {
    console.error('Checksum verification failed:', verifyError);
    throw new Error('Checksum verification failed');
  }

  return {
    valid: verified === true,
    log: log as AuditLog,
  };
}
