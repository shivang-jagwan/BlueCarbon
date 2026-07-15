'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectLandDocument, LandDocumentVerificationStatus, OwnershipType } from '@/lib/types';
import { LAND_DOCUMENT_TYPE_LABELS, LAND_DOC_STATUS_LABELS, LAND_DOC_STATUS_COLORS, OWNERSHIP_TYPE_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function AdminLandOwnershipPage() {
  const [documents, setDocuments] = React.useState<ProjectLandDocument[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [ownershipFilter, setOwnershipFilter] = React.useState<string>('all');
  const [search, setSearch] = React.useState('');

  const fetchDocuments = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        admin: 'true',
        page: String(page),
        limit: '20',
      });
      if (statusFilter !== 'all') params.set('verification_status', statusFilter);
      if (ownershipFilter !== 'all') params.set('ownership_type', ownershipFilter);

      const response = await fetch(`/api/land-documents?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
        setTotal(data.total || 0);
      }
    } catch {
      console.error('Failed to fetch land documents');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, ownershipFilter]);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleVerify = async (docId: string) => {
    try {
      const response = await fetch(`/api/land-documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_status: 'verified' }),
      });
      if (!response.ok) throw new Error('Failed to verify');
      toast.success('Document verified');
      await fetchDocuments();
    } catch {
      toast.error('Failed to verify document');
    }
  };

  const handleReject = async (docId: string) => {
    try {
      const response = await fetch(`/api/land-documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_status: 'rejected', rejection_reason: 'Admin override' }),
      });
      if (!response.ok) throw new Error('Failed to reject');
      toast.success('Document rejected');
      await fetchDocuments();
    } catch {
      toast.error('Failed to reject document');
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      doc.file_name?.toLowerCase().includes(q) ||
      doc.document_number?.toLowerCase().includes(q) ||
      doc.issuing_authority?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Land Ownership Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and manage land ownership verification across all projects
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="additional_required">Additional Required</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Ownership" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="government">Government</SelectItem>
            <SelectItem value="community">Community</SelectItem>
            <SelectItem value="leased">Leased</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No documents found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No land ownership documents match your filters
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {doc.file_name || 'Untitled'}
                          </p>
                          {doc.document_number && (
                            <p className="text-xs text-muted-foreground">#{doc.document_number}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {LAND_DOCUMENT_TYPE_LABELS[doc.document_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {OWNERSHIP_TYPE_LABELS[doc.ownership_type as OwnershipType]}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', LAND_DOC_STATUS_COLORS[doc.verification_status])}>
                        {LAND_DOC_STATUS_LABELS[doc.verification_status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {doc.verification_status === 'submitted' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-success hover:text-success"
                              onClick={() => handleVerify(doc.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleReject(doc.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredDocs.length} of {total} documents
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={filteredDocs.length < 20}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
