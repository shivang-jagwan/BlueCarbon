'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { KpiCard } from '@/components/shared/kpi-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Ruler, Leaf, Users, Sprout, Building2, FolderKanban,
  TrendingUp, MapPin, BarChart3, Globe, TreePine,
  ShieldCheck, Award, Activity, Droplets, Wind,
} from 'lucide-react';
import { PROJECT_TYPE_LABELS, type ProjectType } from '@/lib/types';
import { APPLICATION_STATUS_LABELS } from '@/lib/voc-types';
import { cn } from '@/lib/utils';

interface EnrichedProject {
  id: string;
  name: string;
  project_type: string;
  status: string;
  verification_status: string;
  area_hectares: number | null;
  target_carbon_tonnes: number | null;
  verified_carbon_tonnes: number | null;
  verified_area_hectares: number | null;
  verified_tree_count: number | null;
  verified_species_count: number | null;
  verified_biomass_carbon: number | null;
  verified_soil_organic_carbon: number | null;
  verified_biodiversity_index: number | null;
  verified_ecosystem_health: string | null;
  health_score: number | null;
  location_name: string | null;
  cover_image_url: string | null;
  passport_issued_at: string | null;
  created_at: string;
}

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

export default function ImpactDashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = React.useState<EnrichedProject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [passportCounts, setPassportCounts] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      const { data: projData } = await supabase
        .from('projects')
        .select('id, name, project_type, status, verification_status, area_hectares, target_carbon_tonnes, verified_carbon_tonnes, verified_area_hectares, verified_tree_count, verified_species_count, verified_biomass_carbon, verified_soil_organic_carbon, verified_biodiversity_index, verified_ecosystem_health, health_score, location_name, cover_image_url, passport_issued_at, created_at')
        .eq('owner_id', user.id);

      const enriched = (projData as EnrichedProject[]) || [];
      setProjects(enriched);

      if (enriched.length > 0) {
        const ids = enriched.map(p => p.id);
        const { data: passports } = await supabase
          .from('voc_passport_applications')
          .select('project_id, status')
          .in('project_id', ids);

        const counts: Record<string, number> = {};
        if (passports) {
          for (const pp of passports) {
            counts[pp.status] = (counts[pp.status] || 0) + 1;
          }
        }
        setPassportCounts(counts);
      }

      setLoading(false);
    })();
  }, [user]);

  const totalArea = projects.reduce((s, p) => s + (p.area_hectares || 0), 0);
  const verifiedArea = projects.reduce((s, p) => s + (p.verified_area_hectares || 0), 0);
  const targetCarbon = projects.reduce((s, p) => s + (p.target_carbon_tonnes || 0), 0);
  const verifiedCarbon = projects.reduce((s, p) => s + (p.verified_carbon_tonnes || 0), 0);
  const totalTrees = projects.reduce((s, p) => s + (p.verified_tree_count || 0), 0);
  const totalSpecies = projects.reduce((s, p) => s + (p.verified_species_count || 0), 0);
  const totalBiomass = projects.reduce((s, p) => s + (p.verified_biomass_carbon || 0), 0);
  const totalSoilCarbon = projects.reduce((s, p) => s + (p.verified_soil_organic_carbon || 0), 0);
  const avgBiodiversity = projects.length > 0
    ? projects.reduce((s, p) => s + (p.verified_biodiversity_index || 0), 0) / projects.filter(p => p.verified_biodiversity_index != null).length || 0
    : 0;

  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'verified').length;
  const verifiedProjects = projects.filter(p => p.verification_status === 'approved').length;
  const passportsIssued = projects.filter(p => p.passport_issued_at).length;
  const avgHealth = projects.filter(p => p.health_score != null).length > 0
    ? projects.reduce((s, p) => s + (p.health_score || 0), 0) / projects.filter(p => p.health_score != null).length
    : 0;

  const typeBreakdown = projects.reduce((acc, p) => {
    const label = PROJECT_TYPE_LABELS[p.project_type as ProjectType] || p.project_type;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusBreakdown = projects.reduce((acc, p) => {
    const label = APPLICATION_STATUS_LABELS[p.verification_status as keyof typeof APPLICATION_STATUS_LABELS] || p.verification_status || 'Not Submitted';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const ecosystemData = Object.entries(typeBreakdown)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const statusData = Object.entries(statusBreakdown)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const carbonByProject = projects
    .filter(p => p.target_carbon_tonnes || p.verified_carbon_tonnes)
    .map(p => ({
      name: p.name.length > 20 ? p.name.slice(0, 18) + '...' : p.name,
      target: p.target_carbon_tonnes || 0,
      verified: p.verified_carbon_tonnes || 0,
    }))
    .slice(0, 8);

  const carbonComparisonData = carbonByProject;

  const typeColorMap: Record<string, string> = {
    'Mangrove': '#10b981',
    'Seagrass': '#14b8a6',
    'Salt Marsh': '#06b6d4',
    'Kelp Forest': '#3b82f6',
    'Mixed Ecosystem': '#8b5cf6',
  };

  const statusColorMap: Record<string, string> = {
    'Approved': '#10b981',
    'Verified': '#10b981',
    'Submitted': '#3b82f6',
    'Under Review': '#3b82f6',
    'Pending': '#f59e0b',
    'Rejected': '#ef4444',
    'Not Started': '#94a3b8',
    'Not Submitted': '#94a3b8',
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-96 rounded bg-muted animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-xl border border-border/60 bg-white dark:bg-slate-900 animate-pulse" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-xl border border-border/60 bg-white dark:bg-slate-900 animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">

      {/* ─── Header ─────────────────────────────────────── */}
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Impact Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Executive overview of your sustainability initiatives and environmental impact
        </p>
      </div>

      {/* ─── KPI Row 1: Core Metrics ──────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Projects"
          value={projects.length}
          hint={`${activeProjects} active`}
          icon={FolderKanban}
        />
        <KpiCard
          label="Verified Projects"
          value={verifiedProjects}
          hint={verifiedProjects > 0 ? `${Math.round((verifiedProjects / projects.length) * 100)}% verification rate` : 'None yet'}
          icon={ShieldCheck}
        />
        <KpiCard
          label="Total Area"
          value={totalArea > 0 ? `${totalArea.toFixed(1)} ha` : '—'}
          hint={verifiedArea > 0 ? `${verifiedArea.toFixed(1)} ha verified` : 'No verified area'}
          icon={Ruler}
        />
        <KpiCard
          label="Carbon Sequestered"
          value={verifiedCarbon > 0 ? `${verifiedCarbon.toLocaleString()} t` : targetCarbon > 0 ? `${targetCarbon.toLocaleString()} t target` : '—'}
          hint={verifiedCarbon > 0 ? `${Math.round((verifiedCarbon / (targetCarbon || 1)) * 100)}% of target` : 'Awaiting verification'}
          icon={Leaf}
        />
      </div>

      {/* ─── KPI Row 2: Verified Metrics ─────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Trees Planted"
          value={totalTrees > 0 ? totalTrees.toLocaleString() : '—'}
          hint="Verified count"
          icon={TreePine}
        />
        <KpiCard
          label="Species Documented"
          value={totalSpecies > 0 ? totalSpecies.toLocaleString() : '—'}
          hint="Verified species"
          icon={Sprout}
        />
        <KpiCard
          label="Biomass Carbon"
          value={totalBiomass > 0 ? `${totalBiomass.toLocaleString()} t` : '—'}
          hint="Verified biomass"
          icon={Wind}
        />
        <KpiCard
          label="Carbon Passports"
          value={passportsIssued}
          hint={passportsIssued > 0 ? 'Issued to projects' : 'None yet'}
          icon={Award}
        />
      </div>

      {/* ─── KPI Row 3: Health ──────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Avg Health Score"
          value={avgHealth > 0 ? `${Math.round(avgHealth)}%` : '—'}
          hint="Across all projects"
          icon={Activity}
        />
        <KpiCard
          label="Avg Biodiversity Index"
          value={avgBiodiversity > 0 ? avgBiodiversity.toFixed(2) : '—'}
          hint="Verified biodiversity"
          icon={Globe}
        />
        <KpiCard
          label="Soil Organic Carbon"
          value={totalSoilCarbon > 0 ? `${totalSoilCarbon.toLocaleString()} t` : '—'}
          hint="Verified soil carbon"
          icon={Droplets}
        />
      </div>

      {/* ─── Charts Row ─────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Carbon Target vs Verified */}
        {carbonComparisonData.length > 0 && (
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Carbon Target vs Verified</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={carbonComparisonData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="target" name="Target (t)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="verified" name="Verified (t)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Projects by Ecosystem Pie */}
        {ecosystemData.length > 0 && (
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Projects by Ecosystem</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={ecosystemData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  style={{ fontSize: '11px' }}
                >
                  {ecosystemData.map((entry, idx) => (
                    <Cell key={entry.name} fill={typeColorMap[entry.name] || PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* ─── Verification & Passport Status ──────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Verification Status Breakdown */}
        {statusData.length > 0 && (
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Verification Status</h2>
            </div>
            <div className="space-y-3">
              {statusData.map(({ name, value }) => (
                <div key={name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{name}</span>
                    <span className="text-muted-foreground">{value} project{value !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(value / projects.length) * 100}%`,
                        backgroundColor: statusColorMap[name] || '#64748b',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Carbon Passport Status */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Carbon Passport Status</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Issued', count: passportCounts['issued'] || 0, color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800', icon: Award },
              { label: 'Under Review', count: (passportCounts['under_processing'] || 0) + (passportCounts['requested'] || 0), color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800', icon: Activity },
              { label: 'Rejected', count: passportCounts['rejected'] || 0, color: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800', icon: ShieldCheck },
              { label: 'Not Applied', count: projects.length - (passportCounts['issued'] || 0) - (passportCounts['under_processing'] || 0) - (passportCounts['requested'] || 0) - (passportCounts['rejected'] || 0), color: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700', icon: FolderKanban },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={cn('flex items-center gap-2.5 rounded-lg border p-3', card.color)}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-lg font-bold leading-none">{card.count}</p>
                    <p className="text-[10px] mt-0.5 opacity-80">{card.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ─── Project List ──────────────────────────────── */}
      {projects.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">All Projects</h2>
            <Badge variant="secondary" className="ml-auto text-[10px]">{projects.length}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="pb-2 text-left font-medium text-muted-foreground">Project</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground">Type</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Area (ha)</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Carbon (t)</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Trees</th>
                  <th className="pb-2 text-right font-medium text-muted-foreground">Species</th>
                  <th className="pb-2 text-center font-medium text-muted-foreground">Status</th>
                  <th className="pb-2 text-center font-medium text-muted-foreground">Health</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => {
                  const typeLabel = PROJECT_TYPE_LABELS[p.project_type as ProjectType] || p.project_type;
                  const statusLabel = APPLICATION_STATUS_LABELS[p.verification_status as keyof typeof APPLICATION_STATUS_LABELS] || p.verification_status || '—';
                  return (
                    <tr key={p.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 font-medium">{p.name}</td>
                      <td className="py-2.5 text-muted-foreground">{typeLabel}</td>
                      <td className="py-2.5 text-right tabular-nums">{p.area_hectares?.toFixed(1) || '—'}</td>
                      <td className="py-2.5 text-right tabular-nums">{(p.verified_carbon_tonnes || p.target_carbon_tonnes || 0).toLocaleString()}</td>
                      <td className="py-2.5 text-right tabular-nums">{p.verified_tree_count?.toLocaleString() || '—'}</td>
                      <td className="py-2.5 text-right tabular-nums">{p.verified_species_count?.toLocaleString() || '—'}</td>
                      <td className="py-2.5 text-center">
                        <Badge className={cn(
                          'text-[9px] border font-medium',
                          p.verification_status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          p.verification_status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                          p.verification_status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        )}>{statusLabel}</Badge>
                      </td>
                      <td className="py-2.5 text-center">
                        {p.health_score != null ? (
                          <span className={cn(
                            'font-semibold',
                            p.health_score >= 75 ? 'text-emerald-600' : p.health_score >= 50 ? 'text-amber-600' : 'text-red-600'
                          )}>{p.health_score}%</span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ─── Empty State ───────────────────────────────── */}
      {projects.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-lg">No Projects Yet</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Create your first blue carbon project to start tracking environmental impact, verification progress, and carbon sequestration metrics.
          </p>
        </Card>
      )}
    </div>
  );
}
