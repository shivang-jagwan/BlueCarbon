'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Project, ProjectActivity, ProjectDocument, MonitoringReport, FundingContribution, NotificationItem, VerificationRequest, VerificationDecisionRecord, DiscussionComment } from '@/lib/types';

export function useProjects() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setProjects((data as Project[]) || []);
      setError(null);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return { projects, loading, error, refetch: load };
}

export function useProject(projectId: string | null) {
  const [project, setProject] = React.useState<Project | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();
      if (active) {
        setProject((data as Project) || null);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [projectId]);

  return { project, loading };
}

export function useProjectActivity(projectId: string | null) {
  const [activities, setActivities] = React.useState<ProjectActivity[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!projectId) {
      setActivities([]);
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('project_activity')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (active) {
        setActivities((data as ProjectActivity[]) || []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [projectId]);

  return { activities, loading };
}

export function useProjectDocuments(projectId: string | null) {
  const [documents, setDocuments] = React.useState<ProjectDocument[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!projectId) {
      setDocuments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    setDocuments((data as ProjectDocument[]) || []);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { documents, loading, refetch: load };
}

export function useMonitoringReports(projectId: string | null) {
  const [reports, setReports] = React.useState<MonitoringReport[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!projectId) {
      setReports([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('monitoring_reports')
      .select('*')
      .eq('project_id', projectId)
      .order('period_month', { ascending: false });
    setReports((data as MonitoringReport[]) || []);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { reports, loading, refetch: load };
}

export function useFunding(projectId: string | null) {
  const [contributions, setContributions] = React.useState<FundingContribution[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!projectId) {
      setContributions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('funding_contributions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    setContributions((data as FundingContribution[]) || []);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { contributions, loading, refetch: load };
}

export function useNotifications() {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications((data as NotificationItem[]) || []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return { notifications, loading, refetch: load };
}

export function useVerificationRequests(verifierId: string | null) {
  const [requests, setRequests] = React.useState<VerificationRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!verifierId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('verifier_id', verifierId)
      .order('created_at', { ascending: false });
    setRequests((data as VerificationRequest[]) || []);
    setLoading(false);
  }, [verifierId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { requests, loading, refetch: load };
}

export function useVerificationDecisions(requestId: string | null) {
  const [decisions, setDecisions] = React.useState<VerificationDecisionRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!requestId) {
      setDecisions([]);
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('verification_decisions')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });
      if (active) {
        setDecisions((data as VerificationDecisionRecord[]) || []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [requestId]);

  return { decisions, loading };
}

export function useDiscussionComments(projectId: string | null) {
  const [comments, setComments] = React.useState<DiscussionComment[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!projectId) {
      setComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('discussion_comments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    setComments((data as DiscussionComment[]) || []);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { comments, loading, refetch: load };
}

export function useAssignedProjects(verifierId: string | null) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!verifierId) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('verifier_id', verifierId)
      .order('updated_at', { ascending: false });
    setProjects((data as Project[]) || []);
    setLoading(false);
  }, [verifierId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { projects, loading, refetch: load };
}
