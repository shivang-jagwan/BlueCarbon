import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Plus, TreePine, Droplets, Leaf, MapPin, Calendar } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Projects | CarbonRush AI',
};

// Ecosystem icon map
const ECOSYSTEM_ICONS: Record<string, React.ReactNode> = {
  mangrove:  <Leaf className="w-4 h-4" />,
  wetland:   <Droplets className="w-4 h-4" />,
  seagrass:  <Droplets className="w-4 h-4" />,
  forest:    <TreePine className="w-4 h-4" />,
  grassland: <Leaf className="w-4 h-4" />,
  saltmarsh: <Leaf className="w-4 h-4" />,
};

const ECOSYSTEM_COLORS: Record<string, string> = {
  mangrove:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  wetland:   'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  seagrass:  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  forest:    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  grassland: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400',
  saltmarsh: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
};

const STATUS_COLORS: Record<string, string> = {
  draft:            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  pending_review:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  land_verified:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  project_verified: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  monitoring:       'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  verified:         'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  suspended:        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

// This is a Server Component — no 'use client', no useEffect
export default async function ProjectsPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},  // read-only in Server Component
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      ecosystem_type,
      status,
      state,
      district,
      area_hectares,
      total_carbon_certified,
      current_cycle,
      total_cycles,
      created_at,
      updated_at
    `)
    .eq('owner_id', user!.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 dark:text-red-400 text-sm">Failed to load projects: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">My Projects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {projects?.length ?? 0} active restoration project{projects?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New project
        </Link>
      </div>

      {/* Empty state */}
      {(!projects || projects.length === 0) && (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-16 text-center">
          <Leaf className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-base font-medium text-slate-900 dark:text-slate-100 mb-1">No projects yet</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            Register your first land restoration project to start generating verified carbon credits.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register your first project
          </Link>
        </div>
      )}

      {/* Project grid */}
      {projects && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Color band by ecosystem */}
              <div className={`h-1.5 w-full ${
                project.ecosystem_type === 'mangrove' ? 'bg-green-500'
                : project.ecosystem_type === 'wetland' ? 'bg-blue-500'
                : project.ecosystem_type === 'forest' ? 'bg-emerald-500'
                : 'bg-teal-500'
              }`} />

              <div className="p-5">
                {/* Title + badges */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {project.name}
                  </h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    STATUS_COLORS[project.status] ?? STATUS_COLORS.draft
                  }`}>
                    {project.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Ecosystem badge */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-4 ${
                  ECOSYSTEM_COLORS[project.ecosystem_type] ?? ECOSYSTEM_COLORS.mangrove
                }`}>
                  {ECOSYSTEM_ICONS[project.ecosystem_type]}
                  {project.ecosystem_type}
                </span>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Area</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {project.area_hectares} ha
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Carbon certified</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {project.total_carbon_certified ?? 0} t
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {project.district}, {project.state}
                  </span>
                  {project.current_cycle && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Cycle {project.current_cycle}/{project.total_cycles}
                    </span>
                  )}
                </div>

                {/* CTA */}
                <Link
                  href={`/workspace/${project.id}/overview`}
                  className="block w-full text-center py-2 px-3 text-sm font-medium rounded-lg border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                >
                  Open workspace →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
