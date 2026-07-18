'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Building2, ShieldCheck, User, CalendarDays, Clock, CheckCircle2,
  AlertCircle, RefreshCw, Eye, ArrowRight, Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  VerificationRequest,
  AgencyRequestStatus,
  AgencyVerificationStatus,
  CarbonPassportStatus,
} from '@/lib/voc-types';
import {
  AGENCY_REQUEST_STATUS_LABELS,
  AGENCY_REQUEST_STATUS_COLORS,
  AGENCY_REQUEST_STATUS_DOT_COLORS,
  AGENCY_VERIFICATION_STATUS_LABELS,
  AGENCY_VERIFICATION_STATUS_COLORS,
  AGENCY_VERIFICATION_STATUS_DOT_COLORS,
  CARBON_PASSPORT_STATUS_LABELS,
  CARBON_PASSPORT_STATUS_COLORS,
  CARBON_PASSPORT_STATUS_DOT_COLORS,
} from '@/lib/voc-types';

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

interface RequestTrackerProps {
  request: VerificationRequest;
  projectId: string;
  onViewAgency?: (agencyId: string) => void;
  onApplyPassport?: (agencyId: string, agencyName: string) => void;
  passportApps?: Record<string, CarbonPassportStatus>;
  passportAppIds?: Record<string, string>;
  onViewPassport?: (applicationId: string) => void;
}

export function RequestTracker({ request, projectId, onViewAgency, onApplyPassport, passportApps = {}, passportAppIds = {}, onViewPassport }: RequestTrackerProps) {
  const acceptedCount = request.selectedAgencies.filter(a => a.requestStatus === 'accepted').length;
  const declinedCount = request.selectedAgencies.filter(a => a.requestStatus === 'declined').length;
  const pendingCount = request.selectedAgencies.filter(a => a.requestStatus === 'sent').length;
  const approvedCount = request.selectedAgencies.filter(a => a.verificationStatus === 'approved').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-display font-semibold">Verification Request Tracker</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Application {request.requestNumber} &middot; {request.projectName}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" /> {formatRelativeTime(request.createdAt)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display text-foreground">{request.selectedAgencies.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Total Invited</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display text-emerald-600">{acceptedCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Accepted</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display text-blue-600">{pendingCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Pending</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold font-display text-red-600">{declinedCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Declined</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Agency Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Agency</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Request Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Verification Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Assigned Verifier</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Audit Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Last Updated</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {request.selectedAgencies.map(agency => (
                    <AgencyRow
                      key={agency.agencyId}
                      agency={agency}
                      onView={onViewAgency}
                      passportStatus={passportApps[agency.agencyId] || 'none'}
                      passportAppId={passportAppIds[agency.agencyId]}
                      onApplyPassport={onApplyPassport}
                      onViewPassport={onViewPassport}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {approvedCount > 0 && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Project Approved</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                {approvedCount} agency{approvedCount > 1 ? 's have' : ' has'} approved this project for certification.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgencyRow({
  agency,
  onView,
  passportStatus,
  passportAppId,
  onApplyPassport,
  onViewPassport,
}: {
  agency: {
    agencyId: string;
    agencyName: string;
    requestStatus: AgencyRequestStatus;
    verificationStatus: AgencyVerificationStatus;
    assignedVerifier: string | null;
    auditDate: string | null;
    lastUpdated: string;
  };
  onView?: (agencyId: string) => void;
  passportStatus: CarbonPassportStatus;
  passportAppId?: string;
  onApplyPassport?: (agencyId: string, agencyName: string) => void;
  onViewPassport?: (applicationId: string) => void;
}) {
  const reqColor = AGENCY_REQUEST_STATUS_COLORS[agency.requestStatus];
  const reqDot = AGENCY_REQUEST_STATUS_DOT_COLORS[agency.requestStatus];
  const reqLabel = AGENCY_REQUEST_STATUS_LABELS[agency.requestStatus];

  const verColor = AGENCY_VERIFICATION_STATUS_COLORS[agency.verificationStatus];
  const verDot = AGENCY_VERIFICATION_STATUS_DOT_COLORS[agency.verificationStatus];
  const verLabel = AGENCY_VERIFICATION_STATUS_LABELS[agency.verificationStatus];

  return (
    <tr className="hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{agency.agencyName}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', reqColor)}>
          <div className={cn('h-1.5 w-1.5 rounded-full', reqDot)} />
          {reqLabel}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', verColor)}>
          <div className={cn('h-1.5 w-1.5 rounded-full', verDot)} />
          {verLabel}
        </div>
      </td>
      <td className="px-4 py-3">
        {agency.assignedVerifier ? (
          <div className="flex items-center gap-1.5 text-sm">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{agency.assignedVerifier}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">&mdash;</span>
        )}
      </td>
      <td className="px-4 py-3">
        {agency.auditDate ? (
          <div className="flex items-center gap-1.5 text-sm">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatDate(agency.auditDate)}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">&mdash;</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-muted-foreground">{formatRelativeTime(agency.lastUpdated)}</span>
      </td>
      <td className="px-4 py-3 text-right">
        {agency.verificationStatus === 'approved' && passportStatus === 'none' && onApplyPassport ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            onClick={() => onApplyPassport(agency.agencyId, agency.agencyName)}
          >
            <Award className="h-3 w-3" /> Apply for Carbon Passport
          </Button>
        ) : passportStatus !== 'none' ? (
          <div className="flex items-center justify-end gap-2">
            <div className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full', CARBON_PASSPORT_STATUS_COLORS[passportStatus])}>
              <div className={cn('h-1.5 w-1.5 rounded-full', CARBON_PASSPORT_STATUS_DOT_COLORS[passportStatus])} />
              {CARBON_PASSPORT_STATUS_LABELS[passportStatus]}
            </div>
            {passportStatus === 'issued' && passportAppId && onViewPassport && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => onViewPassport(passportAppId)}>
                <Eye className="h-3 w-3" /> View
              </Button>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">&mdash;</span>
        )}
      </td>
    </tr>
  );
}
