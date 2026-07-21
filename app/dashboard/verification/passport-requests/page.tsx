'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import {
  getCarbonPassportApplications,
  updateCarbonPassportStatus,
} from '@/lib/voc-services';
import type { CarbonPassportApplication } from '@/lib/voc-types';
import {
  CARBON_PASSPORT_STATUS_LABELS,
  CARBON_PASSPORT_STATUS_COLORS,
  CARBON_PASSPORT_STATUS_DOT_COLORS,
} from '@/lib/voc-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Award,
  Search,
  Clock,
  CheckCircle2,
  Key,
  ExternalLink,
  Loader2,
  ShieldCheck,
  FileText,
  Leaf,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PassportRequestsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [requests, setRequests] = React.useState<CarbonPassportApplication[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedRequest, setSelectedRequest] = React.useState<CarbonPassportApplication | null>(null);
  const [showIssueDialog, setShowIssueDialog] = React.useState(false);
  const [issuing, setIssuing] = React.useState(false);
  const [rejecting, setRejecting] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [projectData, setProjectData] = React.useState<any>(null);

  React.useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    const apps = await getCarbonPassportApplications();
    setRequests(apps);
    setLoading(false);
  }

  const filtered = React.useMemo(() => {
    let results = requests.filter((r) => r.status === 'requested' || r.status === 'under_processing');
    if (!search) return results;
    const q = search.toLowerCase();
    return results.filter(
      (r) =>
        r.projectName.toLowerCase().includes(q) ||
        r.agencyName.toLowerCase().includes(q) ||
        r.passportNumber?.toLowerCase().includes(q)
    );
  }, [requests, search]);

  const pendingCount = requests.filter((r) => r.status === 'requested').length;
  const processingCount = requests.filter((r) => r.status === 'under_processing').length;
  const issuedCount = requests.filter((r) => r.status === 'issued').length;

  async function handleOpenIssue(req: CarbonPassportApplication) {
    setSelectedRequest(req);
    // Load project data for the issue dialog
    const { data: proj } = await supabase
      .from('projects')
      .select('name, project_type, area_hectares, verified_carbon_tonnes, verified_tree_count, verified_species_count, verified_biomass_carbon, verified_soil_organic_carbon, verified_biodiversity_index, verified_ecosystem_health')
      .eq('id', req.projectId)
      .maybeSingle();
    setProjectData(proj);
    setShowIssueDialog(true);
  }

  async function handleIssuePassport() {
    if (!selectedRequest) return;
    setIssuing(true);
    try {
      const passportNumber = `CP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await updateCarbonPassportStatus(selectedRequest.id, 'issued', {
        passportNumber,
      });
      toast.success(`Carbon Passport ${passportNumber} issued successfully!`);
      setShowIssueDialog(false);
      setSelectedRequest(null);
      setProjectData(null);
      await loadRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to issue passport');
    }
    setIssuing(false);
  }

  async function handleRejectPassport() {
    if (!selectedRequest) return;
    setRejecting(true);
    try {
      await updateCarbonPassportStatus(selectedRequest.id, 'rejected');
      toast.success('Carbon Passport application rejected');
      setShowIssueDialog(false);
      setSelectedRequest(null);
      setProjectData(null);
      setRejectionReason('');
      await loadRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject passport');
    }
    setRejecting(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Key className="h-6 w-6 text-blue-600" />
          Carbon Passport Requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and issue carbon passports for verified projects.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{processingCount}</p>
              <p className="text-xs text-muted-foreground">Under Review</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{issuedCount}</p>
              <p className="text-xs text-muted-foreground">Issued</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by project name, agency, or passport number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted rounded" />
                  <div className="h-3 w-1/4 bg-muted rounded" />
                </div>
                <div className="h-6 w-20 bg-muted rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <Key className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No Carbon Passport Requests</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? 'No requests match your search.' : 'Passport requests from project owners will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <Card
              key={req.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleOpenIssue(req)}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  req.status === 'issued' ? 'bg-green-100' : req.status === 'under_processing' ? 'bg-blue-100' : 'bg-amber-100'
                )}>
                  {req.status === 'issued' ? (
                    <Award className="h-5 w-5 text-green-600" />
                  ) : (
                    <Key className={cn('h-5 w-5', req.status === 'under_processing' ? 'text-blue-600' : 'text-amber-600')} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{req.projectName}</p>
                    <Badge className={cn('text-[10px] border-0', CARBON_PASSPORT_STATUS_COLORS[req.status])}>
                      <span className={cn('h-1.5 w-1.5 rounded-full mr-1', CARBON_PASSPORT_STATUS_DOT_COLORS[req.status])} />
                      {CARBON_PASSPORT_STATUS_LABELS[req.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span>Agency: {req.agencyName}</span>
                    <span>•</span>
                    <span>Requested: {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {req.passportNumber && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{req.passportNumber}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/projects/${req.projectId}`);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Issue Passport Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600" />
              Issue Carbon Passport
            </DialogTitle>
            <DialogDescription>
              Review the verified project details and issue the Carbon Passport.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 pt-2">
              {/* Project Summary */}
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-semibold">{selectedRequest.projectName}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Agency</p>
                    <p className="font-medium">{selectedRequest.agencyName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Requested</p>
                    <p className="font-medium">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Verified Metrics from project */}
              {projectData && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Verified Metrics</p>
                  <div className="grid grid-cols-2 gap-2">
                    {projectData.area_hectares && (
                      <div className="rounded-lg bg-green-50 dark:bg-green-900/10 p-2 border border-green-200 dark:border-green-800">
                        <p className="text-[10px] text-green-600">Area</p>
                        <p className="text-sm font-bold text-green-800">{Number(projectData.area_hectares).toLocaleString()} ha</p>
                      </div>
                    )}
                    {projectData.verified_tree_count && (
                      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/10 p-2 border border-emerald-200 dark:border-emerald-800">
                        <p className="text-[10px] text-emerald-600">Trees</p>
                        <p className="text-sm font-bold text-emerald-800">{Number(projectData.verified_tree_count).toLocaleString()}</p>
                      </div>
                    )}
                    {projectData.verified_carbon_tonnes && (
                      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 p-2 border border-blue-200 dark:border-blue-800">
                        <p className="text-[10px] text-blue-600">Carbon</p>
                        <p className="text-sm font-bold text-blue-800">{Number(projectData.verified_carbon_tonnes).toLocaleString()} t</p>
                      </div>
                    )}
                    {projectData.verified_species_count && (
                      <div className="rounded-lg bg-teal-50 dark:bg-teal-900/10 p-2 border border-teal-200 dark:border-teal-800">
                        <p className="text-[10px] text-teal-600">Species</p>
                        <p className="text-sm font-bold text-teal-800">{Number(projectData.verified_species_count).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Passport will include */}
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4">
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">Passport will include:</p>
                <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-400">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Unique Passport ID</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Digital Signature</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Issue Date</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Verified Carbon Metrics</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowIssueDialog(false); setSelectedRequest(null); setProjectData(null); setRejectionReason(''); }}>
                  Cancel
                </Button>
                {selectedRequest.status !== 'issued' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={handleRejectPassport}
                      disabled={rejecting || issuing}
                    >
                      {rejecting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rejecting...</>
                      ) : (
                        <><XCircle className="mr-2 h-4 w-4" /> Reject</>
                      )}
                    </Button>
                    <Button
                      onClick={handleIssuePassport}
                      disabled={issuing || rejecting}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {issuing ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Issuing...</>
                      ) : (
                        <><Key className="mr-2 h-4 w-4" /> Issue Carbon Passport</>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
