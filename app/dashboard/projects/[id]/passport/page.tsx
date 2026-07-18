'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import {
  getCarbonPassportApplicationsForProject,
  applyForCarbonPassport,
} from '@/lib/voc-services';
import type { CarbonPassportApplication } from '@/lib/voc-types';
import {
  CARBON_PASSPORT_STATUS_LABELS,
  CARBON_PASSPORT_STATUS_COLORS,
} from '@/lib/voc-types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Award,
  Download,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Key,
  Lock,
  QrCode,
  Fingerprint,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PassportPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project, loading: projectLoading } = useProject(projectId);
  const { profile } = useAuth();
  const [passportApps, setPassportApps] = React.useState<CarbonPassportApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [applying, setApplying] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [approvedAgency, setApprovedAgency] = React.useState<{ agencyId: string; agencyName: string; requestId: string } | null>(null);

  React.useEffect(() => {
    if (!projectId) return;
    (async () => {
      const apps = await getCarbonPassportApplicationsForProject(projectId);
      setPassportApps(apps);

      // Find approved agency
      const { data: requests } = await supabase
        .from('voc_requests')
        .select('id')
        .eq('project_id', projectId);

      if (requests && requests.length > 0) {
        const requestIds = requests.map((r: any) => r.id);
        const { data: agencyRow } = await supabase
          .from('voc_agency_requests')
          .select('agency_id, agency_name, request_id')
          .in('request_id', requestIds)
          .eq('verification_status', 'approved')
          .limit(1)
          .maybeSingle();

        if (agencyRow) {
          setApprovedAgency({
            agencyId: agencyRow.agency_id,
            agencyName: agencyRow.agency_name,
            requestId: agencyRow.request_id,
          });
        }
      }
      setLoading(false);
    })();
  }, [projectId]);

  const latestPassport = passportApps[0];
  const passportStatus = latestPassport?.status || 'none';
  const isPassportIssued = passportStatus === 'issued';
  const isPassportApplied = passportStatus === 'requested' || passportStatus === 'under_processing';
  const isApproved = project?.verification_status === 'approved';

  async function handleApplyPassport() {
    if (!approvedAgency || !profile || !project) return;
    setApplying(true);
    try {
      await applyForCarbonPassport({
        requestId: approvedAgency.requestId,
        projectId: project.id,
        projectName: project.name,
        projectOwnerId: profile.id,
        projectOwnerName: profile.full_name || 'Owner',
        agencyId: approvedAgency.agencyId,
        agencyName: approvedAgency.agencyName,
        assignedVerifier: null,
        verificationReportRef: null,
        auditReportRef: null,
      });
      toast.success('Carbon Passport application submitted!');
      setShowConfirm(false);
      const apps = await getCarbonPassportApplicationsForProject(projectId);
      setPassportApps(apps);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply');
    }
    setApplying(false);
  }

  if (projectLoading || loading || !profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          Carbon Passport
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Digital certificate of verified carbon credits
        </p>
      </div>

      {isPassportIssued ? (
        <IssuedPassportCard
          project={project}
          passport={latestPassport!}
        />
      ) : isPassportApplied ? (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <Clock className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">
                {passportStatus === 'requested' ? 'Application Submitted' : 'Under Review'}
              </p>
              <p className="text-xs text-blue-600">
                Your Carbon Passport application is being reviewed by {latestPassport?.agencyName || 'the verification agency'}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={CARBON_PASSPORT_STATUS_COLORS[passportStatus]}>
              {CARBON_PASSPORT_STATUS_LABELS[passportStatus]}
            </Badge>
            {latestPassport?.agencyName && (
              <Badge variant="outline">{latestPassport.agencyName}</Badge>
            )}
          </div>
        </Card>
      ) : !isApproved ? (
        <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Award className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-semibold">Carbon Passport Not Available</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Your project must be verified before you can apply for a Carbon Passport.
              Current status: {project.verification_status}
            </p>
          </div>
          <div className="w-full max-w-xs space-y-2">
            <RequirementRow label="Project Registered" done={project.status !== 'draft'} />
            <RequirementRow label="Verification Approved" done={isApproved} />
            <RequirementRow label="Passport Issued" done={false} />
          </div>
        </Card>
      ) : (
        <Card className="p-6 space-y-6">
          <div className="text-center py-4">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-green-100 mb-3">
              <Key className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg">Ready to Apply</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Your project has been verified. Apply for a Carbon Passport to receive a digital certificate of your verified carbon credits.
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setShowConfirm(true)}
            >
              <Key className="mr-2 h-5 w-5" />
              Apply for Carbon Passport
            </Button>
          </div>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Carbon Passport?</DialogTitle>
            <DialogDescription>
              Your project has already been verified. This request will be sent to the verification agency that approved your project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-sm font-semibold text-green-800">Verification Completed</p>
              </div>
              <p className="text-xs text-green-700">
                Your project &quot;{project.name}&quot; has been fully verified. The Carbon Passport application will be sent to the same agency.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button
                onClick={handleApplyPassport}
                disabled={applying}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {applying ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Key className="mr-2 h-4 w-4" /> Submit Request</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IssuedPassportCard({ project, passport }: { project: any; passport: CarbonPassportApplication }) {
  const passportId = passport.passportNumber || `CP-${passport.id.slice(0, 8).toUpperCase()}`;
  return (
    <Card className="overflow-hidden p-0">
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
            Issued
          </Badge>
        </div>
      </div>
      <div className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <PassportField label="Passport ID" value={passportId} />
          <PassportField label="Issue Date" value={new Date(passport.updatedAt || passport.createdAt).toLocaleDateString()} />
          <PassportField label="Project" value={project.name} />
          <PassportField label="Type" value={project.project_type} />
          <PassportField label="Area" value={project.area_hectares ? `${Number(project.area_hectares).toLocaleString()} ha` : '—'} />
          <PassportField label="Verified Carbon" value={project.verified_carbon_tonnes ? `${Number(project.verified_carbon_tonnes).toLocaleString()} t` : '—'} />
        </div>
        {passport.digitalSignature && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-900 border p-3">
            <Fingerprint className="h-4 w-4 text-slate-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Digital Signature</p>
              <p className="text-xs font-mono text-foreground truncate">{passport.digitalSignature}</p>
            </div>
          </div>
        )}
        {passport.qrCodeData && (
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-900 border p-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-white border">
              <QrCode className="h-10 w-10 text-slate-700" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase font-medium">QR Code Data</p>
              <p className="text-[10px] text-muted-foreground line-clamp-2">{passport.qrCodeData}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
          <span>Issued by {passport.agencyName}</span>
        </div>
        <div className="flex items-center gap-3">
          <Button className="w-full" disabled>
            <Download className="mr-2 h-4 w-4" />
            Download Certificate
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
        <CheckCircle2 className="h-4 w-4 text-green-600" />
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
