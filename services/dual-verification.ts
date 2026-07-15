'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import type {
  ProjectRiskAssessment,
  VerificationReview,
  VerificationConflict,
  DualVerificationSetting,
  RiskLevel,
  VerificationReviewStatus,
  ConflictStatus,
  ConflictSeverity,
  VerificationReviewRecommendation,
  VerificationDecision,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: Record<string, unknown> = {
  ownership_weight: 0.2,
  document_weight: 0.15,
  size_weight: 0.1,
  carbon_weight: 0.15,
  funding_weight: 0.1,
  ai_fraud_weight: 0.1,
  evidence_weight: 0.1,
  dispute_weight: 0.1,
  medium_threshold: 30,
  high_threshold: 60,
  critical_threshold: 80,
  single_verifier_max_score: 30,
  conflict_vegetation_diff: 15,
  conflict_carbon_diff_pct: 20,
  conflict_boundary_diff_pct: 15,
  conflict_evidence_diff: 15,
};

async function getSetting(key: string): Promise<number> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from('dual_verification_settings')
    .select('setting_value')
    .eq('setting_key', key)
    .single();

  if (data?.setting_value && typeof data.setting_value === 'object') {
    const val = (data.setting_value as Record<string, unknown>).value;
    if (typeof val === 'number') return val;
  }
  return (DEFAULT_SETTINGS[key] as number) ?? 0;
}

async function getSettingsMap(): Promise<Record<string, number>> {
  const keys = Object.keys(DEFAULT_SETTINGS);
  const results = await Promise.all(keys.map((k) => getSetting(k)));
  const map: Record<string, number> = {};
  keys.forEach((k, i) => (map[k] = results[i]));
  return map;
}

function deriveRiskLevel(
  score: number,
  settings: Record<string, number>,
): { riskLevel: RiskLevel; requiredVerifiers: number; adminReviewRequired: boolean } {
  if (score >= settings.critical_threshold) {
    return { riskLevel: 'critical', requiredVerifiers: 2, adminReviewRequired: true };
  }
  if (score >= settings.high_threshold) {
    return { riskLevel: 'high', requiredVerifiers: 2, adminReviewRequired: true };
  }
  if (score >= settings.medium_threshold) {
    return { riskLevel: 'medium', requiredVerifiers: 2, adminReviewRequired: false };
  }
  return { riskLevel: 'low', requiredVerifiers: 1, adminReviewRequired: false };
}

// ---------------------------------------------------------------------------
// 1. calculateRiskAssessment
// ---------------------------------------------------------------------------

