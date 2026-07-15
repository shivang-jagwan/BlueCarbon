'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { VerificationEvidence } from '@/lib/types';

export async function createEvidenceRecord(data: {
  project_id: string;
  verification_request_id?: string | null;
  storage_path: string;
  evidence_type: string;
  latitude?: number | null;
  longitude?: number | null;
  gps_accuracy_meters?: number | null;
  gps_source?: string | null;
  capture_timestamp?: string | null;
  device_name?: string | null;
  device_model?: string | null;
  device_platform?: string | null;
  exif_data?: Record<string, unknown> | null;
  file_hash?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  original_filename?: string | null;
  monitoring_notes?: string | null;
  validation_status?: string;
  fraud_score?: number;
  fraud_flags?: string[] | null;
  validation_notes?: Record<string, unknown> | null;
  photo_url?: string | null;
  video_url?: string | null;
  drone_image_url?: string | null;
  drone_video_url?: string | null;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const insertData: Record<string, unknown> = {
    project_id: data.project_id,
    uploaded_by: user.id,
    storage_path: data.storage_path,
    evidence_type: data.evidence_type,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    gps_accuracy_meters: data.gps_accuracy_meters ?? null,
    gps_source: data.gps_source ?? null,
    capture_timestamp: data.capture_timestamp ?? null,
    device_name: data.device_name ?? null,
    device_model: data.device_model ?? null,
    device_platform: data.device_platform ?? null,
    exif_data: data.exif_data ?? null,
    file_hash: data.file_hash ?? null,
    file_size: data.file_size ?? null,
    mime_type: data.mime_type ?? null,
    original_filename: data.original_filename ?? null,
    monitoring_notes: data.monitoring_notes ?? null,
    validation_status: data.validation_status ?? 'pending',
    fraud_score: data.fraud_score ?? 0,
    fraud_flags: data.fraud_flags ?? null,
    validation_notes: data.validation_notes ?? null,
    photo_url: data.photo_url ?? null,
    video_url: data.video_url ?? null,
    drone_image_url: data.drone_image_url ?? null,
    drone_video_url: data.drone_video_url ?? null,
  };

  if (data.verification_request_id) {
    insertData.verification_request_id = data.verification_request_id;
  }

  const { data: evidence, error } = await supabase
    .from('verification_evidence')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('project_activity').insert({
    project_id: data.project_id,
    actor_id: user.id,
    event_type: 'evidence_uploaded',
    title: 'Verification Evidence Uploaded',
    description: `Uploaded ${data.evidence_type.replace('_', ' ')}: ${data.original_filename || 'file'}`,
  });

  // Notify owner
  const { data: project } = await supabase
    .from('projects')
    .select('owner_id, name')
    .eq('id', data.project_id)
    .single();

  if (project?.owner_id && project.owner_id !== user.id) {
    await supabase.from('notifications').insert({
      user_id: project.owner_id,
      title: 'Evidence Uploaded',
      body: `New ${data.evidence_type.replace('_', ' ')} uploaded for "${project.name}"`,
      type: 'monitoring',
      link: `/dashboard/projects/${data.project_id}/evidence`,
    });
  }

  // Notify admin
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (admins && admins.length > 0) {
    const adminNotifications = admins.map((admin: { id: string }) => ({
      user_id: admin.id,
      title: 'Evidence Uploaded',
      body: `New ${data.evidence_type.replace('_', ' ')} uploaded for "${project?.name || 'project'}"`,
      type: 'monitoring' as const,
      link: `/admin/evidence`,
    }));
    await supabase.from('notifications').insert(adminNotifications);
  }

  return evidence;
}

export async function getEvidenceForProject(projectId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('verification_evidence')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as VerificationEvidence[];
}

export async function getEvidenceStats(projectId: string) {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from('verification_evidence')
    .select('evidence_type, validation_status, fraud_score, latitude, longitude')
    .eq('project_id', projectId);

  if (!data) return null;

  return {
    total: data.length,
    photos: data.filter((e) => e.evidence_type === 'photo').length,
    videos: data.filter((e) => e.evidence_type === 'video').length,
    droneImages: data.filter((e) => e.evidence_type === 'drone_image').length,
    droneVideos: data.filter((e) => e.evidence_type === 'drone_video').length,
    valid: data.filter((e) => e.validation_status === 'valid').length,
    warning: data.filter((e) => e.validation_status === 'warning').length,
    rejected: data.filter((e) => e.validation_status === 'rejected').length,
    pending: data.filter((e) => e.validation_status === 'pending').length,
    gpsValid: data.filter((e) => e.latitude != null && e.longitude != null).length,
    avgFraudScore: data.length > 0
      ? Math.round(data.reduce((sum, e) => sum + e.fraud_score, 0) / data.length)
      : 0,
    mapMarkers: data
      .filter((e) => e.latitude != null && e.longitude != null)
      .map((e) => ({
        lat: e.latitude!,
        lng: e.longitude!,
        status: e.validation_status,
        type: e.evidence_type,
      })),
  };
}

export async function getAllEvidenceAdmin() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('verification_evidence')
    .select('*, projects(name, project_type), profiles!verification_evidence_uploaded_by_fkey(full_name, organization)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;
  return data || [];
}

export async function deleteEvidence(evidenceId: string, storagePath: string) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Delete from storage
  await supabase.storage.from('evidence-verified').remove([storagePath]);

  // Delete record
  const { error } = await supabase
    .from('verification_evidence')
    .delete()
    .eq('id', evidenceId);

  if (error) throw error;
}

export async function updateEvidenceValidation(
  evidenceId: string,
  validationStatus: string,
  fraudScore: number,
  fraudFlags: string[],
  validationNotes: Record<string, unknown>
) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from('verification_evidence')
    .update({
      validation_status: validationStatus,
      fraud_score: fraudScore,
      fraud_flags: fraudFlags,
      validation_notes: validationNotes,
    })
    .eq('id', evidenceId);

  if (error) throw error;
}
