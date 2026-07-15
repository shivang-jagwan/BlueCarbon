import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, validateBody } from '@/lib/api-auth';
import {
  getLandDocumentsByProject,
  createLandDocument,
  getAllLandDocumentsAdmin,
} from '@/services/land-ownership';

export async function GET(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('project_id');
  const admin = searchParams.get('admin');
  const verificationStatus = searchParams.get('verification_status') as string | null;
  const ownershipType = searchParams.get('ownership_type') as string | null;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (admin === 'true') {
    const data = await getAllLandDocumentsAdmin({
      verification_status: verificationStatus as any,
      ownership_type: ownershipType as any,
      page,
      limit,
    });
    return NextResponse.json(data);
  }

  if (projectId) {
    const documents = await getLandDocumentsByProject(projectId);
    return NextResponse.json({ documents });
  }

  return NextResponse.json({ documents: [] });
}

export async function POST(request: NextRequest) {
  const auth = await getSessionUser(request);
  if (!auth.ok) return auth.response;

  const { data: body, error: validationError } = await validateBody(request, ['project_id', 'document_type', 'file_name', 'storage_path']);
  if (validationError) return validationError;

  try {
    const document = await createLandDocument(body as Parameters<typeof createLandDocument>[0]);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create land document' },
      { status: 500 }
    );
  }
}
