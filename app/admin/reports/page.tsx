'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, FileSpreadsheet, File } from 'lucide-react';
import { toast } from 'sonner';

const REPORTS = [
  {
    id: 'users',
    title: 'User Report',
    description: 'Detailed extract of all registered users, their roles, KYC statuses, and activity metrics.',
  },
  {
    id: 'projects',
    title: 'Project Report',
    description: 'Comprehensive data on all restoration projects including area, status, location, and health scores.',
  },
  {
    id: 'verifications',
    title: 'Verification Report',
    description: 'Log of all verification requests, assigned auditors, timelines, and final decisions.',
  },
  {
    id: 'funding',
    title: 'Funding Report',
    description: 'Financial extract of all pledged and completed funding contributions across projects.',
  },
  {
    id: 'carbon',
    title: 'Carbon Impact Report',
    description: 'Total carbon tonnes sequestered, estimated impact, and passports issued platform-wide.',
  },
];

export default function ReportsPage() {
  const handleDownload = (type: string, format: string) => {
    toast.success(`Generating ${type} report as ${format.toUpperCase()}...`);
    setTimeout(() => {
      toast.success(`${type}_report.${format} downloaded successfully.`);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Platform Reports</h1>
        <p className="text-sm text-muted-foreground">Generate and export comprehensive data extracts</p>
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
                  onClick={() => handleDownload(report.id, 'csv')}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-1.5 h-9" 
                  onClick={() => handleDownload(report.id, 'xlsx')}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  Excel
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-1.5 h-9" 
                  onClick={() => handleDownload(report.id, 'pdf')}
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
