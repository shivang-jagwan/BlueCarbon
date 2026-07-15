import { NextRequest, NextResponse } from 'next/server';
import { getSecurityEvents } from '@/services/audit';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || undefined;
    const eventType = searchParams.get('eventType') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const resolved = searchParams.get('resolved');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const result = await getSecurityEvents({
      userId,
      eventType: eventType as any,
      severity: severity as any,
      resolved: resolved !== undefined ? resolved === 'true' : undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch security events' },
      { status: 500 }
    );
  }
}
