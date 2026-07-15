import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, validateBody } from '@/lib/api-auth';
import {
  getAiAnalysesByProject,
  getAiAnalysesByRequest,
  createAiAnalysis,
  getAllAiAnalysesAdmin,
  getAiAnalysisStats,
} from '@/services/ai-analysis';

export async function GET(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('project_id');
  const requestId = searchParams.get('request_id');
  const stats = searchParams.get('stats');
  const admin = searchParams.get('admin');
  const analysisType = searchParams.get('analysis_type') as string | null;
  const riskLevel = searchParams.get('risk_level') as string | null;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (stats === 'true') {
    const data = await getAiAnalysisStats(projectId || undefined);
    return NextResponse.json(data);
  }

  if (admin === 'true') {
    const data = await getAllAiAnalysesAdmin({
      analysis_type: analysisType as any,
      risk_level: riskLevel as any,
      page,
      limit,
    });
    return NextResponse.json(data);
  }

  if (projectId) {
    const analyses = await getAiAnalysesByProject(projectId);
    return NextResponse.json({ analyses });
  }

  if (requestId) {
    const analyses = await getAiAnalysesByRequest(requestId);
    return NextResponse.json({ analyses });
  }

  return NextResponse.json({ analyses: [] });
}

export async function POST(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  const { data: body, error: validationError } = await validateBody(request, ['project_id', 'analysis_type', 'risk_level', 'recommendation']);
  if (validationError) return validationError;

  try {
    const analysis = await createAiAnalysis(body as Parameters<typeof createAiAnalysis>[0]);
    return NextResponse.json({ analysis }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create AI analysis' },
      { status: 500 }
    );
  }
}
