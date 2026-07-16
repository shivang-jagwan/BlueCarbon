import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/api-auth';
import {
  getIdentityVerification,
  getOrCreateIdentityVerification,
} from '@/services/identity';

export async function GET(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }
    if (auth.user.role !== 'admin' && userId !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const verification = await getIdentityVerification(userId);
    return NextResponse.json({ verification });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch identity verification' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const userId = auth.user.id;
    const role = auth.user.role;

    const verification = await getOrCreateIdentityVerification(userId, role);
    return NextResponse.json({ verification }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create identity verification' },
      { status: 500 }
    );
  }
}
