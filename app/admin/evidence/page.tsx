'use client';

import * as React from 'react';
import { useAllEvidenceAdmin } from '@/hooks/use-evidence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Download,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Eye,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FraudScoreBadge } from '@/components/evidence/FraudScoreBadge';
import { EVIDENCE_TYPE_LABELS, EVIDENCE_STATUS_LABELS, EVIDENCE_STATUS_COLORS } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { EvidenceType, EvidenceValidationStatus } from '@/lib/types';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminEvidencePage() {
  const { evidence, loading } = useAllEvidenceAdmin();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<EvidenceValidationStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = React.useState<EvidenceType | 'all'>('all');

  const filtered = evidence.filter((item: any) => {
    const matchesSearch = search === '' ||
      item.original_filename?.toLowerCase().includes(search.toLowerCase()) ||
      item.projects?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.file_hash?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.validation_status === statusFilter;
    const matchesType = typeFilter === 'all' || item.evidence_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDownload = async (storagePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('evidence-verified')
        .createSignedUrl(storagePath, 60);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        toast.error('Could not generate download link');
      }
    } catch {
      toast.error('Download failed');
    }
  };

  const totalFraudScore = evidence.length > 0
    ? Math.round(evidence.reduce((sum: number, e: any) => sum + e.fraud_score, 0) / evidence.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Evidence Administration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review all uploaded verification evidence across projects
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Evidence</p>
          <p className="text-2xl font-bold">{evidence.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Valid</p>
              <p className="text-2xl font-bold">{evidence.filter((e: any) => e.validation_status === 'valid').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm text-muted-foreground">Warnings</p>
              <p className="text-2xl font-bold">{evidence.filter((e: any) => e.validation_status === 'warning').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Fraud Score</p>
              <p className="text-2xl font-bold">{totalFraudScore}/100</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by filename, project, or hash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[300px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">All Status</option>
              <option value="valid">Valid</option>
              <option value="warning">Warning</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">All Types</option>
              <option value="photo">Photo</option>
              <option value="video">Video</option>
              <option value="drone_image">Drone Image</option>
              <option value="drone_video">Drone Video</option>
            </select>
          </div>
          <span className="text-sm text-muted-foreground">
            {filtered.length} results
          </span>
        </div>
      </Card>

      {/* Evidence Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Eye className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No evidence found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fraud</TableHead>
                    <TableHead>GPS</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.photo_url || item.drone_image_url ? (
                            <img
                              src={item.photo_url || item.drone_image_url}
                              alt=""
                              className="h-8 w-8 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-muted-foreground">
                              <Eye className="h-4 w-4" />
                            </div>
                          )}
                          <span className="max-w-[150px] truncate text-sm">
                            {item.original_filename || '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm">
                        {item.projects?.name || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {EVIDENCE_TYPE_LABELS[item.evidence_type as EvidenceType] || item.evidence_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn('text-xs', EVIDENCE_STATUS_COLORS[item.validation_status as EvidenceValidationStatus])}
                        >
                          {EVIDENCE_STATUS_LABELS[item.validation_status as EvidenceValidationStatus] || item.validation_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <FraudScoreBadge score={item.fraud_score} showIcon={false} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.latitude != null && item.longitude != null ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-destructive">No GPS</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.uploaded_by?.slice(0, 8) || '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDownload(item.storage_path)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