export async function calculateRiskAssessment(
  projectId: string,
): Promise<ProjectRiskAssessment> {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [projectRes, docsRes, aiRes, disputesRes, settings] = await Promise.all([
    supabase
      .from('projects')
      .select('id, area_hectares, target_carbon_tonnes, ownership_type, status')
      .eq('id', projectId)
      .single(),
    supabase
      .from('project_land_documents')
      .select('id, verification_status')
      .eq('project_id', projectId)
      .eq('is_current', true),
    supabase
      .from('ai_analysis')
      .select('risk_level, confidence_score')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('verification_conflicts')
      .select('id')
      .eq('project_id', projectId)
      .eq('status', 'resolved'),
    getSettingsMap(),
  ]);

  if (projectRes.error || !projectRes.data) {
    throw new Error('Project not found');
  }

  const project = projectRes.data;
  const docs = (docsRes.data || []) as { verification_status: string }[];
  const latestAi = aiRes.data as {
    risk_level: string;
    confidence_score: number;
  } | null;
  const disputeCount = (disputesRes.data || []).length;

  const verifiedDocs = docs.filter((d) => d.verification_status === 'verified').length;
  const totalDocs = docs.length;
  const docCompleteness = totalDocs > 0 ? verifiedDocs / totalDocs : 0;

  const ownershipRisk = project.ownership_type === 'community' ? 25 : project.ownership_type === 'leased' ? 20 : 10;
  const documentRisk = Math.round((1 - docCompleteness) * 40);
  const sizeRisk = (project.area_hectares || 0) > 500 ? 30 : (project.area_hectares || 0) > 100 ? 15 : 5;
  const carbonRisk = (project.target_carbon_tonnes || 0) > 10000 ? 30 : (project.target_carbon_tonnes || 0) > 5000 ? 15 : 5;
  const fundingRisk = 10;
  const aiFraudRisk = latestAi
    ? latestAi.risk_level === 'critical'
      ? 40
      : latestAi.risk_level === 'high'
        ? 30
        : latestAi.risk_level === 'medium'
          ? 15
          : 5
    : 15;
  const evidenceRisk = totalDocs === 0 ? 35 : 10;
  const disputeRisk = Math.min(disputeCount * 20, 40);

  const totalRiskScore = Math.round(
    ownershipRisk * settings.ownership_weight +
    documentRisk * settings.document_weight +
    sizeRisk * settings.size_weight +
    carbonRisk * settings.carbon_weight +
    fundingRisk * settings.funding_weight +
    aiFraudRisk * settings.ai_fraud_weight +
    evidenceRisk * settings.evidence_weight +
    disputeRisk * settings.dispute_weight,
  );

  const clamped = Math.max(0, Math.min(100, totalRiskScore));
  const { riskLevel, requiredVerifiers, adminReviewRequired } = deriveRiskLevel(clamped, settings);

  const reasoning = [
    `Ownership type "${project.ownership_type}" → ${ownershipRisk}`,
    `Document completeness ${Math.round(docCompleteness * 100)}% → ${documentRisk}`,
    `Project area ${project.area_hectares || 0} ha → ${sizeRisk}`,
    `Carbon target ${project.target_carbon_tonnes || 0} t → ${carbonRisk}`,
    `AI risk ${latestAi?.risk_level || 'N/A'} → ${aiFraudRisk}`,
    `Evidence items ${totalDocs} → ${evidenceRisk}`,
    `Past disputes ${disputeCount} → ${disputeRisk}`,
    `Total weighted score: ${clamped} (${riskLevel})`,
  ].join('; ');

  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('project_risk_assessment')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle();

  let result;

  if (existing) {
    const { data, error } = await supabase
      .from('project_risk_assessment')
      .update({
        ownership_risk: ownershipRisk,
        document_risk: documentRisk,
        size_risk: sizeRisk,
        carbon_risk: carbonRisk,
        funding_risk: fundingRisk,
        ai_fraud_risk: aiFraudRisk,
        evidence_risk: evidenceRisk,
        dispute_risk: disputeRisk,
        total_risk_score: clamped,
        risk_level: riskLevel,
        required_verifiers: requiredVerifiers,
        admin_review_required: adminReviewRequired,
        admin_escalation: adminReviewRequired,
        calculated_by: 'system',
        calculation_reasoning: reasoning,
        last_assessed_at: now,
        updated_at: now,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update risk assessment:', error);
      throw new Error('Failed to update risk assessment');
    }
    result = data;
  } else {
    const { data, error } = await supabase
      .from('project_risk_assessment')
      .insert({
        project_id: projectId,
        ownership_risk: ownershipRisk,
        document_risk: documentRisk,
        size_risk: sizeRisk,
        carbon_risk: carbonRisk,
        funding_risk: fundingRisk,
        ai_fraud_risk: aiFraudRisk,
        evidence_risk: evidenceRisk,
        dispute_risk: disputeRisk,
        total_risk_score: clamped,
        risk_level: riskLevel,
        required_verifiers: requiredVerifiers,
        admin_review_required: adminReviewRequired,
        admin_escalation: adminReviewRequired,
        calculated_by: 'system',
        calculation_reasoning: reasoning,
        last_assessed_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create risk assessment:', error);
      throw new Error('Failed to create risk assessment');
    }
    result = data;
  }

  return result as ProjectRiskAssessment;
}

// ---------------------------------------------------------------------------
// 2. getRiskAssessment
// ---------------------------------------------------------------------------

export async function getRiskAssessment(
  projectId: string,
): Promise<ProjectRiskAssessment | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('project_risk_assessment')
    .select('*')
    .eq('project_id', projectId)
    .order('last_assessed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch risk assessment:', error);
    return null;
  }
  return data as ProjectRiskAssessment | null;
}

