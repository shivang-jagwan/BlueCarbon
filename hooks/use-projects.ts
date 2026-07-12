'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import type { Project, ProjectActivity, ProjectFile, MonitoringReport, ProjectSupport, NotificationItem, VerificationServiceRequest, VerificationDecisionRecord, DiscussionComment } from '@/lib/types';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by owner if the user is a project_owner
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile?.role === 'project_owner') {
        query = query.eq('owner_id', user.id);
      }
    }

    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setProjects((data as Project[]) || []);
      setError(null);
    }
    setLoading(false);
  }, [user]);

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

export function useProjectFiles(projectId: string | null) {
  const [files, setFiles] = React.useState<ProjectFile[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!projectId) {
      setFiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    setFiles((data as ProjectFile[]) || []);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { files, loading, refetch: load };
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

export function useProjectSupport(projectId: string | null) {
  const [contributions, setContributions] = React.useState<ProjectSupport[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!projectId) {
      setContributions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('project_support')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    setContributions((data as ProjectSupport[]) || []);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { contributions, loading, refetch: load };
}
export const useFunding = useProjectSupport; // backward compat alias

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
  const [requests, setRequests] = React.useState<VerificationServiceRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!verifierId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('verification_service_requests')
      .select('*, projects(name, owner_id)')
      .eq('verifier_id', verifierId)
      .order('created_at', { ascending: false });
    setRequests((data as VerificationServiceRequest[]) || []);
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
        .from('verification_service_decisions')
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
      .from('project_partnerships')
      .select('projects(*)')
      .eq('verifier_id', verifierId)
      .eq('status', 'active');
    
    if (data) {
      const activeProjects = data.map((d: any) => d.projects).filter(Boolean);
      setProjects(activeProjects);
    } else {
      setProjects([]);
    }
    setLoading(false);
  }, [verifierId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { projects, loading, refetch: load };
}

export function useProjectPartnerships(projectId: string | null) {
  const [partnerships, setPartnerships] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!projectId) {
      setPartnerships([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let rows: any[] = [];

    const { data, error } = await supabase
      .from('project_partnerships')
      .select('*, profiles!project_partnerships_company_id_fkey(full_name, organization), verifier:profiles!project_partnerships_verifier_id_fkey(full_name, organization), owner:profiles!project_partnerships_owner_id_fkey(full_name, organization)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      const { data: fallback } = await supabase
        .from('project_partnerships')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      rows = fallback || [];
    } else {
      rows = data || [];
    }

    setPartnerships(rows);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { partnerships, loading, refetch: load };
}

export function useCarbonPassport(projectId: string | null) {
  const [passport, setPassport] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!projectId) {
      setPassport(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('carbon_passports')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();
    setPassport(data || null);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { passport, loading, refetch: load };
}

export async function issueCarbonPassport(projectId: string, verifierId: string, ownerId: string) {
  try {
    // Insert passport record
    const { data: passport, error: passportError } = await supabase
      .from('carbon_passports')
      .insert({
        project_id: projectId,
        issued_by: verifierId,
        status: 'active',
        // certificate_url will be added later in a real implementation
      })
      .select()
      .single();

    if (passportError) throw passportError;

    // Update project status
    const { error: projectError } = await supabase
      .from('projects')
      .update({
        passport_issued_at: new Date().toISOString(),
        status: 'verified',
      })
      .eq('id', projectId);

    if (projectError) throw projectError;

    // Log Activity
    await supabase.from('project_activity').insert({
      project_id: projectId,
      actor_id: verifierId,
      event_type: 'passport_issued',
      title: 'Carbon Passport Issued',
      description: `Carbon Passport ${passport.id.split('-')[0].toUpperCase()} issued by Verifier.`,
    });

    // Notify Owner
    await supabase.from('notifications').insert({
      user_id: ownerId,
      title: 'Carbon Passport Issued!',
      body: 'Your project has officially received its Carbon Passport.',
      type: 'verification',
      link: `/dashboard/projects/${projectId}/passport`,
    });

    return { data: passport, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}
