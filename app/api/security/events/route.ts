import { NextRequest, NextResponse } from 'next/server';
import {
  getSecurityEvents,
  logSecurityEvent,
} from '@/services/identity';
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
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await getSecurityEvents({
      userId,
      eventType: eventType as any,
      severity,
      resolved: resolved !== undefined ? resolved === 'true' : undefined,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch security events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { eventType, severity, ipAddress, device, browser, details } = body;

    if (!eventType || !severity) {
      return NextResponse.json(
        { error: 'eventType and severity are required' },
        { status: 400 }
      );
    }

    const event = await logSecurityEvent({
      userId: auth.user.id,
      eventType,
      severity,
      ipAddress,
      device,
      browser,
      details,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to log security event' },
      { status: 500 }
    );
  }
}
