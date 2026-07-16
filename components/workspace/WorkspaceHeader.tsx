'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, MapPin, Leaf, ShieldCheck, FileText, TreePine, HeartPulse, Eye } from 'lucide-react';
import {
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
  statusColor,
  type ProjectStatus,
} from '@/lib/types';

interface WorkspaceHeaderProps {
  project: any;
  loading: boolean;
  role?: string;
}

function StatPill({
  icon: Icon,
  label,
  value,
  color = 'text-slate-900 dark:text-slate-100',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5">
      <Icon className="h-3 w-3 shrink-0 text-slate-400 dark:text-slate-500" />
      <div className="min-w-0">
        <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className={cn('text-xs font-semibold leading-tight', color)}>{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ label, variant }: { label: string; variant: 'success' | 'info' | 'muted' }) {
  const classes = {
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    muted: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  };

  return (
    <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium', classes[variant])}>
      {label}
    </span>
  );
}

export function WorkspaceHeader({ project, loading, role }: WorkspaceHeaderProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 px-6 py-3 backdrop-blur-sm">
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        <span className="text-sm text-slate-500 dark:text-slate-400">Loading project...</span>
      </div>
    );
  }

  if (!project) return null;

  const hasLandVerification =
    project.land_verification_status && project.land_verification_status !== 'not_requested';
  const hasProjectVerification =
    project.verification_status && project.verification_status !== 'not_submitted';

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 px-6 py-3 backdrop-blur-sm sticky top-0 z-20">
      {/* Project name + location */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
          <Leaf className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {project.name}
          </h2>
          {project.location_name && (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
              <MapPin className="h-2.5 w-2.5" />
              {project.location_name}
              {project.country ? `, ${project.country}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* Status badges */}
      <div className="flex items-center gap-1.5">
        <StatusBadge
          label={PROJECT_STATUS_LABELS[project.status as ProjectStatus] || project.status}
          variant={
            project.status === 'active' || project.status === 'verified'
              ? 'success'
              : project.status === 'registered'
                ? 'muted'
                : 'info'
          }
        />
        {hasLandVerification && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-2.5 w-2.5" />
            Land {project.land_verification_status}
          </span>
        )}
        {hasProjectVerification && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
            <FileText className="h-2.5 w-2.5" />
            {project.verification_status}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="hidden items-center gap-2 xl:flex">
        {project.area_hectares != null && project.area_hectares > 0 && (
          <StatPill icon={TreePine} label="Area" value={`${project.area_hectares.toFixed(1)} ha`} />
        )}
        {project.estimated_carbon_sequestration != null && project.estimated_carbon_sequestration > 0 && (
          <StatPill
            icon={Leaf}
            label="Carbon Est."
            value={`${project.estimated_carbon_sequestration.toLocaleString()} t CO₂e`}
          />
        )}
        {project.target_carbon_tonnes != null && project.target_carbon_tonnes > 0 && (
          <StatPill
            icon={Leaf}
            label="Target"
            value={`${project.target_carbon_tonnes.toLocaleString()} t`}
          />
        )}
        {project.health_score != null && project.health_score > 0 && (
          <StatPill
            icon={HeartPulse}
            label="Health"
            value={`${project.health_score}/100`}
            color={
              project.health_score >= 70
                ? 'text-emerald-600 dark:text-emerald-400'
                : project.health_score >= 40
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
            }
          />
        )}
        {role === 'sustainability_partner' && (
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <Eye className="h-2.5 w-2.5" />
            Read Only
          </span>
        )}
      </div>
    </div>
  );
}