// ---------------------------------------------------------------------------
// 3. assignVerifiers
// ---------------------------------------------------------------------------

export async function assignVerifiers(
  projectId: string,
  riskAssessmentId?: string,
): Promise<{ verifierIds: string[]; requestIds: string[] }> {
  const supabase = await getSupabaseServerClient();

  let assessment: ProjectRiskAssessment | null = null;
  if (riskAssessmentId) {
    const { data } = await supabase
      .from('project_risk_assessment')
      .select('*')
      .eq('id', riskAssessmentId)
      .maybeSingle();
    assessment = data as ProjectRiskAssessment | null;
  }
  if (!assessment) {
    assessment = await getRiskAssessment(projectId);
  }
  if (!assessment) {
    assessment = await calculateRiskAssessment(projectId);
  }

  const requiredCount = assessment.required_verifiers;

  const { data: verifiers, error: vErr } = await supabase
    .from('profiles')
    .select('id, organization')
    .eq('role', 'verifier')
    .eq('approval_status', 'approved')
    .order('projects_verified_count', { ascending: false });

  if (vErr || !verifiers || verifiers.length === 0) {
    throw new Error('No approved verifiers available');
  }

  const { data: existingRequests } = await supabase
    .from('verification_service_requests')
    .select('verifier_id')
    .eq('project_id', projectId)
    .eq('request_type', 'project');

  const assignedOrgs = new Set<string>();
  const usedIds = new Set(
    (existingRequests || []).map((r: { verifier_id: string }) => r.verifier_id),
  );

  const selected: string[] = [];

  for (const v of verifiers) {
    if (selected.length >= requiredCount) break;
    if (usedIds.has(v.id)) continue;
    const org = v.organization || '__none__';
    if (selected.length > 0 && assignedOrgs.has(org)) continue;

    selected.push(v.id);
    assignedOrgs.add(org);
  }

  if (selected.length < requiredCount) {
    for (const v of verifiers) {
      if (selected.length >= requiredCount) break;
      if (usedIds.has(v.id) || selected.includes(v.id)) continue;
      selected.push(v.id);
    }
  }

  const requestIds: string[] = [];
  for (const verifierId of selected) {
    const { data: req, error: reqErr } = await supabase
      .from('verification_service_requests')
      .insert({
        project_id: projectId,
        verifier_id: verifierId,
        request_type: 'project',
        priority: assessment.risk_level === 'critical' || assessment.risk_level === 'high' ? 'high' : 'medium',
        status: 'pending',
        description: `Risk-based assignment (${assessment.risk_level}, score ${assessment.total_risk_score})`,
      })
      .select('id')
      .single();

    if (!reqErr && req) {
      requestIds.push(req.id);
    }
  }

  return { verifierIds: selected, requestIds };
}

// ---------------------------------------------------------------------------
// 4. getVerificationReview
// ---------------------------------------------------------------------------

export async function getVerificationReview(
  reviewId: string,
): Promise<VerificationReview | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('verification_reviews')
    .select('*')
    .eq('id', reviewId)
    .single();

  if (error) {
    console.error('Failed to fetch verification review:', error);
    return null;
  }
  return data as VerificationReview;
}

// ---------------------------------------------------------------------------
// 5. getVerificationReviewsByProject
// ---------------------------------------------------------------------------

