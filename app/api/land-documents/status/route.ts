import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/api-auth';
import { getLandOwnershipVerificationStatus } from '@/services/land-ownership';

export async function GET(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('project_id');
  if (!projectId) {
    return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
  }
  const status = await getLandOwnershipVerificationStatus(projectId);
  return NextResponse.json(status);
}
