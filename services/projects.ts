'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function getOwnerProjects(ownerId: string) {
  const supabase = await getSupabaseServerClient();
  return supabase
    .from('projects')
    .select('id, name, project_type, status, location_name, country, area_hectares, verified_carbon_tonnes, updated_at')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });
}

export async function getProjectById(id: string) {
  const supabase = await getSupabaseServerClient();
  return supabase
    .from('projects')
    .select('*, carbon_passports(*), profiles(full_name)')
    .eq('id', id)
    .single();
}

export async function createProject(data: any) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: projectData, error } = await supabase.from('projects').insert({
    ...data,
    owner_id: user.id,
  }).select().single();

  if (error) throw error;
  
  if (projectData) {
    await supabase.from('project_activity').insert({
      project_id: projectData.id,
      actor_id: user.id,
      event_type: 'project_created',
      title: 'Project Created',
      description: `Project "${projectData.name}" was registered`,
    });
  }
  
  return projectData;
}
