'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MapPin,
  Leaf,
  Ruler,
  Globe,
  Clock,
  Settings,
  ExternalLink,
  FileText,
  Layers,
  CircleDot,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  VERIFICATION_STATUS_LABELS,
  LAND_VERIFICATION_STATUS_LABELS,
  statusColor,
  landVerificationDot,
  type Project,
} from '@/lib/types';

const ECOSYSTEM_ICONS: Record<string, React.ReactNode> = {
  mangrove: <Leaf className="h-3.5 w-3.5" />,
  seagrass: <Layers className="h-3.5 w-3.5" />,
  salt_marsh: <Layers className="h-3.5 w-3.5" />,
  kelp_forest: <Leaf className="h-3.5 w-3.5" />,
  mixed: <Globe className="h-3.5 w-3.5" />,
};

const VERIFICATION_DOT: Record<string, string> = {
  not_submitted: 'bg-slate-400',
  pending: 'bg-amber-500',
  in_review: 'bg-blue-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  expired: 'bg-slate-400',
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface ProjectCardProps {
  project: Project;
  href: string;
  ownerName?: string;
}

export function ProjectCard({ project, href, ownerName }: ProjectCardProps) {
  const coverSrc = project.cover_image_url || null;

  return (
    <TooltipProvider delayDuration={300}>
      <Link href={href} className="group block">
        <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {/* ── Cover Image ── */}
          <div className="relative h-44 w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-primary/10 to-accent/10">
            {coverSrc ? (
              <Image
                src={coverSrc}
                alt={project.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={false}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Leaf className="h-8 w-8 text-primary/30" />
                </div>
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className="space-y-3 p-4 pt-3.5">
            {/* Row 1: Name + Land Verified badge */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold leading-snug text-slate-900 group-hover:text-green-600 dark:text-slate-100 dark:group-hover:text-green-400 transition-colors line-clamp-1">
                {project.name}
              </h3>
              {project.land_verification_status === 'verified' && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Land Verified
                </span>
              )}
            </div>

            {/* Row 2: Owner */}
            {ownerName && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Owner: {ownerName}
              </p>
            )}

            {/* Separator */}
            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* Row 3: Location */}
            {project.location_name && (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                <span className="truncate">
                  {project.location_name}
                  {project.country ? `, ${project.country}` : ''}
                </span>
              </div>
            )}

            {/* Row 4: Ecosystem Type */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                {ECOSYSTEM_ICONS[project.project_type] || <Leaf className="h-3.5 w-3.5" />}
              </span>
              <span>{PROJECT_TYPE_LABELS[project.project_type]}</span>
            </div>

            {/* Row 5: Area */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <Ruler className="h-3 w-3 shrink-0 text-slate-400" />
              <span>
                {project.area_hectares
                  ? `${project.area_hectares.toLocaleString(undefined, { maximumFractionDigits: 1 })} Hectares`
                  : 'Not Available'}
              </span>
            </div>

            {/* Row 6: Estimated Carbon Sequestration */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <Globe className="h-3 w-3 shrink-0 text-slate-400" />
              <span>
                {project.target_carbon_tonnes
                  ? `${project.target_carbon_tonnes.toLocaleString()} tCO\u2082e`
                  : 'Calculating...'}
              </span>
              {(project.target_carbon_tonnes ?? 0) > 0 && (
                <span className="text-slate-400">(Estimated)</span>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className="ml-0.5 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
                  >
                    <HelpCircle className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-64 text-xs">
                  This value is estimated using project area, ecosystem type, and monitoring
                  information.
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Separator */}
            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* Row 7: Land Verification Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Land Verification</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    landVerificationDot(project.land_verification_status)
                  )}
                />
                {LAND_VERIFICATION_STATUS_LABELS[project.land_verification_status]}
              </span>
            </div>

            {/* Row 8: Project Verification Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Project Verification</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    VERIFICATION_DOT[project.verification_status] || 'bg-slate-400'
                  )}
                />
                {VERIFICATION_STATUS_LABELS[project.verification_status]}
              </span>
            </div>

            {/* Separator */}
            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* Row 9: Project Status */}
            <div className="flex items-center gap-2">
              <CircleDot className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Project Status</span>
              <span className="ml-auto">
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[10px] font-semibold px-2 py-0.5',
                    statusColor(project.status)
                  )}
                >
                  {PROJECT_STATUS_LABELS[project.status]}
                </Badge>
              </span>
            </div>

            {/* Separator */}
            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* Row 10: Last Updated */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <Clock className="h-3 w-3 shrink-0" />
              <span>Last Updated: {relativeTime(project.updated_at)}</span>
            </div>

            {/* Separator */}
            <div className="border-t border-slate-100 dark:border-slate-800" />

            {/* Row 11: Footer Buttons */}
            <div className="flex items-center gap-2 pt-0.5">
              <Button
                asChild
                size="sm"
                className="h-8 flex-1 bg-green-600 text-white hover:bg-green-700 text-xs font-medium"
              >
                <span>
                  <ExternalLink className="mr-1.5 h-3 w-3" />
                  Workspace
                </span>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 flex-1 border-slate-200 text-xs font-medium dark:border-slate-700"
              >
                <span>
                  <FileText className="mr-1.5 h-3 w-3" />
                  Details
                </span>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-medium"
              >
                <span>
                  <Settings className="h-3.5 w-3.5" />
                </span>
              </Button>
            </div>
          </div>
        </Card>
      </Link>
    </TooltipProvider>
  );
}
