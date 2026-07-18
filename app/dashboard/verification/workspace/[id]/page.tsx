'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, Lock, FileText, FileCheck, Camera, ClipboardCheck, Gavel, Activity, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  getApplication,
  assignVerifierToAgency,
  scheduleAgencyAudit,
  getAuditReportForRequest,
  getActivityForProject,
  getDocumentVerifications,
  getEvidenceVerifications,
  updateDocumentVerification,
  updateEvidenceVerification,
  submitDecisionWithMetadata,
  sendNotification,
  type DocumentVerificationStatus,
  type EvidenceVerificationStatus,
} from '@/lib/voc-services';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  type VerificationApplication,
  type VerificationDecision,
  type AuditReport,
  type ProjectSnapshot,
  type SnapshotDocument,
  type SnapshotDocumentCategory,
  type SnapshotEvidence,
} from '@/lib/voc-types';
import { OverviewTab } from './components/overview-tab';
import { DocumentsTab } from './components/documents-tab';
import { EvidenceTab } from './components/evidence-tab';
import { AuditTab } from './components/audit-tab';
import { DecisionTab } from './components/decision-tab';
import { ActivityTab } from './components/activity-tab';

type TabId = 'overview' | 'documents' | 'evidence' | 'audit' | 'decision' | 'activity';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; locked?: boolean }[] = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'documents', label: 'Documents', icon: FileCheck },
  { id: 'evidence', label: 'Evidence', icon: Camera },
  { id: 'audit', label: 'Field Audit', icon: ClipboardCheck },
  { id: 'decision', label: 'Decision', icon: Gavel, locked: true },
  { id: 'activity', label: 'Activity', icon: Activity },
];

