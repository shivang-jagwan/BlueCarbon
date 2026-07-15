'use client';

import { Card } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal, CheckCircle, XCircle, FileText, Ban,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IdentityVerification } from '@/lib/types';
import { IDENTITY_STATUS_LABELS, IDENTITY_STATUS_COLORS, ROLE_LABELS } from '@/lib/types';

interface IdentityAdminPanelProps {
  verifications: IdentityVerification[];
  onApprove: (userId: string) => void;
  onReject: (userId: string, notes?: string) => void;
  onRequestDocuments: (userId: string) => void;
  onSuspend: (userId: string) => void;
}

export function IdentityAdminPanel({
  verifications,
  onApprove,
  onReject,
  onRequestDocuments,
  onSuspend,
}: IdentityAdminPanelProps) {
  if (verifications.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <FileText className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No identity verifications found</p>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Email</TableHead>
            <TableHead className="text-center">Phone</TableHead>
            <TableHead className="text-center">Suspicious</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {verifications.map((v) => (
            <TableRow key={v.id}>
              <TableCell>
                <span className="text-sm font-mono">{v.user_id.slice(0, 8)}...</span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {ROLE_LABELS[v.role] || v.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={cn('text-xs', IDENTITY_STATUS_COLORS[v.status])}>
                  {IDENTITY_STATUS_LABELS[v.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {v.email_verified ? (
                  <CheckCircle className="h-4 w-4 text-success inline" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground/40 inline" />
                )}
              </TableCell>
              <TableCell className="text-center">
                {v.phone_verified ? (
                  <CheckCircle className="h-4 w-4 text-success inline" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground/40 inline" />
                )}
              </TableCell>
              <TableCell className="text-center">
                {v.suspicious_activity_detected ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600 inline" />
                ) : (
                  <span className="text-muted-foreground/40">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onApprove(v.user_id)}>
                      <CheckCircle className="h-4 w-4 mr-2 text-success" /> Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onReject(v.user_id)}>
                      <XCircle className="h-4 w-4 mr-2 text-destructive" /> Reject
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRequestDocuments(v.user_id)}>
                      <FileText className="h-4 w-4 mr-2" /> Request Documents
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onSuspend(v.user_id)}>
                      <Ban className="h-4 w-4 mr-2 text-destructive" /> Suspend Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
