'use client';

import * as React from 'react';
import {
  Plus, Activity, Shield, FileCheck, Globe, Handshake, BarChart3, CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/types';

interface LifecycleCardProps {
  project: Project;
}

interface LifecycleStage {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
  completedColor: string;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  { id: 'created', label: 'Project Created', icon: <Plus className="h-3.5 w-3.5" />, color: 'text-slate-400', activeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200', completedColor: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'monitoring', label: 'Monitoring', icon: <Activity className="h-3.5 w-3.5" />, color: 'text-slate-400', activeColor: 'text-blue-600 bg-blue-50 border-blue-200', completedColor: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'verification', label: 'Verification', icon: <Shield className="h-3.5 w-3.5" />, color: 'text-slate-400', activeColor: 'text-amber-600 bg-amber-50 border-amber-200', completedColor: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'passport', label: 'Carbon Passport', icon: <FileCheck className="h-3.5 w-3.5" />, color: 'text-slate-400', activeColor: 'text-purple-600 bg-purple-50 border-purple-200', completedColor: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'discovery', label: 'Available for Discovery', icon: <Globe className="h-3.5 w-3.5" />, color: 'text-slate-400', activeColor: 'text-teal-600 bg-teal-50 border-teal-200', completedColor: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'partnership', label: 'Partnership', icon: <Handshake className="h-3.5 w-3.5" />, color: 'text-slate-400', activeColor: 'text-indigo-600 bg-indigo-50 border-indigo-200', completedColor: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'impact', label: 'Impact Monitoring', icon: <BarChart3 className="h-3.5 w-3.5" />, color: 'text-slate-400', activeColor: 'text-cyan-600 bg-cyan-50 border-cyan-200', completedColor: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'completed', label: 'Completed', icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'text-slate-400', activeColor: 'text-green-600 bg-green-50 border-green-200', completedColor: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
];

function getStageStatus(project: { status: string; verification_status?: string; passport_issued_at?: string | null; partner_count?: number }, stageId: string): 'completed' | 'current' | 'upcoming' {
  const statusOrder = ['draft', 'registered', 'in_verification', 'verified', 'active', 'completed'];
  const currentIdx = statusOrder.indexOf(project.status);

  switch (stageId) {
    case 'created':
      return currentIdx >= 0 ? 'completed' : 'current';
    case 'monitoring':
      return currentIdx >= 1 ? 'completed' : currentIdx === 0 ? 'current' : 'upcoming';
    case 'verification':
      return currentIdx >= 3 || project.verification_status === 'approved' ? 'completed' : currentIdx === 2 ? 'current' : 'upcoming';
    case 'passport':
      return project.passport_issued_at ? 'completed' : 'current';
    case 'discovery':
      if (!project.passport_issued_at) return 'upcoming';
      return (project as any).isPartnered ? 'completed' : 'current';
    case 'partnership':
      return (project as any).isPartnered ? 'completed' : 'upcoming';
    case 'impact':
      return project.status === 'active' ? 'current' : project.status === 'completed' ? 'completed' : 'upcoming';
    case 'completed':
      return project.status === 'completed' ? 'completed' : 'upcoming';
    default:
      return 'upcoming';
  }
}

export function PartnershipLifecycleCard({ project }: LifecycleCardProps) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Project Lifecycle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {LIFECYCLE_STAGES.map((stage, index) => {
            const stageStatus = getStageStatus(project as any, stage.id);
            const isLast = index === LIFECYCLE_STAGES.length - 1;

            return (
              <div key={stage.id} className="relative flex items-start gap-3 pb-3 last:pb-0">
                {/* Connector line */}
                {!isLast && (
                  <div className="absolute left-[14px] top-[28px] w-0.5 h-[calc(100%-20px)] bg-slate-200 dark:bg-slate-700" />
                )}

                {/* Status dot */}
                <div
                  className={cn(
                    'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    stageStatus === 'completed' && 'bg-emerald-100 border-emerald-300 text-emerald-600',
                    stageStatus === 'current' && 'bg-blue-100 border-blue-300 text-blue-600 ring-2 ring-blue-100',
                    stageStatus === 'upcoming' && 'bg-slate-50 border-slate-200 text-slate-400',
                  )}
                >
                  {stage.icon}
                </div>

                {/* Label */}
                <div className="pt-0.5 min-w-0">
                  <p
                    className={cn(
                      'text-xs font-medium leading-tight',
                      stageStatus === 'completed' && 'text-emerald-700 dark:text-emerald-400',
                      stageStatus === 'current' && 'text-blue-700 dark:text-blue-400 font-semibold',
                      stageStatus === 'upcoming' && 'text-slate-400 dark:text-slate-500',
                    )}
                  >
                    {stage.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