export default function VerificationWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;
  const { profile } = useAuth();

  const [application, setApplication] = React.useState<VerificationApplication | null>(null);
  const [auditReport, setAuditReport] = React.useState<AuditReport | null>(null);
  const [activities, setActivities] = React.useState<{ id: string; event_type: string; title: string; description: string | null; actor_name: string | null; actor_role: string | null; metadata: Record<string, unknown> | null; created_at: string }[]>([]);
  const [activeTab, setActiveTab] = React.useState<TabId>('overview');
  const [loading, setLoading] = React.useState(true);

  const [docVerifications, setDocVerifications] = React.useState<Record<string, { status: DocumentVerificationStatus; remarks: string }>>({});
  const [evidVerifications, setEvidVerifications] = React.useState<Record<string, { status: EvidenceVerificationStatus; remarks: string }>>({});

  const [decision, setDecision] = React.useState<VerificationDecision | ''>('');
  const [reviewerNotes, setReviewerNotes] = React.useState('');
  const [auditDate, setAuditDate] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [showAuditForm, setShowAuditForm] = React.useState(false);
  const [editingEvidRemark, setEditingEvidRemark] = React.useState<string | null>(null);

  const buildFallbackSnapshot = React.useCallback(async (app: VerificationApplication): Promise<ProjectSnapshot | null> => {
    if (!app.project_id) return null;
    const { data: docs } = await supabase.from('project_documents_v2').select('*').eq('project_id', app.project_id);
    const { data: gallery } = await supabase.from('project_gallery_items').select('*').eq('project_id', app.project_id);

    const documents: SnapshotDocument[] = [];
    for (const d of (docs || []) as Record<string, unknown>[]) {
      const storagePath = d.storage_path as string | null;
      const publicUrl = d.public_url as string | null;
      let url = publicUrl ?? undefined;
      if (!url && storagePath) {
        const { data: signed } = await supabase.storage.from('project-documents').createSignedUrl(storagePath, 3600);
        url = signed?.signedUrl ?? undefined;
      }
      documents.push({
        id: (d.id as string) || String(Math.random()),
        name: (d.document_name as string) || (d.name as string) || 'Untitled',
        category: (d.category as SnapshotDocumentCategory) || 'other',
        file_type: (d.mime_type as string) || 'unknown',
        file_size: d.file_size ? `${Math.round((d.file_size as number) / 1024)} KB` : '0 KB',
        uploaded_date: (d.created_at as string) || new Date().toISOString(),
        quality_score: 80,
        gps_available: false,
        metadata_available: false,
        ai_summary: { confidence_score: 75, missing_documents: [], quality_issues: [], duplicate_detected: false, gps_metadata: false, image_metadata: false, overall_assessment: 'Loaded from project' },
        url,
        storage_path: storagePath || undefined,
      });
    }
    const evidenceItems: SnapshotEvidence[] = [];
    for (const g of (gallery || []) as Record<string, unknown>[]) {
      const gStoragePath = g.storage_path as string | null;
      const gPublicUrl = (g.public_url as string | null) || undefined;
      let gUrl = gPublicUrl;
      if (!gUrl && gStoragePath) {
        const { data: gSigned } = await supabase.storage.from('project-gallery').createSignedUrl(gStoragePath, 3600);
        gUrl = gSigned?.signedUrl ?? undefined;
      }
      evidenceItems.push({
        id: (g.id as string) || String(Math.random()),
        title: (g.caption as string) || (g.file_name as string) || 'Evidence',
        description: (g.caption as string) || '',
        type: (g.media_type as string) || 'image',
        location: app.project_name || '',
        date_collected: (g.created_at as string) || new Date().toISOString(),
        url: gUrl,
        storage_path: gStoragePath || undefined,
        file_type: (g.mime_type as string) || '',
        file_name: (g.file_name as string) || '',
      });
    }
    return {
      project_name: app.project_name,
      project_type: '',
      location: '',
      latitude: 0,
      longitude: 0,
      area_hectares: 0,
      description: '',
      methodology: '',
      start_date: '',
      target_end_date: '',
      estimated_carbon_sequestration: 0,
      ngo_name: app.verification_agency_name,
      owner_name: app.project_owner_name,
      owner_email: '',
      owner_organization: '',
      documents,
      ground_images: [],
      drone_images: [],
      supporting_files: [],
      evidence_items: evidenceItems,
      captured_at: new Date().toISOString(),
    };
  }, []);

  const loadData = React.useCallback(async () => {
    const app = await getApplication(appId);
    if (app) {
      if (!app.snapshot) {
        app.snapshot = await buildFallbackSnapshot(app);
      }
      setApplication(app);
      const report = await getAuditReportForRequest(app.id);
      if (report) setAuditReport(report);
      if (app.project_id) {
        const acts = await getActivityForProject(app.project_id);
        setActivities(acts as typeof activities);
      }
      const docVerifs = await getDocumentVerifications(app.id);
      const docMap: Record<string, { status: DocumentVerificationStatus; remarks: string }> = {};
      for (const v of docVerifs) docMap[v.docId] = { status: v.status, remarks: v.remarks };
      setDocVerifications(docMap);
      const evidVerifs = await getEvidenceVerifications(app.id);
      const evidMap: Record<string, { status: EvidenceVerificationStatus; remarks: string }> = {};
      for (const v of evidVerifs) evidMap[v.itemId] = { status: v.status, remarks: v.remarks };
      setEvidVerifications(evidMap);
    }
    setLoading(false);
  }, [appId, buildFallbackSnapshot]);

  React.useEffect(() => { setLoading(true); loadData(); }, [loadData]);

  const reloadApp = async () => {
    const updated = await getApplication(appId);
    if (updated) {
      if (!updated.snapshot) {
        updated.snapshot = await buildFallbackSnapshot(updated);
      }
      setApplication(updated);
      const report = await getAuditReportForRequest(updated.id);
      if (report) setAuditReport(report);
      const docVerifs = await getDocumentVerifications(updated.id);
      const docMap: Record<string, { status: DocumentVerificationStatus; remarks: string }> = {};
      for (const v of docVerifs) docMap[v.docId] = { status: v.status, remarks: v.remarks };
      setDocVerifications(docMap);
      const evidVerifs = await getEvidenceVerifications(updated.id);
      const evidMap: Record<string, { status: EvidenceVerificationStatus; remarks: string }> = {};
      for (const v of evidVerifs) evidMap[v.itemId] = { status: v.status, remarks: v.remarks };
      setEvidVerifications(evidMap);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Application not found.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push('/dashboard/verification')}>
            Back to Verification
          </Button>
        </div>
      </div>
    );
  }

  const snapshot = application.snapshot;
  const isDecided = ['approved', 'returned_for_revision', 'rejected'].includes(application.status);
  const isImmutable = isDecided;

  const allDocs = snapshot?.documents || [];
  const groundImages = snapshot?.ground_images || [];
  const droneImages = snapshot?.drone_images || [];
  const evidenceItems = snapshot?.evidence_items || [];

  const allDocStatuses = allDocs.map(d => docVerifications[d.id]?.status || 'pending');
  const allDocsReviewed = allDocs.length === 0 || allDocStatuses.every(s => s !== 'pending');
  const allEvidStatuses = evidenceItems.map(e => evidVerifications[e.id]?.status || 'pending');
  const allEvidReviewed = evidenceItems.length === 0 || allEvidStatuses.every(s => s !== 'pending');

  const daysSinceSubmission = Math.floor(
    (Date.now() - new Date(application.submitted_date).getTime()) / (1000 * 60 * 60 * 24),
  );

  const handleStartReview = async () => {
    if (!profile) return;
    try {
      await assignVerifierToAgency(application.application_number, application.verification_agency_id, profile.full_name || 'Verifier');
      toast.success('Review started');
      await reloadApp();
    } catch { toast.error('Failed to start review'); }
  };

  const handleScheduleAudit = async () => {
    if (!auditDate) { toast.error('Please select an audit date'); return; }
    try {
      await scheduleAgencyAudit(application.application_number, application.verification_agency_id, auditDate);
      toast.success('Audit scheduled — PO notified');
      setAuditDate('');
      await reloadApp();
    } catch { toast.error('Failed to schedule audit'); }
  };

  const handleDocVerify = async (docId: string, status: DocumentVerificationStatus, remarks: string) => {
    if (!profile) return;
    try {
      await updateDocumentVerification(application.id, docId, status, remarks, profile.full_name || 'Verifier');
      setDocVerifications(prev => ({ ...prev, [docId]: { status, remarks } }));
      if ((status === 'needs_clarification' || status === 'rejected') && application.project_owner_id) {
        await sendNotification({
          title: status === 'needs_clarification' ? 'Document Needs Clarification' : 'Document Rejected',
          body: `Document "${docId}" requires your attention. ${remarks || ''}`.trim(),
          type: 'document_verification',
          targetUserId: application.project_owner_id,
          link: `/dashboard/projects/${application.project_id}/documents`,
        });
      }
      toast.success(`Document marked as ${status.replace(/_/g, ' ')}`);
    } catch { toast.error('Failed to update document status'); }
  };

  const handleEvidVerify = async (itemId: string, status: EvidenceVerificationStatus) => {
    if (!profile) return;
    const currentRemarks = evidVerifications[itemId]?.remarks || '';
    try {
      await updateEvidenceVerification(application.id, itemId, status, currentRemarks, profile.full_name || 'Verifier');
      setEvidVerifications(prev => ({ ...prev, [itemId]: { status, remarks: currentRemarks } }));
      toast.success(`Evidence marked as ${status.replace(/_/g, ' ')}`);
    } catch { toast.error('Failed to update evidence status'); }
  };

  const handleEvidRemark = async (itemId: string) => {
    if (!profile) return;
    const entry = evidVerifications[itemId];
    if (!entry) return;
    try {
      await updateEvidenceVerification(application.id, itemId, entry.status, entry.remarks, profile.full_name || 'Verifier');
      setEditingEvidRemark(null);
      toast.success('Remark saved');
    } catch { toast.error('Failed to save remark'); }
  };

  const handleSubmitDecision = async () => {
    if (!decision || !profile) return;
    setSubmitting(true);
    try {
      const verifiedMetrics = auditReport ? {
        area_hectares: auditReport.area_verified / 10000,
        tree_count: auditReport.tree_count,
        species_count: auditReport.species_count,
        carbon_sequestration: auditReport.tree_count * 0.02,
        biomass_carbon: auditReport.tree_count * 0.015,
        soil_organic_carbon: auditReport.area_verified * 0.001,
        biodiversity_index: Math.min(10, auditReport.species_count / 5),
        ecosystem_health: auditReport.site_condition,
      } : undefined;

      await submitDecisionWithMetadata({
        requestId: application.application_number,
        agencyId: application.verification_agency_id,
        agencyName: application.verification_agency_name,
        decision: decision === 'approve' ? 'approved' : decision === 'return_for_revision' ? 'returned' : 'rejected',
        decisionNotes: reviewerNotes,
        decisionVerifierName: profile.full_name || 'Verifier',
        digitalSignature: `SIG-${Date.now().toString(36).toUpperCase()}`,
        blockchainHash: `0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        projectId: application.project_id,
        projectName: application.project_name,
        snapshot,
        auditReport: auditReport || undefined,
        verifiedMetrics,
      });
      toast.success(`Project ${decision === 'approve' ? 'approved' : decision === 'return_for_revision' ? 'returned' : 'rejected'}`);
      setDecision('');
      setReviewerNotes('');
      await reloadApp();
    } catch { toast.error('Failed to submit decision'); } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/verification')} className="mb-3 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Verification
        </Button>
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono text-muted-foreground">{application.application_number}</span>
              <Badge className={cn('text-[10px]', APPLICATION_STATUS_COLORS[application.status])}>
                {APPLICATION_STATUS_LABELS[application.status]}
              </Badge>
              {isImmutable && (
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">
                  <Lock className="h-3 w-3 mr-1" /> Immutable
                </Badge>
              )}
            </div>
            <h1 className="text-lg font-semibold mt-1">{application.project_name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {application.verification_agency_name} — {application.project_owner_name}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-border/60">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isLocked = tab.locked && !isDecided && !(auditReport && ['audit_completed'].includes(application.status));
          return (
            <button
              key={tab.id}
              onClick={() => !isLocked && setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary border-b-2 border-primary'
                  : isLocked
                    ? 'text-muted-foreground/40 cursor-not-allowed'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {isLocked && <Lock className="h-3 w-3 ml-0.5 opacity-50" />}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          application={application}
          auditReport={auditReport}
          daysSinceSubmission={daysSinceSubmission}
          onStartReview={handleStartReview}
        />
      )}

      {activeTab === 'documents' && (
        <DocumentsTab
          documents={allDocs}
          groundImages={groundImages}
          droneImages={droneImages}
          docVerifications={docVerifications}
          onVerifyDoc={handleDocVerify}
          setDocVerifications={setDocVerifications}
          isImmutable={isImmutable}
          projectOwnerId={application.project_owner_id}
          projectOwnerName={application.project_owner_name}
          projectName={application.project_name}
        />
      )}

      {activeTab === 'evidence' && (
        <EvidenceTab
          evidenceItems={evidenceItems}
          evidVerifications={evidVerifications}
          onVerifyEvidence={handleEvidVerify}
          onUpdateRemark={handleEvidRemark}
          setEvidVerifications={setEvidVerifications}
          setEditingEvidRemark={setEditingEvidRemark}
          editingEvidRemark={editingEvidRemark}
          isImmutable={isImmutable}
        />
      )}

      {activeTab === 'audit' && (
        <AuditTab
          application={application}
          auditReport={auditReport}
          profile={profile}
          auditDate={auditDate}
          setAuditDate={setAuditDate}
          showAuditForm={showAuditForm}
          setShowAuditForm={setShowAuditForm}
          onScheduleAudit={handleScheduleAudit}
          onComplete={() => { setShowAuditForm(false); toast.success('Audit report submitted'); loadData(); }}
        />
      )}

      {activeTab === 'decision' && (
        <DecisionTab
          application={application}
          auditReport={!!auditReport}
          allDocsReviewed={allDocsReviewed}
          allEvidReviewed={allEvidReviewed}
          decision={decision}
          setDecision={setDecision}
          reviewerNotes={reviewerNotes}
          setReviewerNotes={setReviewerNotes}
          submitting={submitting}
          onSubmitDecision={handleSubmitDecision}
          isDecided={isDecided}
        />
      )}

      {activeTab === 'activity' && (
        <ActivityTab activities={activities} />
      )}
    </div>
  );
}