export async function getVerificationReviewsByProject(
  projectId: string,
): Promise<VerificationReview[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('verification_reviews')
    .select('*')
    .eq('project_id', projectId)
    .order('reviewer_number', { ascending: true });

  if (error) {
    console.error('Failed to fetch verification reviews:', error);
    return [];
  }
  return (data || []) as VerificationReview[];
}

// ---------------------------------------------------------------------------
// 6. submitVerificationReview
// ---------------------------------------------------------------------------

export async function submitVerificationReview(
  reviewId: string,
  input: {
    vegetation_score: number;
    carbon_estimate: number;
    boundary_area_hectares: number;
    evidence_quality_score: number;
    monitoring_notes?: string;
    recommendation: VerificationReviewRecommendation;
    findings?: Record<string, unknown>;
    conditions?: Record<string, unknown>;
    anomalies?: Record<string, unknown>;
    overall_confidence?: number;
    reviewer_remarks?: string;
  },
): Promise<VerificationReview> {
  const supabase = await getSupabaseServerClient();
  const now = new Date().toISOString();

  const { data: existing, error: fetchErr } = await supabase
    .from('verification_reviews')
    .select('id, project_id, status')
    .eq('id', reviewId)
    .single();

  if (fetchErr || !existing) {
    throw new Error('Review not found');
  }
  if (existing.status === 'submitted' || existing.status === 'finalized') {
    throw new Error('Review has already been submitted');
  }

  const { data, error } = await supabase
    .from('verification_reviews')
    .update({
      vegetation_score: input.vegetation_score,
      carbon_estimate: input.carbon_estimate,
      boundary_area_hectares: input.boundary_area_hectares,
      evidence_quality_score: input.evidence_quality_score,
      monitoring_notes: input.monitoring_notes || null,
      recommendation: input.recommendation,
      findings: input.findings || null,
      conditions: input.conditions || null,
      anomalies: input.anomalies || null,
      overall_confidence: input.overall_confidence ?? null,
      reviewer_remarks: input.reviewer_remarks || null,
      status: 'submitted' as VerificationReviewStatus,
      submitted_at: now,
      updated_at: now,
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) {
    console.error('Failed to submit verification review:', error);
    throw new Error('Failed to submit verification review');
  }

  const projectId = existing.project_id;
  const allReviews = await getVerificationReviewsByProject(projectId);
  const allSubmitted = allReviews.every(
    (r) => r.status === 'submitted' || r.status === 'finalized',
  );

  if (allSubmitted && allReviews.length >= 2) {
    await compareReviews(projectId);
  }

  return data as VerificationReview;
}

// ---------------------------------------------------------------------------
// 7. compareReviews
// ---------------------------------------------------------------------------

export async function compareReviews(
  projectId: string,
): Promise<{ hasConflict: boolean; conflict?: VerificationConflict }> {
  const supabase = await getSupabaseServerClient();

  const reviews = await getVerificationReviewsByProject(projectId);
  const submitted = reviews.filter(
    (r) => r.status === 'submitted' || r.status === 'finalized',
  );

  if (submitted.length < 2) {
    return { hasConflict: false };
  }

  const [vegetationDiff, carbonDiff, boundaryDiff, evidenceDiff] = await Promise.all([
    getSetting('conflict_vegetation_diff'),
    getSetting('conflict_carbon_diff_pct'),
    getSetting('conflict_boundary_diff_pct'),
    getSetting('conflict_evidence_diff'),
  ]);

  const r1 = submitted[0];
  const r2 = submitted[1];

  const conflicts: string[] = [];

  if (
    r1.vegetation_score != null &&
    r2.vegetation_score != null &&
    Math.abs(r1.vegetation_score - r2.vegetation_score) > vegetationDiff
  ) {
    conflicts.push('vegetation_score');
  }

  if (
    r1.carbon_estimate != null &&
    r2.carbon_estimate != null &&
    r1.carbon_estimate > 0 &&
    Math.abs(r1.carbon_estimate - r2.carbon_estimate) / r1.carbon_estimate * 100 > carbonDiff
  ) {
    conflicts.push('carbon_estimate');
  }

  if (
    r1.boundary_area_hectares != null &&
    r2.boundary_area_hectares != null &&
    r1.boundary_area_hectares > 0 &&
    Math.abs(r1.boundary_area_hectares - r2.boundary_area_hectares) / r1.boundary_area_hectares * 100 > boundaryDiff
  ) {
    conflicts.push('boundary_area_hectares');
  }

  if (
    r1.evidence_quality_score != null &&
    r2.evidence_quality_score != null &&
    Math.abs(r1.evidence_quality_score - r2.evidence_quality_score) > evidenceDiff
  ) {
    conflicts.push('evidence_quality_score');
  }

  const recommendationMismatch = r1.recommendation !== r2.recommendation;

  if (conflicts.length === 0 && !recommendationMismatch) {
    return { hasConflict: false };
  }

  let severity: ConflictSeverity = 'minor';
  if (recommendationMismatch && conflicts.length >= 3) {
    severity = 'critical';
  } else if (recommendationMismatch && conflicts.length >= 2) {
    severity = 'major';
  } else if (recommendationMismatch || conflicts.length >= 2) {
    severity = 'moderate';
  }

  const { data: existingConflict } = await supabase
    .from('verification_conflicts')
    .select('id')
    .eq('project_id', projectId)
    .in('status', ['detected', 'admin_review', 'third_review_requested'])
    .maybeSingle();

  if (existingConflict) {
    const { data: updated } = await supabase
      .from('verification_conflicts')
      .update({
        conflict_fields: conflicts,
        recommendation_mismatch: recommendationMismatch,
        severity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingConflict.id)
      .select()
      .single();

    await supabase
      .from('verification_reviews')
      .update({ is_in_conflict: true, conflict_id: existingConflict.id })
      .in('id', [r1.id, r2.id]);

    return {
      hasConflict: true,
      conflict: updated as VerificationConflict,
    };
  }

  const { data: conflict, error: cErr } = await supabase
    .from('verification_conflicts')
    .insert({
      project_id: projectId,
      review_1_id: r1.id,
      review_2_id: r2.id,
      verifier_1_id: r1.verifier_id,
      verifier_2_id: r2.verifier_id,
      conflict_fields: conflicts,
      recommendation_mismatch: recommendationMismatch,
      severity,
      status: 'detected' as ConflictStatus,
    })
    .select()
    .single();

  if (cErr) {
    console.error('Failed to create conflict record:', cErr);
    throw new Error('Failed to create conflict record');
  }

  await supabase
    .from('verification_reviews')
    .update({ is_in_conflict: true, conflict_id: conflict.id, status: 'under_conflict_review' })
    .in('id', [r1.id, r2.id]);

  return {
    hasConflict: true,
    conflict: conflict as VerificationConflict,
  };
}

// ---------------------------------------------------------------------------
// 8. getActiveConflicts
// ---------------------------------------------------------------------------

export async function getActiveConflicts(
  filters?: {
    severity?: ConflictSeverity;
    projectId?: string;
    page?: number;
    limit?: number;
  },
): Promise<{ conflicts: VerificationConflict[]; total: number }> {
  const supabase = await getSupabaseServerClient();
  const page = filters?.page || 1;
  const limit = Math.min(filters?.limit || 20, 100);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('verification_conflicts')
    .select(
      `*, 
       review_1:verification_reviews!verification_conflicts_review_1_id_fkey(*), 
       review_2:verification_reviews!verification_conflicts_review_2_id_fkey(*),
       verifier_1:profiles!verification_conflicts_verifier_1_id_fkey(full_name, organization),
       verifier_2:profiles!verification_conflicts_verifier_2_id_fkey(full_name, organization)`,
      { count: 'exact' },
    )
    .not('status', 'eq', 'resolved')
    .not('status', 'eq', 'escalated');

  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.projectId) {
    query = query.eq('project_id', filters.projectId);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Failed to fetch active conflicts:', error);
    return { conflicts: [], total: 0 };
  }

  return {
    conflicts: (data || []) as VerificationConflict[],
    total: count || 0,
  };
}

// ---------------------------------------------------------------------------
// 9. resolveConflict
// ---------------------------------------------------------------------------

export async function resolveConflict(
  conflictId: string,
  adminId: string,
  decision: VerificationDecision,
  remarks: string,
): Promise<VerificationConflict> {
  const supabase = await getSupabaseServerClient();
  const now = new Date().toISOString();

  const { data: conflict, error: fetchErr } = await supabase
    .from('verification_conflicts')
    .select('id, review_1_id, review_2_id, project_id')
    .eq('id', conflictId)
    .single();

  if (fetchErr || !conflict) {
    throw new Error('Conflict not found');
  }

  const { data, error } = await supabase
    .from('verification_conflicts')
    .update({
      status: 'resolved' as ConflictStatus,
      admin_id: adminId,
      admin_decision: decision,
      admin_remarks: remarks,
      resolution_reasoning: remarks,
      resolved_at: now,
      updated_at: now,
    })
    .eq('id', conflictId)
    .select()
    .single();

  if (error) {
    console.error('Failed to resolve conflict:', error);
    throw new Error('Failed to resolve conflict');
  }

  const approvedReviewId = decision === 'approved' ? conflict.review_1_id : conflict.review_2_id;
  const rejectedReviewId = decision === 'approved' ? conflict.review_2_id : conflict.review_1_id;

  if (decision === 'approved' || decision === 'rejected') {
    await supabase
      .from('verification_reviews')
      .update({ status: 'finalized', finalized_at: now })
      .eq('id', approvedReviewId);

    await supabase
      .from('verification_reviews')
      .update({ status: 'finalized', finalized_at: now })
      .eq('id', rejectedReviewId);
  }

  return data as VerificationConflict;
}

// ---------------------------------------------------------------------------
// 10. getDualVerificationSettings
// ---------------------------------------------------------------------------

export async function getDualVerificationSettings(): Promise<DualVerificationSetting[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('dual_verification_settings')
    .select('*')
    .order('setting_key', { ascending: true });

  if (error) {
    console.error('Failed to fetch dual verification settings:', error);
    return [];
  }
  return (data || []) as DualVerificationSetting[];
}

// ---------------------------------------------------------------------------
// 11. updateDualVerificationSetting
// ---------------------------------------------------------------------------

export async function updateDualVerificationSetting(
  key: string,
  value: Record<string, unknown>,
  adminId: string,
): Promise<DualVerificationSetting> {
  const supabase = await getSupabaseServerClient();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from('dual_verification_settings')
    .select('id')
    .eq('setting_key', key)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('dual_verification_settings')
      .update({
        setting_value: value,
        updated_by: adminId,
        updated_at: now,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update setting:', error);
      throw new Error('Failed to update setting');
    }
    return data as DualVerificationSetting;
  }

  const { data, error } = await supabase
    .from('dual_verification_settings')
    .insert({
      setting_key: key,
      setting_value: value,
      updated_by: adminId,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create setting:', error);
    throw new Error('Failed to create setting');
  }
  return data as DualVerificationSetting;
}

// ---------------------------------------------------------------------------
// 12. getVerificationReviewsByVerifier
// ---------------------------------------------------------------------------

export async function getVerificationReviewsByVerifier(
  verifierId: string,
): Promise<VerificationReview[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('verification_reviews')
    .select('*, projects(name, project_type, status)')
    .eq('verifier_id', verifierId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch verifier reviews:', error);
    return [];
  }
  return (data || []) as VerificationReview[];
}
