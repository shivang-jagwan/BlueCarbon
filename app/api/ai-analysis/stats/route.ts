import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/api-auth';
import { getAiAnalysisStats } from '@/services/ai-analysis';

export async function GET(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('project_id');
  const data = await getAiAnalysisStats(projectId || undefined);
  return NextResponse.json(data);
}
