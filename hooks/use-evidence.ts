'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import type { VerificationEvidence } from '@/lib/types';

export function useEvidence(projectId: string | null) {
  const [evidence, setEvidence] = React.useState<VerificationEvidence[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!projectId) {
      setEvidence([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('verification_evidence')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setEvidence((data as VerificationEvidence[]) || []);
      setError(null);
    }
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { evidence, loading, error, refetch: load };
}

export function useEvidenceStats(projectId: string | null) {
  const [stats, setStats] = React.useState<{
    total: number;
    photos: number;
    videos: number;
    droneImages: number;
    droneVideos: number;
    valid: number;
    warning: number;
    rejected: number;
    pending: number;
    gpsValid: number;
    avgFraudScore: number;
    mapMarkers: { lat: number; lng: number; status: string; type: string }[];
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!projectId) {
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('verification_evidence')
      .select('evidence_type, validation_status, fraud_score, latitude, longitude')
      .eq('project_id', projectId);

    if (data) {
      const gpsValid = data.filter(
        (e: { latitude: number | null; longitude: number | null }) =>
          e.latitude != null && e.longitude != null
      ).length;
      setStats({
        total: data.length,
        photos: data.filter((e: { evidence_type: string }) => e.evidence_type === 'photo').length,
        videos: data.filter((e: { evidence_type: string }) => e.evidence_type === 'video').length,
        droneImages: data.filter((e: { evidence_type: string }) => e.evidence_type === 'drone_image').length,
        droneVideos: data.filter((e: { evidence_type: string }) => e.evidence_type === 'drone_video').length,
        valid: data.filter((e: { validation_status: string }) => e.validation_status === 'valid').length,
        warning: data.filter((e: { validation_status: string }) => e.validation_status === 'warning').length,
        rejected: data.filter((e: { validation_status: string }) => e.validation_status === 'rejected').length,
        pending: data.filter((e: { validation_status: string }) => e.validation_status === 'pending').length,
        gpsValid,
        avgFraudScore: data.length > 0
          ? Math.round(data.reduce((sum: number, e: { fraud_score: number }) => sum + e.fraud_score, 0) / data.length)
          : 0,
        mapMarkers: data
          .filter((e: { latitude: number | null; longitude: number | null }) => e.latitude != null && e.longitude != null)
          .map((e: { latitude: number; longitude: number; validation_status: string; evidence_type: string }) => ({
            lat: e.latitude,
            lng: e.longitude,
            status: e.validation_status,
            type: e.evidence_type,
          })),
      });
    }
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, refetch: load };
}

export function useAllEvidenceAdmin() {
  const [evidence, setEvidence] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('verification_evidence')
      .select('*, projects(name, project_type)')
      .order('created_at', { ascending: false })
      .limit(200);

    setEvidence(data || []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return { evidence, loading, refetch: load };
}
