'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AuditLog, AuditSeverity, AuditAction, SecurityEvent, SecurityEventType } from '@/lib/types';

export function useAuditLogs(filters?: {
  userId?: string;
  action?: AuditAction;
  resourceType?: string;
  severity?: AuditSeverity;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.userId) params.set('user_id', filters.userId);
      if (filters?.action) params.set('action', filters.action);
      if (filters?.resourceType) params.set('resource_type', filters.resourceType);
      if (filters?.severity) params.set('severity', filters.severity);
      if (filters?.dateFrom) params.set('date_from', filters.dateFrom);
      if (filters?.dateTo) params.set('date_to', filters.dateTo);
      if (filters?.page !== undefined) params.set('page', String(filters.page));
      const qs = params.toString();
      const url = `/api/audit${qs ? `?${qs}` : ''}`;
      const response = await globalThis.fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch {
      console.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters?.userId, filters?.action, filters?.resourceType, filters?.severity, filters?.dateFrom, filters?.dateTo, filters?.page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return { logs, total, loading, refetch: loadLogs };
}

export function useAuditStats() {
  const [stats, setStats] = useState<{
    total_logs: number;
    by_severity: Record<AuditSeverity, number>;
    by_action: Record<string, number>;
    recent_critical: number;
    unique_users: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await globalThis.fetch('/api/audit/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch {
      console.error('Failed to fetch audit stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading };
}

export function useSecurityEvents(filters?: {
  userId?: string;
  eventType?: SecurityEventType;
  severity?: AuditSeverity;
  resolved?: boolean;
  page?: number;
}) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.userId) params.set('user_id', filters.userId);
      if (filters?.eventType) params.set('event_type', filters.eventType);
      if (filters?.severity) params.set('severity', filters.severity);
      if (filters?.resolved !== undefined) params.set('resolved', String(filters.resolved));
      if (filters?.page !== undefined) params.set('page', String(filters.page));
      const qs = params.toString();
      const url = `/api/audit/security${qs ? `?${qs}` : ''}`;
      const response = await globalThis.fetch(url);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setTotal(data.total || 0);
      }
    } catch {
      console.error('Failed to fetch security events');
    } finally {
      setLoading(false);
    }
  }, [filters?.userId, filters?.eventType, filters?.severity, filters?.resolved, filters?.page]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return { events, total, loading, refetch: loadEvents };
}

export function useVerifyAuditIntegrity(logId: string | null) {
  const [result, setResult] = useState<{
    valid: boolean;
    checksum_valid: boolean;
    chain_valid: boolean;
    details: Record<string, unknown>;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = useCallback(async () => {
    if (!logId) return;
    setLoading(true);
    try {
      const response = await globalThis.fetch(`/api/audit/${logId}/verify`);
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch {
      console.error('Failed to verify audit integrity');
    } finally {
      setLoading(false);
    }
  }, [logId]);

  useEffect(() => {
    verify();
  }, [verify]);

  return { result, loading };
}
