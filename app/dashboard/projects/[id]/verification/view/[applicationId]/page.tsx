'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getApplication, getAuditReportForRequest } from '@/lib/voc-services';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  DECISION_LABELS,
  DECISION_COLORS,
  DOCUMENT_CATEGORY_LABELS,
  CARBON_PASSPORT_STATUS_LABELS,
  CARBON_PASSPORT_STATUS_COLORS,
  type VerificationApplication,
  type AuditReport,
} from '@/lib/voc-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, FileText, Shield, Map, Camera, Eye, CheckCircle2,
  Clock, Lock, AlertTriangle, Award, Building2, Image, FolderOpen,
  MapPin, Download, Send, ClipboardList, TreePine, Leaf, Wind,
  Bug, Target, Fingerprint, Globe, Droplets, HeartPulse, Waves,
  Zap, BarChart3, PieChart as PieChartIcon, Activity, Calendar,
  FileCheck, QrCode, Stamp, Users, Route, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

/* ─── Helpers ─────────────────────────────────────────────────── */

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className={cn('text-sm font-medium', mono && 'font-mono text-xs')}>{value ?? '—'}</div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, unit, color, trend }: {
  icon: React.ElementType; label: string; value: string | number; unit?: string; color: string; trend?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl border p-4 bg-gradient-to-br to-transparent', color)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {unit && <p className="text-xs text-muted-foreground font-medium">{unit}</p>}
          </div>
          {trend && <p className="text-[10px] text-muted-foreground">{trend}</p>}
        </div>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', color.includes('emerald') ? 'bg-emerald-100' : color.includes('blue') ? 'bg-blue-100' : color.includes('purple') ? 'bg-purple-100' : color.includes('amber') ? 'bg-amber-100' : color.includes('cyan') ? 'bg-cyan-100' : 'bg-slate-100')}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </span>
      <span className="text-sm font-medium">{value || '—'}</span>
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium', ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700')}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {label}
    </div>
  );
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

/* ─── Main Page ───────────────────────────────────────────────── */

