'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Award, Shield, FileText, Building2, FolderOpen, History,
  Download, Eye, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOfficialRecords } from '@/lib/voc-services';
import {
  OFFICIAL_RECORD_TYPE_LABELS,
  type OfficialRecord,
} from '@/lib/voc-types';

const RECORD_TYPE_ICONS: Record<OfficialRecord['record_type'], React.ReactNode> = {
  carbon_passport: <Award className="h-4 w-4" />,
  verification_certificate: <Shield className="h-4 w-4" />,
  audit_report: <FileText className="h-4 w-4" />,
  ngo_approval: <Building2 className="h-4 w-4" />,
  supporting_document: <FolderOpen className="h-4 w-4" />,
  verification_history: <History className="h-4 w-4" />,
};

const RECORD_TYPE_COLORS: Record<OfficialRecord['record_type'], string> = {
  carbon_passport: 'bg-emerald-100 text-emerald-700',
  verification_certificate: 'bg-blue-100 text-blue-700',
  audit_report: 'bg-purple-100 text-purple-700',
  ngo_approval: 'bg-amber-100 text-amber-700',
  supporting_document: 'bg-slate-100 text-slate-700',
  verification_history: 'bg-cyan-100 text-cyan-700',
};

const STATUS_COLORS: Record<OfficialRecord['status'], string> = {
  active: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-600',
};

export default function OfficialRecordsPage() {
  const [records, setRecords] = React.useState<OfficialRecord[]>([]);
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getOfficialRecords();
      if (!cancelled) setRecords(data);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = React.useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        search === '' ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.application_id.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || r.record_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [records, search, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <FolderOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Official Records</h1>
          <p className="text-sm text-muted-foreground">
            Permanent archive of verification artifacts. Records are immutable and cannot be edited.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Record Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(OFFICIAL_RECORD_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} record{filtered.length !== 1 ? 's' : ''}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((record) => (
          <Card key={record.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  RECORD_TYPE_COLORS[record.record_type],
                )}>
                  {RECORD_TYPE_ICONS[record.record_type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn('text-[10px]', RECORD_TYPE_COLORS[record.record_type])}>
                      {OFFICIAL_RECORD_TYPE_LABELS[record.record_type]}
                    </Badge>
                    <Badge className={cn('text-[10px]', STATUS_COLORS[record.status])}>
                      {record.status === 'active' ? 'Active' : 'Archived'}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold mt-1.5 truncate">{record.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{record.description}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Application: </span>
                      <span className="font-mono text-[11px]">{record.application_id}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Verifier: </span>
                      <span>{record.verifier_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">NGO: </span>
                      <span>{record.ngo_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created: </span>
                      <span>{new Date(record.created_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-3.5 w-3.5 mr-1" /> Download
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <FolderOpen className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No official records found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
