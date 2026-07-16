'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet, File } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

const REPORTS = [
  {
    id: 'users',
    title: 'User Report',
    description: 'Detailed extract of all registered users, their roles, KYC statuses, and activity metrics.',
    table: 'profiles',
    columns: 'id, email, full_name, role, approval_status, organization, created_at',
  },
  {
    id: 'projects',
    title: 'Project Report',
    description: 'Comprehensive data on all restoration projects including area, status, location, and health scores.',
    table: 'projects',
    columns: 'id, name, status, project_type, area_hectares, verified_carbon_tonnes, verification_status, created_at',
  },
  {
    id: 'verifications',
    title: 'Verification Report',
    description: 'Log of all verification requests, assigned auditors, timelines, and final decisions.',
    table: 'verification_service_requests',
    columns: 'id, project_id, verifier_id, request_type, status, priority, created_at',
  },
  {
    id: 'carbon',
    title: 'Carbon Impact Report',
    description: 'Total carbon tonnes sequestered, estimated impact, and passports issued platform-wide.',
    table: 'carbon_passports',
    columns: 'id, project_id, issued_by, status, created_at',
  },
];

function downloadCSV(filename: string, headers: string[], rows: any[][]) {
  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [generating, setGenerating] = React.useState<string | null>(null);

  const handleDownload = async (report: typeof REPORTS[0], format: string) => {
    setGenerating(report.id);
    try {
      const { data, error } = await supabase
        .from(report.table)
        .select(report.columns)
        .limit(1000);

      if (error) throw error;

      const headers = report.columns.split(', ');
      const rows = (data || []).map((row: any) => headers.map((h) => row[h]));

      if (format === 'csv') {
        downloadCSV(`${report.id}_report.csv`, headers, rows);
        toast.success(`${report.title} downloaded as CSV`);
      } else {
        // For xlsx/pdf, generate CSV as placeholder
        downloadCSV(`${report.id}_report.csv`, headers, rows);
        toast.success(`${report.title} downloaded (CSV format — Excel/PDF coming soon)`);
      }
    } catch (err: any) {
      toast.error(`Failed to generate report: ${err.message}`);
    }
    setGenerating(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Platform Reports</h1>
        <p className="text-sm text-muted-foreground">Generate and export real data extracts from the database</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <Card key={report.id} className="flex flex-col h-full">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">{report.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed min-h-[40px]">
                {report.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto space-y-3">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Export As
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 h-9"
                  disabled={generating === report.id}
                  onClick={() => handleDownload(report, 'csv')}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  {generating === report.id ? '...' : 'CSV'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 h-9"
                  disabled={generating === report.id}
                  onClick={() => handleDownload(report, 'xlsx')}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 h-9"
                  disabled={generating === report.id}
                  onClick={() => handleDownload(report, 'pdf')}
                >
                  <File className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
