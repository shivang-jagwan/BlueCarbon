'use client';

import * as React from 'react';
import { useAllIdentityVerificationsAdmin, useIdentityStats, useUpdateIdentityStatus } from '@/hooks/use-identity';
import { IdentityAdminPanel } from '@/components/identity/IdentityAdminPanel';
import { IdentityStatusCard } from '@/components/identity/IdentityStatusCard';
import { IdentityDocumentCard } from '@/components/identity/IdentityDocumentCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Shield, Users, Clock, AlertTriangle, Search, Filter, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import type { IdentityVerificationStatus, AppRole } from '@/lib/types';

const PAGE_SIZE = 20;

export default function IdentityVerificationAdminPage() {
  const { user } = useAuth();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<IdentityVerificationStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = React.useState<AppRole | 'all'>('all');
  const [page, setPage] = React.useState(1);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogDocuments, setDialogDocuments] = React.useState<any[]>([]);
  const [loadingDialogDocs, setLoadingDialogDocs] = React.useState(false);

  const filters = React.useMemo(() => ({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    search: search || undefined,
    page,
  }), [statusFilter, roleFilter, search, page]);

  const { verifications, total, loading, refetch } = useAllIdentityVerificationsAdmin(filters);
  const { stats, loading: statsLoading } = useIdentityStats();
  const { update, loading: updating } = useUpdateIdentityStatus();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleApprove = React.useCallback(async (userId: string) => {
    const result = await update(userId, { status: 'fully_verified', reviewed_by: user?.id });
    if (result) {
      toast.success('Identity approved');
      refetch();
    } else {
      toast.error('Failed to approve identity');
    }
  }, [update, user?.id, refetch]);

  const handleReject = React.useCallback(async (userId: string, notes?: string) => {
    const result = await update(userId, { status: 'rejected', admin_notes: notes, reviewed_by: user?.id });
    if (result) {
      toast.success('Identity rejected');
      refetch();
    } else {
      toast.error('Failed to reject identity');
    }
  }, [update, user?.id, refetch]);

  const handleRequestDocuments = React.useCallback(async (userId: string) => {
    const result = await update(userId, { status: 'identity_submitted', admin_notes: 'Additional documents requested', reviewed_by: user?.id });
    if (result) {
      toast.success('Document request sent');
      refetch();
    } else {
      toast.error('Failed to request documents');
    }
  }, [update, user?.id, refetch]);

  const handleSuspend = React.useCallback(async (userId: string) => {
    const result = await update(userId, { status: 'suspended', reviewed_by: user?.id });
    if (result) {
      toast.success('Account suspended');
      refetch();
    } else {
      toast.error('Failed to suspend account');
    }
  }, [update, user?.id, refetch]);

  const handleRowClick = React.useCallback(async (userId: string) => {
    setSelectedUserId(userId);
    setDialogOpen(true);
    setLoadingDialogDocs(true);
    try {
      const res = await fetch(`/api/identity/documents?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setDialogDocuments(data.documents || []);
      }
    } catch {
      console.error('Failed to load user documents');
    } finally {
      setLoadingDialogDocs(false);
    }
  }, []);

  const selectedVerification = verifications.find(v => v.user_id === selectedUserId) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Identity Verification
          </h1>
          <p className="text-sm text-muted-foreground">Review identity documents and manage account verification</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <Loader2 className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{statsLoading ? '—' : stats?.total_users ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm text-muted-foreground">Pending Verification</p>
              <p className="text-2xl font-bold">{statsLoading ? '—' : stats?.pending_users ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Fully Verified</p>
              <p className="text-2xl font-bold">{statsLoading ? '—' : stats?.verified_users ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Suspicious Accounts</p>
              <p className="text-2xl font-bold">
                {statsLoading
                  ? '—'
                  : verifications.filter(v => v.suspicious_activity_detected).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by user ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as IdentityVerificationStatus | 'all'); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="email_verified">Email Verified</SelectItem>
            <SelectItem value="phone_verified">Phone Verified</SelectItem>
            <SelectItem value="identity_submitted">Identity Submitted</SelectItem>
            <SelectItem value="identity_verified">Identity Verified</SelectItem>
            <SelectItem value="organization_submitted">Org Submitted</SelectItem>
            <SelectItem value="organization_verified">Org Verified</SelectItem>
            <SelectItem value="fully_verified">Fully Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as AppRole | 'all'); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="project_owner">Project Owners</SelectItem>
            <SelectItem value="verifier">Verifiers</SelectItem>
            <SelectItem value="sustainability_partner">Partners</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <Card className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </Card>
      ) : (
        <div onClick={(e) => {
          const row = (e.target as HTMLElement).closest('tr');
          if (row) {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
              const idCell = cells[0]?.querySelector('span');
              if (idCell) {
                const id = idCell.textContent?.replace('...', '').trim();
                if (id) {
                  const match = verifications.find(v => v.user_id.startsWith(id));
                  if (match) handleRowClick(match.user_id);
                }
              }
            }
          }
        }}>
          <IdentityAdminPanel
            verifications={verifications}
            onApprove={handleApprove}
            onReject={handleReject}
            onRequestDocuments={handleRequestDocuments}
            onSuspend={handleSuspend}
          />
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Identity Verification Details</DialogTitle>
            <DialogDescription>
              Review verification status and submitted documents for this user.
            </DialogDescription>
          </DialogHeader>
          {selectedVerification && (
            <div className="space-y-4">
              <IdentityStatusCard verification={selectedVerification} />

              <div>
                <h3 className="text-sm font-semibold mb-3">Submitted Documents</h3>
                {loadingDialogDocs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : dialogDocuments.length === 0 ? (
                  <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <p className="text-sm text-muted-foreground">No documents submitted</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {dialogDocuments.map((doc) => (
                      <IdentityDocumentCard key={doc.id} document={doc} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
