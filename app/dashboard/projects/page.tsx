import { getSupabaseServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, FolderKanban } from 'lucide-react';
import type { Metadata } from 'next';
import { ProjectCard } from '@/components/shared/project-card';

export const metadata: Metadata = {
  title: 'My Projects | CarbonRush AI',
};

export default async function ProjectsPage() {
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">Not authenticated</p>
      </div>
    );
  }

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  const role = profile?.role;

  const PROJECT_SELECT = `
    id, name, slug, project_type, status, location_name, country,
    area_hectares, target_carbon_tonnes, verified_carbon_tonnes,
    verification_status, cover_image_url, land_verification_status,
    updated_at, owner_id,
    owner:profiles!projects_owner_id_fkey(full_name)
  `;

  let projects: any[] = [];

  if (role === 'verifier') {
    const { data: partnershipRows } = await supabase
      .from('project_partnerships')
      .select('project_id')
      .eq('verifier_id', user.id)
      .eq('status', 'active');

    const partnershipProjectIds = (partnershipRows || []).map((r) => r.project_id);

    if (partnershipProjectIds.length > 0) {
      const { data } = await supabase
        .from('projects')
        .select(PROJECT_SELECT)
        .in('id', partnershipProjectIds)
        .order('updated_at', { ascending: false });
      projects = data || [];
    }
  } else {
    let query = supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .order('updated_at', { ascending: false });

    if (role === 'project_owner') {
      query = query.eq('owner_id', user.id);
    }

    const { data } = await query;
    projects = data || [];
  }

  const pageTitle = role === 'verifier' ? 'Monitoring Projects' : 'My Projects';
  const pageDescription = role === 'verifier'
    ? 'Projects where you have an active monitoring partnership'
    : `${projects.length} active restoration project${projects.length !== 1 ? 's' : ''}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{pageDescription}</p>
        </div>
        {role !== 'verifier' && (
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            New project
          </Link>
        )}
      </div>

      {projects.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-16 text-center dark:border-slate-700 dark:bg-slate-900/50">
          <FolderKanban className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
          <h3 className="mb-1 text-base font-medium text-slate-900 dark:text-slate-100">
            {role === 'verifier' ? 'No monitoring projects assigned' : 'No projects yet'}
          </h3>
          <p className="mb-6 mx-auto max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {role === 'verifier'
              ? 'You will see projects here once a Sustainability Partner creates a monitoring partnership and the Project Owner accepts it.'
              : 'Register your first land restoration project to start generating verified carbon credits.'}
          </p>
          {role !== 'verifier' && (
            <Link
              href="/dashboard/projects/new"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Register your first project
            </Link>
          )}
        </div>
      )}

      {projects.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const ownerName = project.owner?.full_name || undefined;
            return (
              <ProjectCard
                key={project.id}
                project={project}
                href={`/dashboard/projects/${project.id}`}
                ownerName={ownerName}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
