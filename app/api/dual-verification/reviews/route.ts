import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, validateBody } from '@/lib/api-auth';
import {
  getVerificationReviewsByProject,
  getVerificationReviewsByVerifier,
  submitVerificationReview,
} from '@/services/dual-verification';

export async function GET(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const verifierId = searchParams.get('verifier_id');

    if (projectId) {
      const reviews = await getVerificationReviewsByProject(projectId);
      return NextResponse.json({ reviews });
    }

    if (verifierId) {
      // Users can only view their own reviews (admins can view any)
      if (verifierId !== auth.user.id && auth.user.role !== 'admin') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }
      const reviews = await getVerificationReviewsByVerifier(verifierId);
      return NextResponse.json({ reviews });
    }

    return NextResponse.json({ error: 'project_id or verifier_id is required' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  const { data: body, error: validationError } = await validateBody(request, ['project_id', 'request_id', 'verifier_id']);
  if (validationError) return validationError;

  try {
    // eslint-disable-next-line
    const b = body as any;
    const review = await submitVerificationReview(b.reviewId as string, {
      vegetation_score: b.vegetationScore,
      carbon_estimate: b.carbonEstimate,
      boundary_area_hectares: b.boundaryArea,
      evidence_quality_score: b.evidenceQualityScore,
      monitoring_notes: b.monitoringNotes,
      recommendation: b.recommendation,
      findings: b.findings,
      conditions: b.conditions,
      anomalies: b.anomalies,
      overall_confidence: b.overallConfidence,
      reviewer_remarks: b.reviewerRemarks,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
