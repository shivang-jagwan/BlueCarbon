'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  AiAnalysis,
  AiAnalysisType,
  AiRecommendation,
  AiRiskLevel,
} from '@/lib/types';

export function useAiAnalyses(projectId: string | null | undefined) {
  const [analyses, setAnalyses] = useState<AiAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalyses = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await globalThis.fetch(`/api/ai-analysis?project_id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses || []);
      }
    } catch {
      console.error('Failed to fetch AI analyses');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  return { analyses, loading, refetch: loadAnalyses };
}

export function useAiAnalysesByRequest(requestId: string | null | undefined) {
  const [analyses, setAnalyses] = useState<AiAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalyses = useCallback(async () => {
    if (!requestId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await globalThis.fetch(`/api/ai-analysis?request_id=${requestId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.analyses || []);
      }
    } catch {
      console.error('Failed to fetch AI analyses for request');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  return { analyses, loading, refetch: loadAnalyses };
}

export function useAiAnalysisStats(projectId?: string) {
  const [stats, setStats] = useState<{
    total: number;
    avg_confidence: number;
    agreement_rate: number;
    by_recommendation: Record<AiRecommendation, number>;
    by_risk_level: Record<AiRiskLevel, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const url = projectId
          ? `/api/ai-analysis/stats?project_id=${projectId}`
          : '/api/ai-analysis/stats';
        const response = await globalThis.fetch(url);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch {
        console.error('Failed to fetch AI stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [projectId]);

  return { stats, loading };
}

export function useCreateAiAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (input: {
    project_id: string;
    verification_request_id?: string;
    analysis_type: AiAnalysisType;
    confidence_score: number;
    recommendation: AiRecommendation;
    reasoning?: string;
    risk_level: AiRiskLevel;
    evidence_used?: Record<string, unknown>;
    detected_risks?: Record<string, unknown>;
    observations?: Record<string, unknown>;
    vegetation_score?: number;
    carbon_estimate?: number;
    similarity_score?: number;
    gps_consistency_score?: number;
    ownership_verification_score?: number;
    notes?: string;
  }): Promise<AiAnalysis | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await globalThis.fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to create AI analysis');
      const data = await response.json();
      return data.analysis as AiAnalysis;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useUpdateAiAnalysis() {
  const [loading, setLoading] = useState(false);

  const update = async (
    id: string,
    input: {
      verifier_agreed_with_ai?: boolean;
      verifier_override_reason?: string;
      notes?: string;
    }
  ): Promise<AiAnalysis | null> => {
    setLoading(true);
    try {
      const response = await globalThis.fetch(`/api/ai-analysis/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to update AI analysis');
      const data = await response.json();
      return data.analysis as AiAnalysis;
    } catch (err) {
      console.error('Failed to update AI analysis:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading };
}
