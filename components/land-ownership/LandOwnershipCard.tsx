'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { FileText, Upload, Clock, CheckCircle, XCircle, AlertTriangle, Trash2, Download, Eye } from 'lucide-react';
import type {
  ProjectLandDocument,
  LandDocumentVerificationStatus,
  LandDocumentType,
  OwnershipType,
} from '@/lib/types';
import {
  LAND_DOCUMENT_TYPE_LABELS,
  LAND_DOC_STATUS_LABELS,
  LAND_DOC_STATUS_COLORS,
  OWNERSHIP_TYPE_LABELS,
} from '@/lib/types';
import { cn } from '@/lib/utils';

interface LandOwnershipCardProps {
  document: ProjectLandDocument;
  onVerify?: (id: string) => void;
  onReject?: (id: string) => void;
  onRequestAdditional?: (id: string) => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  showActions?: boolean;
}

function StatusIcon({ status }: { status: LandDocumentVerificationStatus }) {
  switch (status) {
    case 'verified':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'additional_required':
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

export function LandOwnershipCard({
  document,
  onVerify,
  onReject,
  onRequestAdditional,
  onDelete,
  onView,
  showActions = false,
}: LandOwnershipCardProps) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{document.file_name || 'Untitled Document'}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {LAND_DOCUMENT_TYPE_LABELS[document.document_type]}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {OWNERSHIP_TYPE_LABELS[document.ownership_type as OwnershipType]}
                </Badge>
                {document.document_number && (
                  <span className="text-xs text-muted-foreground">
                    #{document.document_number}
                  </span>
                )}
              </div>
              {document.issuing_authority && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Issued by: {document.issuing_authority}
                </p>
              )}
              {document.issue_date && (
                <p className="text-xs text-muted-foreground">
                  Issued: {new Date(document.issue_date).toLocaleDateString()}
                  {document.expiry_date && ` • Expires: ${new Date(document.expiry_date).toLocaleDateString()}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', LAND_DOC_STATUS_COLORS[document.verification_status])}>
              <StatusIcon status={document.verification_status} />
              <span className="ml-1">{LAND_DOC_STATUS_LABELS[document.verification_status]}</span>
            </Badge>
          </div>
        </div>

        {document.rejection_reason && (
          <div className="mt-3 rounded-lg bg-destructive/5 p-2">
            <p className="text-xs text-destructive">{document.rejection_reason}</p>
          </div>
        )}

        {document.additional_documents_requested && (
          <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 p-2">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Additional required: {document.additional_documents_requested}
            </p>
          </div>
        )}

        {showActions && (
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            {onView && (
              <Button variant="ghost" size="sm" onClick={() => onView(document.id)}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            )}
            {document.document_url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={document.document_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </a>
              </Button>
            )}
            {document.verification_status === 'submitted' && onVerify && (
              <Button
                variant="ghost"
                size="sm"
                className="text-success hover:text-success"
                onClick={() => onVerify(document.id)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Verify
              </Button>
            )}
            {document.verification_status === 'submitted' && onReject && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onReject(document.id)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            )}
            {document.verification_status === 'submitted' && onRequestAdditional && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRequestAdditional(document.id)}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Request More
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-destructive hover:text-destructive"
                onClick={() => onDelete(document.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LandOwnershipStatusBadge({
  isVerified,
  totalDocuments,
  verifiedDocuments,
  pendingDocuments,
}: {
  isVerified: boolean;
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
}) {
  if (isVerified) {
    return (
      <Badge className="bg-success/10 text-success">
        <CheckCircle className="h-3 w-3 mr-1" />
        Land Ownership Verified
      </Badge>
    );
  }

  if (pendingDocuments > 0) {
    return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        <Clock className="h-3 w-3 mr-1" />
        {pendingDocuments} Document{pendingDocuments > 1 ? 's' : ''} Pending
      </Badge>
    );
  }

  return (
    <Badge variant="outline">
      <FileText className="h-3 w-3 mr-1" />
      {totalDocuments} Document{totalDocuments > 1 ? 's' : ''} Uploaded
    </Badge>
  );
}

export function LandOwnershipDocumentsTable({
  documents,
  onVerify,
  onReject,
  onRequestAdditional,
}: {
  documents: ProjectLandDocument[];
  onVerify?: (id: string) => void;
  onReject?: (id: string) => void;
  onRequestAdditional?: (id: string) => void;
}) {
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold">No Land Documents</h3>
          <p className="text-sm text-muted-foreground mt-1">
            No land ownership documents have been uploaded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
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
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {doc.file_name || 'Untitled'}
                  </span>
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
                  {doc.verification_status === 'submitted' && onVerify && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-success hover:text-success"
                      onClick={() => onVerify(doc.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {doc.verification_status === 'submitted' && onReject && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onReject(doc.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {doc.verification_status === 'submitted' && onRequestAdditional && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRequestAdditional(doc.id)}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
