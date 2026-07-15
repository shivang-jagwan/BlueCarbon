import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, requireAdmin } from '@/lib/api-auth';
import {
  getDualVerificationSettings,
  updateDualVerificationSetting,
} from '@/services/dual-verification';

export async function GET(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  try {
    const settings = await getDualVerificationSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { key, value } = await request.json();
    const adminId = auth.user.id;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'key and value are required' },
        { status: 400 }
      );
    }

    const setting = await updateDualVerificationSetting(key, value, adminId);
    return NextResponse.json({ setting });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update setting' },
      { status: 500 }
    );
  }
}
