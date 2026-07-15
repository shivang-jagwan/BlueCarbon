'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  ProjectRiskAssessment,
  VerificationReview,
  VerificationConflict,
  DualVerificationSetting,
  VerificationDecision,
} from '@/lib/types';

export function useRiskAssessment(projectId: string | null) {
  const [assessment, setAssessment] = useState<ProjectRiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAssessment = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await globalThis.fetch(`/api/dual-verification/risk?project_id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setAssessment(data.assessment || null);
      }
    } catch {
      console.error('Failed to fetch risk assessment');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadAssessment();
  }, [loadAssessment]);

  return { assessment, loading, refetch: loadAssessment };
}

export function useVerificationReviews(projectId: string | null) {
  const [reviews, setReviews] = useState<VerificationReview[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await globalThis.fetch(`/api/dual-verification/reviews?project_id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch {
      console.error('Failed to fetch verification reviews');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return { reviews, loading, refetch: loadReviews };
}

export function useVerificationReviewsByVerifier(verifierId: string | null) {
  const [reviews, setReviews] = useState<VerificationReview[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = useCallback(async () => {
    if (!verifierId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await globalThis.fetch(`/api/dual-verification/reviews?verifier_id=${verifierId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch {
      console.error('Failed to fetch verification reviews for verifier');
    } finally {
      setLoading(false);
    }
  }, [verifierId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return { reviews, loading, refetch: loadReviews };
}

export function useActiveConflicts(filters?: { status?: string; page?: number }) {
  const [conflicts, setConflicts] = useState<VerificationConflict[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadConflicts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.page !== undefined) params.set('page', String(filters.page));
      const qs = params.toString();
      const url = `/api/dual-verification/conflicts${qs ? `?${qs}` : ''}`;
      const response = await globalThis.fetch(url);
      if (response.ok) {
        const data = await response.json();
        setConflicts(data.conflicts || []);
        setTotal(data.total || 0);
      }
    } catch {
      console.error('Failed to fetch active conflicts');
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.page]);

  useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  return { conflicts, total, loading, refetch: loadConflicts };
}

export function useDualVerificationSettings() {
  const [settings, setSettings] = useState<DualVerificationSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await globalThis.fetch('/api/dual-verification/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || []);
      }
    } catch {
      console.error('Failed to fetch dual verification settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return { settings, loading, refetch: loadSettings };
}

export function useCalculateRisk() {
  const [loading, setLoading] = useState(false);

  const calculate = async (projectId: string): Promise<ProjectRiskAssessment | null> => {
    setLoading(true);
    try {
      const response = await globalThis.fetch('/api/dual-verification/risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      if (!response.ok) throw new Error('Failed to calculate risk');
      const data = await response.json();
      return data.assessment as ProjectRiskAssessment;
    } catch (err) {
      console.error('Failed to calculate risk:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { calculate, loading };
}

export function useAssignVerifiers() {
  const [loading, setLoading] = useState(false);

  const assign = async (input: {
    project_id: string;
    risk_assessment_id?: string;
    verifier_ids?: string[];
  }): Promise<{ success: boolean; reviews?: VerificationReview[] }> => {
    setLoading(true);
    try {
      const response = await globalThis.fetch('/api/dual-verification/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to assign verifiers');
      const data = await response.json();
      return { success: true, reviews: data.reviews };
    } catch (err) {
      console.error('Failed to assign verifiers:', err);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { assign, loading };
}

export function useSubmitReview() {
  const [loading, setLoading] = useState(false);

  const submit = async (input: {
    review_id?: string;
    project_id: string;
    verifier_id: string;
    recommendation: 'approved' | 'rejected' | 'changes_requested';
    vegetation_score?: number;
    carbon_estimate?: number;
    boundary_area_hectares?: number;
    evidence_quality_score?: number;
    monitoring_notes?: string;
    findings?: Record<string, unknown>;
    conditions?: Record<string, unknown>;
    anomalies?: Record<string, unknown>;
    overall_confidence?: number;
    reviewer_remarks?: string;
  }): Promise<VerificationReview | null> => {
    setLoading(true);
    try {
      const response = await globalThis.fetch('/api/dual-verification/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to submit review');
      const data = await response.json();
      return data.review as VerificationReview;
    } catch (err) {
      console.error('Failed to submit review:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading };
}

export function useCompareReviews() {
  const [loading, setLoading] = useState(false);

  const compare = async (input: {
    project_id: string;
    review_1_id: string;
    review_2_id: string;
  }): Promise<{ match: boolean; conflicts: Record<string, unknown>; severity: string } | null> => {
    setLoading(true);
    try {
      const response = await globalThis.fetch('/api/dual-verification/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to compare reviews');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to compare reviews:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { compare, loading };
}

export function useResolveConflict() {
  const [loading, setLoading] = useState(false);

  const resolve = async (
    conflictId: string,
    input: {
      admin_decision: VerificationDecision;
      admin_remarks?: string;
      resolution_reasoning?: string;
    }
  ): Promise<VerificationConflict | null> => {
    setLoading(true);
    try {
      const response = await globalThis.fetch(`/api/dual-verification/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to resolve conflict');
      const data = await response.json();
      return data.conflict as VerificationConflict;
    } catch (err) {
      console.error('Failed to resolve conflict:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { resolve, loading };
}
