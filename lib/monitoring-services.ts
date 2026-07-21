import { supabase } from '@/lib/supabase/client';
import { sendNotification, logActivity } from '@/lib/voc-services';
import type { Database } from '@/lib/database.types';

export type MonitoringAssignment = Database['public']['Tables']['project_monitoring_assignments']['Row'];
export type MonitoringReport = Database['public']['Tables']['project_monitoring_reports']['Row'];

export async function getPendingMonitoringAssignments(verifierId: string) {
  const { data, error } = await supabase
    .from('project_monitoring_assignments')
    .select(`
      *,
      project_partnerships ( service_type, start_date, budget_usd ),
      projects ( name, location_name, owner_id ),
      profiles!project_monitoring_assignments_company_id_fkey ( full_name, email )
    `)
    .eq('verifier_id', verifierId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching pending monitoring assignments:', error);
    return [];
  }
  return data;
}

export async function acceptMonitoringAssignment(assignmentId: string, verifierName: string) {
  const { data: assignment, error } = await supabase
    .from('project_monitoring_assignments')
    .update({ status: 'accepted' })
    .eq('id', assignmentId)
    .select('*, projects (name, owner_id)')
    .single();

  if (error || !assignment) {
    console.error('Error accepting monitoring assignment:', error);
    throw error;
  }

  // Create activity log
  await logActivity({
    projectId: assignment.project_id,
    eventType: 'monitoring_accepted',
    title: 'Monitoring Accepted',
    description: `${verifierName} has accepted the monthly monitoring assignment.`,
    actorName: verifierName,
    actorRole: 'Verifier',
    metadata: { assignment_id: assignmentId },
  });

  // Notify Owner & Company
  const ownerId = assignment.projects?.owner_id;
  const companyId = assignment.company_id;
  
  if (ownerId) {
    await sendNotification({
      title: 'Monitoring Accepted',
      body: `${verifierName} has accepted the monthly monitoring assignment.`,
      type: 'monitoring_accepted',
      targetUserId: ownerId,
    });
  }
  
  if (companyId) {
    await sendNotification({
      title: 'Monitoring Accepted',
      body: `${verifierName} has accepted the monthly monitoring assignment.`,
      type: 'monitoring_accepted',
      targetUserId: companyId,
    });
  }

  return assignment;
}

export async function declineMonitoringAssignment(assignmentId: string, verifierName: string) {
  const { data: assignment, error } = await supabase
    .from('project_monitoring_assignments')
    .update({ status: 'declined' })
    .eq('id', assignmentId)
    .select('*, projects (name, owner_id)')
    .single();

  if (error || !assignment) {
    console.error('Error declining monitoring assignment:', error);
    throw error;
  }

  // Create activity log
  await logActivity({
    projectId: assignment.project_id,
    eventType: 'monitoring_declined',
    title: 'Monitoring Declined',
    description: `${verifierName} has declined the monthly monitoring assignment.`,
    actorName: verifierName,
    actorRole: 'Verifier',
    metadata: { assignment_id: assignmentId },
  });

  // Notify Owner & Company
  const ownerId = assignment.projects?.owner_id;
  const companyId = assignment.company_id;
  
  if (ownerId) {
    await sendNotification({
      title: 'Monitoring Declined',
      body: `${verifierName} has declined the monthly monitoring assignment.`,
      type: 'monitoring_declined',
      targetUserId: ownerId,
    });
  }
  
  if (companyId) {
    await sendNotification({
      title: 'Monitoring Declined',
      body: `${verifierName} has declined the monthly monitoring assignment.`,
      type: 'monitoring_declined',
      targetUserId: companyId,
    });
  }
}

export async function getAcceptedMonitoringAssignments(verifierId: string) {
  const { data, error } = await supabase
    .from('project_monitoring_assignments')
    .select(`
      *,
      project_partnerships ( service_type, start_date, budget_usd ),
      projects ( name, location_name, owner_id, status ),
      profiles!project_monitoring_assignments_company_id_fkey ( full_name, email )
    `)
    .eq('verifier_id', verifierId)
    .eq('status', 'accepted');

  if (error) {
    console.error('Error fetching accepted monitoring assignments:', error);
    return [];
  }
  return data;
}

