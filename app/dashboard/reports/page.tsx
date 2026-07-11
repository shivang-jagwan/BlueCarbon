'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useProjects, useAssignedProjects } from '@/hooks/use-projects';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3, FileText, Download, TrendingUp, DollarSign, Leaf,
  Calendar, Award, Building2, Users,
} from 'lucide-react';

const OWNER_REPORTS = [
  { id: 'monthly', label: 'Monthly Report', icon: Calendar, desc: 'Monthly monitoring summary across all projects' },
  { id: 'annual', label: 'Annual Report', icon: FileText, desc: 'Yearly performance overview' },
  { id: 'carbon', label: 'Carbon Report', icon: Leaf, desc: 'Carbon sequestration analysis' },
  { id: 'government', label: 'Government Report', icon: FileText, desc: 'Regulatory compliance report' },
  { id: 'investor', label: 'Investor Report', icon: TrendingUp, desc: 'Impact metrics for investors' },
  { id: 'passport', label: 'Passport Summary', icon: Award, desc: 'Carbon passport overview' },
];

const VERIFIER_REPORTS = [
  { id: 'land', label: 'Land Verification Report', icon: FileText, desc: 'Land ownership and boundary verification' },
  { id: 'project', label: 'Project Verification Report', icon: FileText, desc: 'Full project verification audit' },
  { id: 'monthly', label: 'Monthly Monitoring Report', icon: Calendar, desc: 'Monthly monitoring verification' },
  { id: 'carbon', label: 'Carbon Assessment Report', icon: Leaf, desc: 'Carbon sequestration assessment' },
  { id: 'government', label: 'Government Report', icon: FileText, desc: 'Regulatory compliance report' },
  { id: 'corporate', label: 'Corporate Due Diligence', icon: Building2, desc: 'Independent corporate verification' },
];

const PARTNER_REPORTS = [
  { id: 'esg', label: 'ESG Report', icon: BarChart3, desc: 'Environmental, Social, and Governance impact' },
  { id: 'csr', label: 'CSR Report', icon: FileText, desc: 'Corporate Social Responsibility report' },
  { id: 'carbon', label: 'Carbon Impact Report', icon: Leaf, desc: 'Carbon sequestration from funded projects' },
  { id: 'funding', label: 'Funding Report', icon: DollarSign, desc: 'Funding allocation and utilization' },
  { id: 'ngo', label: 'NGO Assessment', icon: Building2, desc: 'Verifier performance assessment' },
  { id: 'annual', label: 'Annual Sustainability Report', icon: TrendingUp, desc: 'Yearly sustainability impact' },
];

export default function ReportsPage() {
  const { profile, user } = useAuth();
  const role = profile?.role;
  const isVerifier = role === 'verifier';
  const isPartner = role === 'sustainability_partner';

  const ownerProjects = useProjects();
  const assignedProjects = useAssignedProjects(user?.id ?? null);
  const projects = isVerifier ? assignedProjects.projects : ownerProjects.projects;

  const reportTypes = isVerifier ? VERIFIER_REPORTS : isPartner ? PARTNER_REPORTS : OWNER_REPORTS;

  const totalArea = projects.reduce((s, p) => s + (p.area_hectares || 0), 0);
  const totalCarbon = projects.reduce((s, p) => s + (p.target_carbon_tonnes || 0), 0);
  const passportsIssued = projects.filter((p) => p.passport_issued_at).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPartner ? 'Generate ESG, CSR, and sustainability impact reports' : 'Generate and download project reports'}
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><BarChart3 className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">{isPartner ? 'Supported' : 'Total'} Projects</p><p className="font-display text-xl font-semibold">{projects.length}</p></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success"><Leaf className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Total Area</p><p className="font-display text-xl font-semibold">{totalArea.toFixed(1)} ha</p></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent"><TrendingUp className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Target Carbon</p><p className="font-display text-xl font-semibold">{totalCarbon} t</p></div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning"><Award className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Passports</p><p className="font-display text-xl font-semibold">{passportsIssued}</p></div>
          </div>
        </Card>
      </div>

      {/* Report Types */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card key={type.id} className="p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
              <h3 className="font-semibold">{type.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{type.desc}</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1"><Download className="mr-2 h-3.5 w-3.5" />PDF</Button>
                <Button variant="outline" size="sm" className="flex-1"><Download className="mr-2 h-3.5 w-3.5" />Excel</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
