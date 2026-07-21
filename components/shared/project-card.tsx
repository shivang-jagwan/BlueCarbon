'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Leaf,
  Layers,
  Globe,
  Clock,
  ExternalLink,
  ShieldCheck,
  Shield,
  CheckCircle2,
  User,
  Ruler,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PROJECT_TYPE_LABELS,
  type Project,
} from '@/lib/types';

const ECOSYSTEM_ICONS: Record<string, React.ReactNode> = {
  mangrove: <Leaf className="h-3 w-3" />,
  seagrass: <Layers className="h-3 w-3" />,
  salt_marsh: <Layers className="h-3 w-3" />,
  kelp_forest: <Leaf className="h-3 w-3" />,
  mixed: <Globe className="h-3 w-3" />,
};

const VERIFICATION_BADGE: Record<string, { label: string; className: string }> = {
  approved: {
    label: 'Verified',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  pending: {
    label: 'Under Review',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  in_review: {
    label: 'Under Review',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  not_submitted: {
    label: 'Registered',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
  expired: {
    label: 'Expired',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
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

export interface ProjectCardExtras {
  latestVerification: {
    agencyName: string;
    status: string;
    date: string;
  } | null;
  passportStatus: 'none' | 'requested' | 'under_processing' | 'issued' | 'rejected';
}

interface ProjectCardProps {
  project: Project;
  href: string;
  ownerName?: string;
  extras?: ProjectCardExtras;
}

export function ProjectCard({ project, href, ownerName, extras }: ProjectCardProps) {
  const coverSrc = project.cover_image_url || null;
  const vBadge = VERIFICATION_BADGE[project.verification_status] || VERIFICATION_BADGE.not_submitted;

  return (
    <Link href={href} className="group block">
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-sm transition-all duration-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Cover Image */}
        <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
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
              <Leaf className="h-10 w-10 text-emerald-200 dark:text-emerald-800" />
            </div>
          )}
          {/* Badges overlaid on cover */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <Badge className={cn('text-[10px] font-semibold border-0 shadow-sm', vBadge.className)}>
              {vBadge.label}
            </Badge>
            <Badge className="text-[10px] font-semibold border-0 bg-white/90 text-slate-700 shadow-sm dark:bg-slate-900/90 dark:text-slate-300">
              {ECOSYSTEM_ICONS[project.project_type] || <Leaf className="h-3 w-3" />}
              <span className="ml-1">{PROJECT_TYPE_LABELS[project.project_type]}</span>
            </Badge>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 pt-3.5 space-y-3">
          {/* Project Name */}
          <h3 className="text-base font-semibold leading-snug text-slate-900 group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
            {project.name}
          </h3>

          {/* Location + Owner + Area */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {project.location_name && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span className="truncate">{project.location_name}{project.country ? `, ${project.country}` : ''}</span>
              </span>
            )}
            {ownerName && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3 text-slate-400" />
                {ownerName}
              </span>
            )}
            {project.area_hectares != null && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3 w-3 text-slate-400" />
                {Number(project.area_hectares).toLocaleString(undefined, { maximumFractionDigits: 1 })} ha
              </span>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {project.verification_status === 'approved' && (
              <Badge variant="outline" className="text-[10px] font-medium border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" /> Verified
              </Badge>
            )}
            {extras?.passportStatus === 'issued' && (
              <Badge variant="outline" className="text-[10px] font-medium border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-400 gap-1">
                <Shield className="h-2.5 w-2.5" /> Passport Issued
              </Badge>
            )}
            {extras?.passportStatus === 'requested' || extras?.passportStatus === 'under_processing' ? (
              <Badge variant="outline" className="text-[10px] font-medium border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400 gap-1">
                <ShieldCheck className="h-2.5 w-2.5" /> Passport Requested
              </Badge>
            ) : null}
            <Badge variant="outline" className="text-[10px] font-medium border-teal-200 text-teal-700 dark:border-teal-800 dark:text-teal-400 gap-1">
              <Leaf className="h-2.5 w-2.5" /> Blue Carbon
            </Badge>
          </div>

          {/* Separator */}
          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* Verification Summary */}
          {extras?.latestVerification ? (
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-medium tracking-wide">Latest Verification</p>
                <p className="text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                  {extras.latestVerification.agencyName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-medium tracking-wide">Verified</p>
                <p className="text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                  {new Date(extras.latestVerification.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <ShieldCheck className="h-3 w-3" />
              <span>No Verification Yet</span>
            </div>
          )}

          {/* Separator */}
          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* Footer */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
              <Clock className="h-3 w-3" />
              Updated {relativeTime(project.updated_at)}
            </span>
            <Button
              asChild
              size="sm"
              className="h-7 px-3 bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-medium rounded-lg"
            >
              <span>
                <ExternalLink className="mr-1 h-3 w-3" />
                Workspace
              </span>
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
