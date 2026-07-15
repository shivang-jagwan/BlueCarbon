'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import type {
  AiAnalysis,
  AiAnalysisType,
  AiRecommendation,
  AiRiskLevel,
} from '@/lib/types';

export async function getAiAnalysesByProject(projectId: string): Promise<AiAnalysis[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('ai_analysis')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch AI analyses:', error);
    return [];
  }
  return (data || []) as AiAnalysis[];
}

export async function getAiAnalysesByRequest(requestId: string): Promise<AiAnalysis[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('ai_analysis')
    .select('*')
    .eq('verification_request_id', requestId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch AI analyses for request:', error);
    return [];
  }
  return (data || []) as AiAnalysis[];
}

export async function getAiAnalysisById(id: string): Promise<AiAnalysis | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('ai_analysis')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch AI analysis:', error);
    return null;
  }
  return data as AiAnalysis;
}

export async function createAiAnalysis(input: {
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
  ai_model?: string;
  ai_version?: string;
  processing_time_ms?: number;
  notes?: string;
}): Promise<AiAnalysis> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('ai_analysis')
    .insert({
      project_id: input.project_id,
      verification_request_id: input.verification_request_id || null,
      analysis_type: input.analysis_type,
      confidence_score: input.confidence_score,
      recommendation: input.recommendation,
      reasoning: input.reasoning || null,
      risk_level: input.risk_level,
      evidence_used: input.evidence_used || null,
      detected_risks: input.detected_risks || null,
      observations: input.observations || null,
      vegetation_score: input.vegetation_score || null,
      carbon_estimate: input.carbon_estimate || null,
      similarity_score: input.similarity_score || null,
      gps_consistency_score: input.gps_consistency_score || null,
      ownership_verification_score: input.ownership_verification_score || null,
      ai_model: input.ai_model || 'carbonrush-ai-v1',
      ai_version: input.ai_version || '1.0.0',
      processing_time_ms: input.processing_time_ms || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create AI analysis:', error);
    throw new Error('Failed to create AI analysis');
  }
  return data as AiAnalysis;
}

export async function updateAiAnalysis(
  id: string,
  input: {
    verifier_agreed_with_ai?: boolean;
    verifier_override_reason?: string;
    notes?: string;
  }
): Promise<AiAnalysis> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('ai_analysis')
    .update({
      verifier_agreed_with_ai: input.verifier_agreed_with_ai,
      verifier_override_reason: input.verifier_override_reason,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update AI analysis:', error);
    throw new Error('Failed to update AI analysis');
  }
  return data as AiAnalysis;
}

export async function deleteAiAnalysis(id: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from('ai_analysis')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete AI analysis:', error);
    throw new Error('Failed to delete AI analysis');
  }
}

export async function getAllAiAnalysesAdmin(options?: {
  analysis_type?: AiAnalysisType;
  risk_level?: AiRiskLevel;
  page?: number;
  limit?: number;
}): Promise<{ analyses: AiAnalysis[]; total: number }> {
  const supabase = await getSupabaseServerClient();
  const page = options?.page || 1;
  const limit = Math.min(options?.limit || 20, 100);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('ai_analysis')
    .select('*', { count: 'exact' });

  if (options?.analysis_type) {
    query = query.eq('analysis_type', options.analysis_type);
  }
  if (options?.risk_level) {
    query = query.eq('risk_level', options.risk_level);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch admin AI analyses:', error);
    return { analyses: [], total: 0 };
  }

  return {
    analyses: (data || []) as AiAnalysis[],
    total: count || 0,
  };
}

export async function getAiAnalysisStats(projectId?: string): Promise<{
  total: number;
  avg_confidence: number;
  agreement_rate: number;
  by_recommendation: Record<AiRecommendation, number>;
  by_risk_level: Record<AiRiskLevel, number>;
}> {
  const supabase = await getSupabaseServerClient();
  let query = supabase.from('ai_analysis').select('*');
  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return {
      total: 0,
      avg_confidence: 0,
      agreement_rate: 0,
      by_recommendation: {
        recommend_approval: 0,
        recommend_changes: 0,
        recommend_rejection: 0,
        insufficient_data: 0,
        needs_more_evidence: 0,
        low_confidence: 0,
      },
      by_risk_level: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
    };
  }

  const analyses = data as AiAnalysis[];
  const total = analyses.length;
  const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence_score, 0) / total;
  const decidedAnalyses = analyses.filter(a => a.verifier_agreed_with_ai !== null);
  const agreedCount = decidedAnalyses.filter(a => a.verifier_agreed_with_ai === true).length;
  const agreementRate = decidedAnalyses.length > 0 ? (agreedCount / decidedAnalyses.length) * 100 : 0;

  const byRecommendation: Record<string, number> = {};
  const byRiskLevel: Record<string, number> = {};
  analyses.forEach(a => {
    byRecommendation[a.recommendation] = (byRecommendation[a.recommendation] || 0) + 1;
    byRiskLevel[a.risk_level] = (byRiskLevel[a.risk_level] || 0) + 1;
  });

  return {
    total,
    avg_confidence: Math.round(avgConfidence),
    agreement_rate: Math.round(agreementRate),
    by_recommendation: byRecommendation as Record<AiRecommendation, number>,
    by_risk_level: byRiskLevel as Record<AiRiskLevel, number>,
  };
}