export async function getMonitoringAssignment(assignmentId: string) {
  const { data, error } = await supabase
    .from('project_monitoring_assignments')
    .select(`
      *,
      project_partnerships ( service_type, start_date, budget_usd ),
      projects ( name, location_name, owner_id, status ),
      profiles!project_monitoring_assignments_company_id_fkey ( full_name, email )
    `)
    .eq('id', assignmentId)
    .single();

  if (error) {
    console.error('Error fetching monitoring assignment:', error);
    return null;
  }
  return data;
}

export async function getMonitoringReports(assignmentId: string) {
  const { data, error } = await supabase
    .from('project_monitoring_reports')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('report_date', { ascending: false });
    
  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
  return data;
}

export async function getPreviousMonitoringReport(projectId: string, beforeDate: Date | string = new Date()) {
  const { data, error } = await supabase
    .from('project_monitoring_reports')
    .select('*')
    .eq('project_id', projectId)
    .lt('report_date', new Date(beforeDate).toISOString().split('T')[0])
    .order('report_date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching previous monitoring report:', error);
    return null;
  }
  return data || null;
}

export async function submitMonitoringReport(reportData: Omit<MonitoringReport, 'id' | 'created_at' | 'updated_at'>, verifierName: string) {
  const { data: report, error } = await supabase
    .from('project_monitoring_reports')
    .insert(reportData)
    .select('*, projects (name, owner_id), project_monitoring_assignments (company_id)')
    .single();

  if (error || !report) {
    console.error('Error submitting monitoring report:', error);
    throw error;
  }

  const monthYear = new Date(reportData.report_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const albumName = `Monitoring Visit - ${monthYear}`;

  // 1. Ensure album exists (create if missing)
  await getOrCreateMonitoringAlbum(reportData.project_id, albumName, reportData.verifier_id);

  // 2. Generate Official Record (PDF placeholder)
  // Retrieve request_id to link official record if necessary. If not, we might need a workaround since voc_official_records expects request_id.
  // We'll fetch the project's verification request if possible, or leave it blank if allowed.
  // Actually, voc_official_records requires request_id.
  const { data: req } = await supabase.from('voc_requests').select('id').eq('project_id', reportData.project_id).limit(1).single();
  if (req) {
    await supabase.from('voc_official_records').insert({
      request_id: req.id,
      record_type: 'monitoring_report',
      title: `${albumName} Report`,
      description: `Monitoring report submitted by ${verifierName}`,
      verifier_name: verifierName,
      file_name: `monitoring-report-${report.id}.pdf`
    });
  }

  // 3. Create activity logs
  await logActivity({
    projectId: report.project_id,
    eventType: 'monitoring_submitted',
    title: 'Monitoring Submitted',
    description: `${verifierName} submitted the ${monthYear} monitoring report.`,
    actorName: verifierName,
    actorRole: 'Verifier',
    metadata: { report_id: report.id },
  });

  await logActivity({
    projectId: report.project_id,
    eventType: 'monitoring_report_generated',
    title: 'Report Generated',
    description: `Official PDF generated for ${monthYear} monitoring visit.`,
    actorName: 'System',
    actorRole: 'System',
    metadata: { report_id: report.id },
  });

  // 4. Notify Owner & Company
  const ownerId = report.projects?.owner_id;
  const companyId = report.project_monitoring_assignments?.company_id;
  
  if (ownerId) {
    await sendNotification({
      title: 'Monitoring Report Submitted',
      body: `${verifierName} submitted a new monthly monitoring report for ${monthYear}.`,
      type: 'monitoring_submitted',
      targetUserId: ownerId,
    });
  }
  
  if (companyId) {
    await sendNotification({
      title: 'Monitoring Report Submitted',
      body: `${verifierName} submitted a new monthly monitoring report for ${monthYear}.`,
      type: 'monitoring_submitted',
      targetUserId: companyId,
    });
  }

  return report;
}

export async function getOrCreateMonitoringAlbum(projectId: string, albumName: string, verifierId: string) {
  // Check if it exists
  const { data: existing } = await supabase
    .from('project_albums')
    .select('id')
    .eq('project_id', projectId)
    .eq('name', albumName)
    .single();

  if (existing) return existing.id;

  // Create if missing
  const { data: newAlbum } = await supabase
    .from('project_albums')
    .insert({
      project_id: projectId,
      name: albumName,
      description: 'Media collected during the monitoring visit',
      created_by: verifierId
    })
    .select('id')
    .single();
    
  return newAlbum?.id;
}