export default function ViewVerificationApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const applicationId = params.applicationId as string;

  const [application, setApplication] = React.useState<VerificationApplication | null>(null);
  const [auditReport, setAuditReport] = React.useState<AuditReport | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [app, report] = await Promise.all([
        getApplication(applicationId),
        getAuditReportForRequest(applicationId),
      ]);
      if (!cancelled) {
        setApplication(app ?? null);
        setAuditReport(report ?? null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [applicationId]);

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="space-y-3">
          <div className="h-8 w-64 rounded bg-muted animate-pulse" />
          <div className="h-4 w-96 rounded bg-muted animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-xl border border-border/60 bg-white dark:bg-slate-900 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium">Application not found</p>
          <p className="text-xs text-muted-foreground mt-1">This verification application could not be located.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push(`/dashboard/projects/${projectId}/verification`)}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Button>
        </div>
      </div>
    );
  }

  const snapshot = application.snapshot;
  const isDecided = ['approved', 'returned_for_revision', 'rejected'].includes(application.status);
  const isApproved = application.status === 'approved';
  const allDocs = snapshot?.documents || [];
  const allEvidence = snapshot?.evidence_items || [];
  const ar = auditReport;

  /* Chart data */
  const carbonBreakdown = ar ? [
    { name: 'Carbon Stock', value: ar.estimated_carbon_stock, fill: '#10b981' },
    { name: 'Biomass', value: ar.biomass_estimate, fill: '#3b82f6' },
    { name: 'Soil Carbon', value: ar.soil_carbon_sample, fill: '#f59e0b' },
  ].filter(d => d.value > 0) : [];

  const biodiversityData = ar ? [
    { metric: 'Biodiversity Index', value: ar.biodiversity_index * 10, fullMark: 100 },
    { metric: 'Species Count', value: Math.min(ar.species_count * 5, 100), fullMark: 100 },
    { metric: 'Ecosystem Health', value: ar.ecosystem_condition === 'excellent' ? 95 : ar.ecosystem_condition === 'good' ? 75 : ar.ecosystem_condition === 'fair' ? 50 : 25, fullMark: 100 },
  ] : [];

  const treeSpeciesData = ar && ar.dominant_species ? [
    { name: ar.dominant_species, value: ar.tree_count },
  ] : [];

  return (
    <div className="space-y-0 pb-20">

      {/* ─── HERO HEADER ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white p-6 md:p-8 mb-6">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0zMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="relative">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 -ml-2 mb-4" onClick={() => router.push(`/dashboard/projects/${projectId}/verification`)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Verification
          </Button>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight">{application.project_name}</h1>
                  <p className="text-sm text-white/60 font-mono">{application.application_number}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('text-[10px] font-semibold border-0', APPLICATION_STATUS_COLORS[application.status])}>
                  <CheckCircle2 className="mr-1 h-3 w-3" /> {APPLICATION_STATUS_LABELS[application.status]}
                </Badge>
                {application.decision === 'approve' && (
                  <Badge className="text-[10px] border-0 bg-emerald-500/20 text-emerald-300">
                    <Award className="mr-1 h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
              <InfoRow label="Agency" value={application.verification_agency_name} />
              <InfoRow label="Lead Verifier" value={application.verifier_name || '—'} />
              <InfoRow label="Audit Date" value={fmtDate(application.audit_date)} />
              <InfoRow label="Submitted" value={fmtDate(application.submitted_date)} />
              <InfoRow label="Decision" value={application.decision_date ? fmtDate(application.decision_date) : 'Pending'} />
              {application.decision === 'approve' && application.verification_certificate && (
                <InfoRow label="Certificate" value={application.verification_certificate.certificate_number} mono />
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <Button size="sm" variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download Report
            </Button>
            {application.verification_certificate && (
              <Button size="sm" variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <FileCheck className="mr-1.5 h-3.5 w-3.5" /> View Certificate
              </Button>
            )}
            {application.carbon_passport && (
              <Button size="sm" variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Award className="mr-1.5 h-3.5 w-3.5" /> Carbon Passport
              </Button>
            )}
            <Button size="sm" variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => window.print()}>
              <Stamp className="mr-1.5 h-3.5 w-3.5" /> Print Report
            </Button>
          </div>
        </div>
      </div>

      {/* ─── TABS ────────────────────────────────────────────── */}
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b -mx-1 px-1 py-2">
          <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0">
            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5">
              <Eye className="mr-1 h-3 w-3" /> Overview
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5">
              <ClipboardList className="mr-1 h-3 w-3" /> Field Audit
            </TabsTrigger>
            <TabsTrigger value="metrics" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5">
              <BarChart3 className="mr-1 h-3 w-3" /> Environmental Metrics
            </TabsTrigger>
            <TabsTrigger value="evidence" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5">
              <Camera className="mr-1 h-3 w-3" /> Evidence
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5">
              <FolderOpen className="mr-1 h-3 w-3" /> Documents
            </TabsTrigger>
            <TabsTrigger value="certificates" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5">
              <FileCheck className="mr-1 h-3 w-3" /> Certificates
            </TabsTrigger>
            <TabsTrigger value="passport" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5">
              <Award className="mr-1 h-3 w-3" /> Carbon Passport
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-3 py-1.5">
              <Calendar className="mr-1 h-3 w-3" /> Timeline
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ─── TAB: OVERVIEW ────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-0">

          {/* KPI Strip */}
          {ar && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KpiCard icon={MapPin} label="Verified Area" value={ar.area_verified.toLocaleString()} unit="m²" color="from-blue-500/10 to-transparent border-blue-200" />
              <KpiCard icon={TreePine} label="Trees Verified" value={ar.tree_count.toLocaleString()} color="from-emerald-500/10 to-transparent border-emerald-200" />
              <KpiCard icon={Bug} label="Species" value={ar.species_count} color="from-purple-500/10 to-transparent border-purple-200" />
              <KpiCard icon={Wind} label="Carbon Stock" value={ar.estimated_carbon_stock.toLocaleString()} unit="tCO₂" color="from-cyan-500/10 to-transparent border-cyan-200" />
              <KpiCard icon={Leaf} label="Biomass" value={ar.biomass_estimate.toLocaleString()} unit="t" color="from-amber-500/10 to-transparent border-amber-200" />
              <KpiCard icon={Activity} label="Biodiversity" value={ar.biodiversity_index} unit="/10" color="from-rose-500/10 to-transparent border-rose-200" />
            </div>
          )}

          {/* Verification Decision */}
          {isDecided && (
            <Card className={cn('overflow-hidden', isApproved ? 'border-emerald-200' : application.decision === 'reject' ? 'border-red-200' : 'border-amber-200')}>
              <div className={cn('px-6 py-4', isApproved ? 'bg-emerald-50' : application.decision === 'reject' ? 'bg-red-50' : 'bg-amber-50')}>
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', isApproved ? 'bg-emerald-100' : application.decision === 'reject' ? 'bg-red-100' : 'bg-amber-100')}>
                    {isApproved ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className={cn('text-sm font-bold', isApproved ? 'text-emerald-800' : application.decision === 'reject' ? 'text-red-800' : 'text-amber-800')}>
                      {DECISION_LABELS[application.decision!]}
                    </p>
                    <p className={cn('text-xs', isApproved ? 'text-emerald-600' : application.decision === 'reject' ? 'text-red-600' : 'text-amber-600')}>
                      {application.decision_verifier_name ? `By ${application.decision_verifier_name}` : ''} {application.decision_date ? `on ${fmtDate(application.decision_date)}` : ''}
                    </p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoRow label="Decision Date" value={fmtDate(application.decision_date)} />
                  {application.decision_verifier_name && <InfoRow label="Verified By" value={application.decision_verifier_name} />}
                  {application.digital_signature && <InfoRow label="Digital Signature" value={application.digital_signature} mono />}
                  {application.blockchain_hash && <InfoRow label="Blockchain Hash" value={application.blockchain_hash} mono />}
                </div>
                {application.decision_notes && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Decision Notes</p>
                    <p className="text-sm">{application.decision_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Environmental Summary Cards */}
          {ar && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TreePine className="h-4 w-4 text-emerald-600" /> Forest Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  <MetricRow label="Tree Count" value={ar.tree_count.toLocaleString()} icon={TreePine} />
                  <MetricRow label="Dominant Species" value={ar.dominant_species} icon={Leaf} />
                  <MetricRow label="Average Height" value={ar.avg_tree_height ? `${ar.avg_tree_height} m` : '—'} icon={TrendingUp} />
                  <MetricRow label="Health Condition" value={ar.tree_health_condition} icon={HeartPulse} />
                  <MetricRow label="Species Count" value={ar.species_count} icon={Bug} />
                  <MetricRow label="Density" value={ar.tree_count > 0 && ar.area_verified > 0 ? `${(ar.tree_count / (ar.area_verified / 10000)).toFixed(0)} trees/ha` : '—'} icon={BarChart3} />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Wind className="h-4 w-4 text-cyan-600" /> Carbon Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  <MetricRow label="Carbon Stock" value={`${ar.estimated_carbon_stock.toLocaleString()} tCO₂`} icon={Wind} />
                  <MetricRow label="Biomass Estimate" value={`${ar.biomass_estimate.toLocaleString()} t`} icon={Leaf} />
                  <MetricRow label="Soil Carbon" value={`${ar.soil_carbon_sample} t/ha`} icon={Waves} />
                  <MetricRow label="Methodology" value={ar.carbon_methodology} icon={Target} />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Bug className="h-4 w-4 text-purple-600" /> Biodiversity & Site
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  <MetricRow label="Biodiversity Index" value={`${ar.biodiversity_index}/10`} icon={Activity} />
                  <MetricRow label="Wildlife Observed" value={ar.wildlife_observed || 'None'} icon={Eye} />
                  <MetricRow label="Ecosystem Condition" value={ar.ecosystem_condition} icon={Globe} />
                  <MetricRow label="Invasive Species" value={ar.invasive_species_found ? 'Found' : 'Not Found'} icon={AlertTriangle} />
                  <Separator className="my-1" />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <StatusPill ok={ar.gps_validated} label="GPS Verified" />
                    <StatusPill ok={ar.boundary_verified} label="Boundary" />
                    <StatusPill ok={ar.land_ownership_verified} label="Land Ownership" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!ar && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <ClipboardList className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                No audit report submitted yet for this application.
              </CardContent>
            </Card>
          )}

          {/* Site Conditions */}
          {ar && (ar.access_road_condition || ar.water_source_nearby || ar.nearby_land_use || ar.community_impact) && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-600" /> Site Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-x-8">
                  <MetricRow label="Access Road" value={ar.access_road_condition} icon={Route} />
                  <MetricRow label="Water Source" value={ar.water_source_nearby} icon={Droplets} />
                  <MetricRow label="Nearby Land Use" value={ar.nearby_land_use} icon={Globe} />
                  <MetricRow label="Community Impact" value={ar.community_impact} icon={Users} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risks */}
          {ar && (ar.risks || ar.corrective_actions) && (
            <div className="grid gap-4 md:grid-cols-2">
              {ar.risks && (
                <Card className="border-amber-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="h-4 w-4" /> Identified Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-amber-800">{ar.risks}</p>
                  </CardContent>
                </Card>
              )}
              {ar.corrective_actions && (
                <Card className="border-blue-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-700">
                      <Zap className="h-4 w-4" /> Corrective Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-800">{ar.corrective_actions}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Project Snapshot */}
          {snapshot ? (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" /> Project Snapshot
                </CardTitle>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Frozen at submission time</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoRow label="Project Type" value={snapshot.project_type} />
                  <InfoRow label="Location" value={snapshot.location} />
                  <InfoRow label="Area" value={`${snapshot.area_hectares.toLocaleString()} ha`} />
                  <InfoRow label="Methodology" value={snapshot.methodology} />
                  <InfoRow label="Latitude" value={String(snapshot.latitude)} mono />
                  <InfoRow label="Longitude" value={String(snapshot.longitude)} mono />
                  <InfoRow label="Owner" value={snapshot.owner_name} />
                  <InfoRow label="Organization" value={snapshot.owner_organization} />
                </div>
                {snapshot.description && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{snapshot.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Project snapshot not available for this application.
              </CardContent>
            </Card>
          )}

          {/* Auditor Observations */}
          {ar && (ar.remarks || ar.final_observation) && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-600" /> Auditor Observations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ar.remarks && (
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Remarks</p>
                    <p className="text-sm">{ar.remarks}</p>
                  </div>
                )}
                {ar.final_observation && (
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Final Observation</p>
                    <p className="text-sm">{ar.final_observation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── TAB: FIELD AUDIT ──────────────────────────────── */}
        <TabsContent value="audit" className="space-y-6 mt-0">
          {ar ? (
            <>
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" /> Audit Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoRow label="Lead Auditor" value={ar.auditor_name} />
                    <InfoRow label="Audit Date" value={fmtDate(ar.audit_date)} />
                    <InfoRow label="Photos Taken" value={String(ar.photos_count)} />
                    <InfoRow label="Videos Taken" value={String(ar.videos_count)} />
                    <InfoRow label="GPS Validated" value={ar.gps_validated ? 'Yes' : 'No'} />
                    <InfoRow label="GPS Coordinates" value={ar.gps_coordinates} mono />
                    <InfoRow label="Samples Collected" value={String(ar.samples_collected)} />
                    <InfoRow label="Site Condition" value={ar.site_condition} />
                  </div>
                </CardContent>
              </Card>

              {/* Site Verification */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4 text-orange-600" /> Site Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <StatusPill ok={ar.land_ownership_verified} label="Land Ownership Verified" />
                    <StatusPill ok={ar.boundary_verified} label="Boundary Verified" />
                    <StatusPill ok={ar.gps_validated} label="GPS Coordinates Validated" />
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" /> GPS Route & Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ar.gps_coordinates ? (
                      <div className="space-y-2">
                        <div className="p-3 rounded-lg bg-muted/50 font-mono text-xs break-all">{ar.gps_coordinates}</div>
                        <Button size="sm" variant="outline" className="w-full" asChild>
                          <a href={`https://www.google.com/maps?q=${ar.gps_coordinates.split(',')[0]},${ar.gps_coordinates.split(',')[1]}`} target="_blank" rel="noopener noreferrer">
                            <Map className="mr-1.5 h-3.5 w-3.5" /> Open in Maps
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No GPS coordinates recorded</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Observations */}
              <div className="grid gap-4 md:grid-cols-2">
                {ar.remarks && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Remarks
                      </CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-sm">{ar.remarks}</p></CardContent>
                  </Card>
                )}
                {ar.final_observation && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" /> Final Observation
                      </CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-sm">{ar.final_observation}</p></CardContent>
                  </Card>
                )}
              </div>

              {ar.risks && (
                <Card className="border-amber-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700">
                      <AlertTriangle className="h-4 w-4" /> Risks & Corrective Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-amber-600 mb-1">Risks</p>
                      <p className="text-sm">{ar.risks}</p>
                    </div>
                    {ar.corrective_actions && (
                      <div>
                        <p className="text-xs font-semibold text-blue-600 mb-1">Corrective Actions</p>
                        <p className="text-sm">{ar.corrective_actions}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <ClipboardList className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                No audit report available for this application.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── TAB: ENVIRONMENTAL METRICS ────────────────────── */}
        <TabsContent value="metrics" className="space-y-6 mt-0">
          {ar ? (
            <>
              {/* Charts Row */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Carbon Breakdown Pie */}
                {carbonBreakdown.length > 0 && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4 text-cyan-600" /> Carbon Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={carbonBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                            {carbonBreakdown.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => `${v.toLocaleString()} t`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Carbon Metrics Bar */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-emerald-600" /> Carbon Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={[
                        { name: 'Carbon Stock', value: ar.estimated_carbon_stock },
                        { name: 'Biomass', value: ar.biomass_estimate },
                        { name: 'Soil Carbon', value: ar.soil_carbon_sample },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Biodiversity Radar */}
                {biodiversityData.length > 0 && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-600" /> Biodiversity Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={biodiversityData}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                          <Radar name="Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Detailed Metrics */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TreePine className="h-4 w-4 text-emerald-600" /> Forest Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0">
                    <MetricRow label="Total Trees" value={ar.tree_count.toLocaleString()} />
                    <MetricRow label="Dominant Species" value={ar.dominant_species} />
                    <MetricRow label="Average Height" value={ar.avg_tree_height ? `${ar.avg_tree_height} m` : '—'} />
                    <MetricRow label="Health Condition" value={ar.tree_health_condition} />
                    <MetricRow label="Species Count" value={ar.species_count} />
                    <MetricRow label="Plantation Density" value={ar.tree_count > 0 && ar.area_verified > 0 ? `${(ar.tree_count / (ar.area_verified / 10000)).toFixed(0)} trees/ha` : '—'} />
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Wind className="h-4 w-4 text-cyan-600" /> Carbon Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0">
                    <MetricRow label="Estimated Carbon Stock" value={`${ar.estimated_carbon_stock.toLocaleString()} tCO₂`} />
                    <MetricRow label="Biomass Estimate" value={`${ar.biomass_estimate.toLocaleString()} t`} />
                    <MetricRow label="Soil Carbon Sample" value={`${ar.soil_carbon_sample} t/ha`} />
                    <MetricRow label="Methodology" value={ar.carbon_methodology} />
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Bug className="h-4 w-4 text-purple-600" /> Biodiversity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0">
                    <MetricRow label="Species Count" value={ar.species_count} />
                    <MetricRow label="Biodiversity Index" value={`${ar.biodiversity_index}/10`} />
                    <MetricRow label="Wildlife Observed" value={ar.wildlife_observed || 'None recorded'} />
                    <MetricRow label="Invasive Species" value={ar.invasive_species_found ? 'Found' : 'Not Found'} />
                    <MetricRow label="Ecosystem Condition" value={ar.ecosystem_condition} />
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4 text-orange-600" /> Site Quality
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0">
                    <MetricRow label="Site Condition" value={ar.site_condition} />
                    <MetricRow label="Access Road" value={ar.access_road_condition} />
                    <MetricRow label="Water Source" value={ar.water_source_nearby} />
                    <MetricRow label="Nearby Land Use" value={ar.nearby_land_use} />
                    <MetricRow label="Community Impact" value={ar.community_impact} />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No environmental metrics available.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── TAB: EVIDENCE ─────────────────────────────────── */}
        <TabsContent value="evidence" className="space-y-6 mt-0">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" /> Evidence Gallery
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {ar ? `${ar.photos_count} photos, ${ar.videos_count} videos collected during audit` : 'No audit evidence'}
              </p>
            </CardHeader>
            <CardContent>
              {ar && ar.photos_count + ar.videos_count > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({ length: ar.photos_count }).slice(0, 8).map((_, i) => (
                    <div key={`photo-${i}`} className="aspect-square rounded-lg border bg-muted/30 flex flex-col items-center justify-center gap-1">
                      <Camera className="h-5 w-5 text-muted-foreground/40" />
                      <span className="text-[10px] text-muted-foreground">Photo {i + 1}</span>
                    </div>
                  ))}
                  {Array.from({ length: ar.videos_count }).slice(0, 4).map((_, i) => (
                    <div key={`video-${i}`} className="aspect-square rounded-lg border bg-muted/30 flex flex-col items-center justify-center gap-1">
                      <Eye className="h-5 w-5 text-muted-foreground/40" />
                      <span className="text-[10px] text-muted-foreground">Video {i + 1}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No evidence collected for this audit.</p>
              )}
            </CardContent>
          </Card>

          {/* Evidence Items from Snapshot */}
          {allEvidence.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" /> Evidence Items
                  <Badge variant="outline" className="text-[10px] ml-1">{allEvidence.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allEvidence.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{ev.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {ev.location}</span>
                          <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {fmtDate(ev.date_collected)}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{ev.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── TAB: DOCUMENTS ────────────────────────────────── */}
        <TabsContent value="documents" className="space-y-6 mt-0">
          {allDocs.length > 0 ? (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" /> Attached Documents
                  <Badge variant="outline" className="text-[10px] ml-1">{allDocs.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">{doc.file_type}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>{doc.file_size}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{DOCUMENT_CATEGORY_LABELS[doc.category]}</span>
                          {doc.gps_available && <span className="flex items-center gap-1 text-emerald-600"><Map className="h-3 w-3" /> GPS</span>}
                          {doc.metadata_available && <span className="flex items-center gap-1 text-blue-600"><Camera className="h-3 w-3" /> Metadata</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1.5">
                          <div className={cn('h-1.5 w-1.5 rounded-full', doc.quality_score >= 80 ? 'bg-emerald-500' : doc.quality_score >= 60 ? 'bg-amber-500' : 'bg-red-500')} />
                          <span className="text-xs font-medium">{doc.quality_score}%</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Quality</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <FolderOpen className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                No documents attached for this application.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── TAB: CERTIFICATES ─────────────────────────────── */}
        <TabsContent value="certificates" className="space-y-6 mt-0">
          {application.verification_certificate ? (
            <Card className="shadow-sm border-emerald-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">Verification Certificate</p>
                    <p className="text-sm text-emerald-100">{application.verification_certificate.certificate_number}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoRow label="Certificate Number" value={application.verification_certificate.certificate_number} mono />
                  <InfoRow label="Project" value={application.verification_certificate.project_name} />
                  <InfoRow label="Owner" value={application.verification_certificate.project_owner} />
                  <InfoRow label="NGO" value={application.verification_certificate.ngo} />
                  <InfoRow label="Verifier" value={application.verification_certificate.verifier} />
                  <InfoRow label="Decision" value={application.verification_certificate.decision} />
                  <InfoRow label="Issued Date" value={fmtDate(application.verification_certificate.issued_date)} />
                  <InfoRow label="Digital Signature" value={application.verification_certificate.digital_signature} mono />
                  <InfoRow label="Blockchain Hash" value={application.verification_certificate.blockchain_hash} mono />
                </div>
                {application.verification_certificate.verified_documents.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Verified Documents</p>
                    <div className="flex flex-wrap gap-1.5">
                      {application.verification_certificate.verified_documents.map((name, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <Button size="sm" className="mt-2">
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download Certificate
                </Button>
              </CardContent>
            </Card>
          ) : isDecided && application.decision !== 'approve' ? (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <FileCheck className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                No certificate issued. This application was {application.decision === 'return_for_revision' ? 'returned for revision' : 'rejected'}.
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <FileCheck className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                No certificate available yet.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── TAB: CARBON PASSPORT ──────────────────────────── */}
        <TabsContent value="passport" className="space-y-6 mt-0">
          {application.carbon_passport ? (
            <Card className="shadow-sm border-blue-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">Carbon Passport</p>
                    <p className="text-sm text-blue-100">{application.carbon_passport.passport_number}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoRow label="Passport Number" value={application.carbon_passport.passport_number} mono />
                  <InfoRow label="Project" value={application.carbon_passport.project_name} />
                  <InfoRow label="Owner" value={application.carbon_passport.project_owner} />
                  <InfoRow label="NGO" value={application.carbon_passport.ngo} />
                  <InfoRow label="Carbon Credits" value={`${application.carbon_passport.carbon_credits_tonnes.toLocaleString()} tCO₂e`} />
                  <InfoRow label="Methodology" value={application.carbon_passport.methodology} />
                  <InfoRow label="Valid From" value={fmtDate(application.carbon_passport.valid_from)} />
                  <InfoRow label="Valid Until" value={fmtDate(application.carbon_passport.valid_until)} />
                  <InfoRow label="Issued Date" value={fmtDate(application.carbon_passport.issued_date)} />
                  <InfoRow label="Issued By" value={application.carbon_passport.issued_by} />
                  <InfoRow label="Digital Signature" value={application.carbon_passport.digital_signature} mono />
                  <InfoRow label="Blockchain Hash" value={application.carbon_passport.blockchain_hash} mono />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm">
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Download Passport
                  </Button>
                  <Button size="sm" variant="outline">
                    <QrCode className="mr-1.5 h-3.5 w-3.5" /> View QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : isApproved ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <Award className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                No Carbon Passport has been applied for this project yet.
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                <Award className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                Carbon Passport is only available after project verification approval.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── TAB: TIMELINE ─────────────────────────────────── */}
        <TabsContent value="timeline" className="space-y-6 mt-0">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Application Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                      <Send className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="w-px flex-1 bg-border/60 my-1" />
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium">Application Submitted</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(application.submitted_date)}</p>
                  </div>
                </div>

                {application.audit_date && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                        <ClipboardList className="h-3.5 w-3.5 text-purple-600" />
                      </div>
                      <div className="w-px flex-1 bg-border/60 my-1" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">Field Audit Completed</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(application.audit_date)}</p>
                      {application.verifier_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">By: {application.verifier_name}</p>
                      )}
                    </div>
                  </div>
                )}

                {isDecided && application.decision_date && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        isApproved && 'bg-emerald-100 dark:bg-emerald-900/50',
                        application.decision === 'return_for_revision' && 'bg-amber-100 dark:bg-amber-900/50',
                        application.decision === 'reject' && 'bg-red-100 dark:bg-red-900/50',
                      )}>
                        {isApproved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                        {application.decision === 'return_for_revision' && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                        {application.decision === 'reject' && <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}
                      </div>
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Decision Rendered</p>
                        <Badge className={cn('text-[10px] font-semibold', DECISION_COLORS[application.decision!])}>
                          {DECISION_LABELS[application.decision!]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(application.decision_date)}</p>
                      {application.decision_verifier_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">By: {application.decision_verifier_name}</p>
                      )}
                    </div>
                  </div>
                )}

                {!isDecided && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Awaiting Decision</p>
                    </div>
                  </div>
                )}
              </div>

              {isDecided && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {application.decision_notes && (
                      <div className="col-span-2 md:col-span-3">
                        <InfoRow label="Decision Notes" value={application.decision_notes} />
                      </div>
                    )}
                    {application.digital_signature && <InfoRow label="Digital Signature" value={application.digital_signature} mono />}
                    {application.blockchain_hash && <InfoRow label="Blockchain Hash" value={application.blockchain_hash} mono />}
                    {application.decision_verifier_name && <InfoRow label="Verifier" value={application.decision_verifier_name} />}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <div className="mt-8 pt-4 border-t">
        <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
          <Lock className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Immutable Application Record</p>
            <p className="text-[10px] text-slate-400">This verification application is immutable. Documents and audit data cannot be modified after submission.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
