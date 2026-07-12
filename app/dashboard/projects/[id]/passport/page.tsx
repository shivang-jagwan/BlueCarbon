'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProject, useCarbonPassport, issueCarbonPassport } from '@/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, Clock, ShieldCheck, CheckCircle2, Loader2, Key } from 'lucide-react';
import { VERIFICATION_STATUS_LABELS } from '@/lib/types';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PassportPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project, loading: projectLoading } = useProject(projectId);
  const { passport, loading: passportLoading, refetch: refetchPassport } = useCarbonPassport(projectId);
  const { profile } = useAuth();

  if (projectLoading || passportLoading || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  if (profile.role === 'verifier') {
    return <VerifierPassportView project={project} passport={passport} refetch={refetchPassport} verifierId={profile.id} />;
  }

  return <OwnerPassportView project={project} passport={passport} />;
}

function VerifierPassportView({ project, passport, refetch, verifierId }: { project: Project, passport: any, refetch: () => void, verifierId: string }) {
  const [issuing, setIssuing] = React.useState(false);
  
  const isApproved = project.verification_status === 'approved';
  const isIssued = !!passport;

  const handleIssue = async () => {
    if (!isApproved) {
      toast.error('Project must be fully approved before issuing a passport.');
      return;
    }
    setIssuing(true);
    const { error } = await issueCarbonPassport(project.id, verifierId, project.owner_id);
    if (error) {
      toast.error(error.message || 'Failed to issue carbon passport');
    } else {
      toast.success('Carbon Passport issued successfully!');
      refetch();
    }
    setIssuing(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Carbon Passport Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review verification status and issue digital carbon certificates
        </p>
      </div>

      {!isIssued ? (
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <h2 className="font-semibold text-lg">Issuance Requirements</h2>
            {isApproved ? (
              <Badge className="bg-success/10 text-success border-0">Ready to Issue</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Pending Requirements</Badge>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <RequirementRow label="Project Registered" done={project.status !== 'draft'} />
            <RequirementRow label="Evidence Uploaded" done={true} />
            <RequirementRow label="Verification Approved" done={isApproved} />
          </div>

          {isApproved ? (
            <Button 
              className="w-full bg-success hover:bg-success/90 text-white" 
              onClick={handleIssue} 
              disabled={issuing}
            >
              {issuing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Issuing Passport...</>
              ) : (
                <><Key className="mr-2 h-4 w-4" /> Issue Carbon Passport</>
              )}
            </Button>
          ) : (
            <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
              All verification requirements must be completed and the project approved before issuance.
            </div>
          )}
        </Card>
      ) : (
        <IssuedPassportCard project={project} passport={passport} />
      )}
    </div>
  );
}

function OwnerPassportView({ project, passport }: { project: Project, passport: any }) {
  const isIssued = !!passport;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Carbon Passport</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Digital certificate of verified carbon credits
        </p>
      </div>

      {isIssued ? (
        <IssuedPassportCard project={project} passport={passport} />
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
            <RequirementRow label="Project Registered" done={project.status !== 'draft'} />
            <RequirementRow label="Evidence Uploaded" done={false} />
            <RequirementRow label="Verification Complete" done={project.verification_status === 'approved'} />
            <RequirementRow label="Passport Issued" done={false} />
          </div>
        </Card>
      )}
    </div>
  );
}

function IssuedPassportCard({ project, passport }: { project: Project, passport: any }) {
  const passportId = `CR-${passport.id.slice(0, 8).toUpperCase()}`;
  return (
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
          <PassportField label="Passport ID" value={passportId} />
          <PassportField label="Issue Date" value={new Date(passport.created_at).toLocaleDateString()} />
          <PassportField label="Project" value={project.name} />
          <PassportField label="Type" value={project.project_type} />
          <PassportField label="Area" value={project.area_hectares ? `${project.area_hectares.toFixed(1)} ha` : '—'} />
          <PassportField label="Verified Carbon" value={project.verified_carbon_tonnes ? `${project.verified_carbon_tonnes} t` : '—'} />
        </div>

          <PassportField label="Evidence Check" value={passport.certificate_url ? 'Completed' : 'Pending'} />

        <div className="flex items-center gap-3">
          <Button className="w-full" onClick={() => toast.info('Certificate download will be available when Gemini AI integration is complete.')}>
            <Download className="mr-2 h-4 w-4" />
            Download Certificate
          </Button>
          <Button variant="outline" className="w-full" disabled>
            <Award className="mr-2 h-4 w-4" />
            Coming Soon
          </Button>
        </div>
      </div>
    </Card>
  );
}

function RequirementRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-success" />
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
      )}
      <span className={cn(done ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
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
