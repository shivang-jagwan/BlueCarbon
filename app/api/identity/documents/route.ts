import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/api-auth';
import {
  getIdentityDocuments,
  uploadIdentityDocument,
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
    const documents = await getIdentityDocuments(userId);
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch identity documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const {
      userId,
      documentType,
      documentCategory,
      fileName,
      fileSize,
      mimeType,
      storagePath,
      fileHash,
      documentNumber,
      issuingAuthority,
      issueDate,
      expiryDate,
      issuingCountry,
    } = body;

    if (!userId || !documentType || !documentCategory || !fileName || !storagePath) {
      return NextResponse.json(
        { error: 'userId, documentType, documentCategory, fileName, and storagePath are required' },
        { status: 400 }
      );
    }

    const document = await uploadIdentityDocument({
      userId,
      documentType,
      documentCategory,
      fileName,
      fileSize: fileSize ?? 0,
      mimeType: mimeType ?? 'application/octet-stream',
      storagePath,
      fileHash,
      documentNumber,
      issuingAuthority,
      issueDate,
      expiryDate,
      issuingCountry,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload identity document' },
      { status: 500 }
    );
  }
}
