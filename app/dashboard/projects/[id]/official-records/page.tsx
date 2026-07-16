'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { getOfficialRecordsForProject } from '@/lib/voc-services';
import { OFFICIAL_RECORD_TYPE_LABELS, type OfficialRecord } from '@/lib/voc-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Shield, FileText, Building2, FolderOpen, History, Download, Eye, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const RECORD_ICONS: Record<string, React.ReactNode> = {
  carbon_passport: <Award className="h-4 w-4" />,
  verification_certificate: <Shield className="h-4 w-4" />,
  audit_report: <FileText className="h-4 w-4" />,
  ngo_approval: <Building2 className="h-4 w-4" />,
  supporting_document: <FolderOpen className="h-4 w-4" />,
  verification_history: <History className="h-4 w-4" />,
};

const RECORD_COLORS: Record<string, string> = {
  carbon_passport: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  verification_certificate: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  audit_report: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  ngo_approval: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  supporting_document: 'bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400',
  verification_history: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
};

const STATUS_STYLES: Record<OfficialRecord['status'], string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  archived: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export default function OfficialRecordsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project, loading: projectLoading } = useProject(projectId);

  const [records, setRecords] = React.useState<OfficialRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    const result = getOfficialRecordsForProject(projectId);
    setRecords(result);
    setLoading(false);
  }, [projectId]);

  if (projectLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-xl font-semibold">Official Records</h1>
          <p className="mt-1 text-sm text-muted-foreground">Permanent archive of verification artifacts.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Official Records</h1>
        <p className="mt-1 text-sm text-muted-foreground">Permanent archive of verification artifacts.</p>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-16 text-center">
          <Lock className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No official records yet.</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Records will appear here once verification is complete.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
            <Card key={record.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', RECORD_COLORS[record.record_type])}>
                      {RECORD_ICONS[record.record_type]}
                    </div>
                    <CardTitle className="text-sm font-semibold leading-tight">{record.title}</CardTitle>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {OFFICIAL_RECORD_TYPE_LABELS[record.record_type]}
                  </Badge>
                  <Badge variant="secondary" className={cn('text-xs', STATUS_STYLES[record.status])}>
                    {record.status === 'active' ? 'Active' : 'Archived'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2">{record.description}</p>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 shrink-0" />
                    <span>{record.verifier_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3 shrink-0" />
                    <span>{record.ngo_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <History className="h-3 w-3 shrink-0" />
                    <span>{new Date(record.created_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
