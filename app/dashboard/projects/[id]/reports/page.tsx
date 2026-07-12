'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProject, useMonitoringReports, useFunding } from '@/hooks/use-projects';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Leaf,
  Calendar,
} from 'lucide-react';

const REPORT_TYPES = [
  { id: 'monthly', label: 'Monthly Report', icon: Calendar, desc: 'Monthly monitoring summary' },
  { id: 'annual', label: 'Annual Report', icon: FileText, desc: 'Yearly project performance' },
  { id: 'carbon', label: 'Carbon Report', icon: Leaf, desc: 'Carbon sequestration analysis' },
  { id: 'government', label: 'Government Report', icon: FileText, desc: 'Regulatory compliance report' },
  { id: 'investor', label: 'Investor Report', icon: TrendingUp, desc: 'Impact metrics for investors' },
];

export default function ReportsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project } = useProject(projectId);
  const { reports } = useMonitoringReports(projectId);
  const { contributions } = useFunding(projectId);

  const totalFunding = contributions
    .filter((c) => c.status === 'completed')
    .reduce((s, c) => s + c.amount_usd, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate and download project reports
        </p>
      </div>

      {/* Report Types */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <Card key={type.id} className="p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{type.label}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{type.desc}</p>
              <Button variant="outline" size="sm" className="mt-4 w-full">
                <Download className="mr-2 h-3.5 w-3.5" />
                Generate
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Project Summary</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem icon={BarChart3} label="Monitoring Reports" value={String(reports.length)} />
          <SummaryItem icon={DollarSign} label="Total Support" value={`$${totalFunding.toLocaleString()}`} />
          <SummaryItem icon={Leaf} label="Area" value={project?.area_hectares ? `${project.area_hectares.toFixed(1)} ha` : '—'} />
          <SummaryItem icon={TrendingUp} label="Health Score" value={project?.health_score ? `${project.health_score}/100` : '—'} />
        </div>
      </Card>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
