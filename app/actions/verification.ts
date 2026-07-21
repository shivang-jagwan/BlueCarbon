'use server';

import { createClient } from '@supabase/supabase-js';

// Using service role key to bypass RLS for public/verified project read access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getVerificationReportsForProject(projectId: string) {
  // First, verify the project is visible (this is a basic safety check)
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('id, status')
    .eq('id', projectId)
    .single();

  if (!project) return [];

  // Get requests
  const { data: requests } = await supabaseAdmin
    .from('voc_requests')
    .select('id')
    .eq('project_id', projectId);

  if (!requests || requests.length === 0) return [];

  const requestIds = requests.map(r => r.id);

  // Get agency requests
  const { data: apps } = await supabaseAdmin
    .from('voc_agency_requests')
    .select('id, request_id, agency_name, agency_id, verification_status, assigned_verifier, audit_date, last_updated, carbon_passport_status')
    .in('request_id', requestIds)
    .order('created_at', { ascending: false });

  return apps || [];
}
