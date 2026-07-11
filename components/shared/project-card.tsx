'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  statusColor,
  type Project,
} from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  href: string;
}

export function ProjectCard({ project, href }: ProjectCardProps) {
  const updatedDate = new Date(project.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link href={href} className="group block">
      <Card className="overflow-hidden p-0 transition-all hover:shadow-soft-lg hover:border-primary/30">
        {/* Cover */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/15 to-accent/15">
          {project.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.cover_image_url}
              alt={project.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-display text-3xl font-bold text-primary/20">
                {PROJECT_TYPE_LABELS[project.project_type]?.[0] || 'P'}
              </span>
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              {PROJECT_TYPE_LABELS[project.project_type]}
            </Badge>
          </div>
          <div className="absolute right-3 top-3">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                statusColor(project.status)
              )}
            >
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          <div>
            <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            {project.location_name && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {project.location_name}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {project.area_hectares ? `${project.area_hectares.toFixed(1)} ha` : 'No area set'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {updatedDate}
            </span>
          </div>

          {project.health_score !== null && project.health_score > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success"
                  style={{ width: `${project.health_score}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {project.health_score}/100
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {project.verification_status === 'approved'
                ? 'Verified'
                : project.verification_status === 'pending' || project.verification_status === 'in_review'
                ? 'In verification'
                : 'Not submitted'}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Open
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
