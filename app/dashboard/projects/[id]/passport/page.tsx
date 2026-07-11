'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, Clock, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { VERIFICATION_STATUS_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function PassportPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project, loading } = useProject(projectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  const isIssued = !!project.passport_issued_at;
  const passportId = isIssued
    ? `CR-${project.id.slice(0, 8).toUpperCase()}`
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Carbon Passport</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Digital certificate of verified carbon credits
        </p>
      </div>

      {isIssued ? (
        <Card className="overflow-hidden p-0">
          {/* Passport Header */}
          <div className="gradient-ocean p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="h-6 w-6" />
                  <h2 className="font-display text-xl font-semibold">Carbon Passport</h2>
                </div>
                <p className="mt-1 text-sm text-white/80">CarbonRush AI Verified</p>
              </div>
              <Badge className="bg-white/20 text-white border-0">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            </div>
          </div>

          {/* Passport Body */}
          <div className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <PassportField label="Passport ID" value={passportId || ''} />
              <PassportField label="Issue Date" value={new Date(project.passport_issued_at!).toLocaleDateString()} />
              <PassportField label="Project" value={project.name} />
              <PassportField label="Type" value={project.project_type} />
              <PassportField label="Area" value={project.area_hectares ? `${project.area_hectares.toFixed(1)} ha` : '—'} />
              <PassportField label="Verified Carbon" value={project.verified_carbon_tonnes ? `${project.verified_carbon_tonnes} t` : '—'} />
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" />
                <p className="text-sm font-medium">Trust Score: High</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                This passport is cryptographically verified and linked to the
                project&apos;s full provenance chain on CarbonRush AI.
              </p>
            </div>

            <Button className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Certificate
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Award className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-semibold">Carbon Passport Not Issued</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Your carbon passport will be issued once your project passes
              verification. Current verification status:{' '}
              <span className="font-medium text-foreground">
                {VERIFICATION_STATUS_LABELS[project.verification_status]}
              </span>
            </p>
          </div>
          <div className="w-full max-w-xs space-y-2">
            {[
              { label: 'Project Registered', done: project.status !== 'draft' },
              { label: 'Evidence Uploaded', done: false },
              { label: 'Verification Complete', done: project.verification_status === 'approved' },
              { label: 'Passport Issued', done: false },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                )}
                <span className={cn(step.done ? 'text-foreground' : 'text-muted-foreground')}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function PassportField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}
