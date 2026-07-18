'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, MapPin, Clock, CheckCircle2, XCircle, Upload, Eye, ExternalLink, FileVideo, File, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SnapshotEvidence } from '@/lib/voc-types';
import type { EvidenceVerificationStatus } from '@/lib/voc-services';

type EvidStatus = EvidenceVerificationStatus;

interface Props {
  evidenceItems: SnapshotEvidence[];
  evidVerifications: Record<string, { status: EvidStatus; remarks: string }>;
  onVerifyEvidence: (itemId: string, status: EvidStatus) => void;
  onUpdateRemark: (itemId: string) => void;
  setEvidVerifications: React.Dispatch<React.SetStateAction<Record<string, { status: EvidStatus; remarks: string }>>>;
  setEditingEvidRemark: React.Dispatch<React.SetStateAction<string | null>>;
  editingEvidRemark: string | null;
  isImmutable: boolean;
}

const STATUS_OPTIONS: { value: EvidStatus; label: string; color: string; icon: React.ElementType }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  { value: 'needs_new_upload', label: 'Needs New Upload', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Upload },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
];

function isImageType(ft: string) { return ft.startsWith('image/'); }
function isVideoType(ft: string) { return ft.startsWith('video/'); }

export function EvidenceTab({
  evidenceItems, evidVerifications, onVerifyEvidence, onUpdateRemark,
  setEvidVerifications, setEditingEvidRemark, editingEvidRemark, isImmutable,
}: Props) {
  const approvedCount = evidenceItems.filter(e => evidVerifications[e.id]?.status === 'approved').length;
  const rejectedCount = evidenceItems.filter(e => evidVerifications[e.id]?.status === 'rejected').length;

  const [viewItem, setViewItem] = React.useState<SnapshotEvidence | null>(null);
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [blobLoading, setBlobLoading] = React.useState(false);
  const [thumbBlobUrls, setThumbBlobUrls] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    const map: Record<string, string> = {};

    async function loadThumbs() {
      for (const item of evidenceItems) {
        if (!item.url) continue;
        try {
          const res = await fetch(item.url);
          if (!res.ok) continue;
          const blob = await res.blob();
          if (cancelled) return;
          const type = item.file_type || blob.type || 'image/jpeg';
          const blobU = URL.createObjectURL(new Blob([blob], { type }));
          urls.push(blobU);
          map[item.id] = blobU;
        } catch { /* skip */ }
      }
      if (!cancelled) setThumbBlobUrls(map);
    }
    loadThumbs();
    return () => {
      cancelled = true;
      urls.forEach(u => URL.revokeObjectURL(u));
    };
  }, [evidenceItems]);

  React.useEffect(() => {
    if (!viewItem?.url) { setBlobUrl(null); return; }
    let cancelled = false;
    setBlobLoading(true);
    setBlobUrl(null);
    fetch(viewItem.url)
      .then(res => { if (!res.ok) throw new Error('fetch failed'); return res.blob(); })
      .then(blob => {
        if (cancelled) return;
        const type = viewItem.file_type || blob.type || 'image/jpeg';
        setBlobUrl(URL.createObjectURL(new Blob([blob], { type })));
      })
      .catch(() => { if (!cancelled) setBlobUrl(null); })
      .finally(() => { if (!cancelled) setBlobLoading(false); });
    return () => { cancelled = true; };
  }, [viewItem?.url, viewItem?.file_type]);

  if (evidenceItems.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Camera className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No evidence items found in the application snapshot.</p>
      </div>
    );
  }

  function renderEvidenceCard(item: SnapshotEvidence) {
    const verification = evidVerifications[item.id];
    const status = verification?.status || 'pending';
    const remarks = verification?.remarks || '';
    const statusOption = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
    const StatusIcon = statusOption.icon;
    const isEditing = editingEvidRemark === item.id;
    const ft = item.file_type || '';
    const isImage = isImageType(ft);
    const isVideo = isVideoType(ft);
    const hasUrl = !!item.url;
    const thumbUrl = thumbBlobUrls[item.id];

    return (
      <div key={item.id} className="p-4 rounded-lg border border-border/60 hover:bg-muted/30 transition-colors">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            {hasUrl && thumbUrl && isImage ? (
              <button
                onClick={() => setViewItem(item)}
                className="block w-20 h-20 rounded-lg overflow-hidden bg-muted/50 hover:ring-2 hover:ring-primary/50 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbUrl} alt={item.title} className="w-full h-full object-cover" />
              </button>
            ) : hasUrl && isVideo ? (
              <button
                onClick={() => setViewItem(item)}
                className="flex w-20 h-20 rounded-lg bg-purple-100 items-center justify-center hover:ring-2 hover:ring-primary/50 transition-all"
              >
                <FileVideo className="h-6 w-6 text-purple-500" />
              </button>
            ) : (
              <div className={cn(
                'flex w-20 h-20 rounded-lg items-center justify-center',
                isImage ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground',
              )}>
                <Camera className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">{item.title}</p>
              <Badge variant="outline" className="text-[10px] capitalize">{item.type}</Badge>
              {item.file_name && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{item.file_name}</span>
              )}
            </div>
            {item.description && item.description !== item.title && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
              {item.location && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {item.location}</span>}
              {item.date_collected && <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {new Date(item.date_collected).toLocaleDateString()}</span>}
            </div>

            {hasUrl && (
              <div className="flex items-center gap-2 mt-2">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setViewItem(item)}>
                  <Eye className="h-3 w-3" /> View
                </Button>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    <ExternalLink className="h-2.5 w-2.5" /> Open
                  </a>
                )}
              </div>
            )}

            {/* Verification Status Buttons */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {STATUS_OPTIONS.map(opt => {
                const SIcon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onVerifyEvidence(item.id, opt.value)}
                    disabled={isImmutable}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                      status === opt.value ? opt.color : 'border-transparent text-muted-foreground hover:bg-muted/50',
                      isImmutable && 'opacity-60 cursor-not-allowed',
                    )}
                  >
                    <SIcon className="h-3 w-3" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Remarks */}
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={remarks}
                  onChange={(e) => setEvidVerifications(prev => ({
                    ...prev,
                    [item.id]: { status, remarks: e.target.value },
                  }))}
                  placeholder="Add verification remarks..."
                  rows={2}
                  className="resize-none text-xs"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onUpdateRemark(item.id)} className="h-7 text-xs">
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingEvidRemark(null)} className="h-7 text-xs">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : remarks ? (
              <button
                onClick={() => setEditingEvidRemark(item.id)}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground text-left"
              >
                {remarks}
              </button>
            ) : !isImmutable ? (
              <button
                onClick={() => setEditingEvidRemark(item.id)}
                className="mt-2 text-xs text-primary hover:underline"
              >
                + Add remark
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-lg font-bold">{evidenceItems.length}</p>
          <p className="text-[10px] text-muted-foreground">Total Evidence</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-3 text-center">
          <p className="text-lg font-bold text-emerald-600">{approvedCount}</p>
          <p className="text-[10px] text-emerald-600">Approved</p>
        </div>
        <div className="rounded-lg bg-red-50 p-3 text-center">
          <p className="text-lg font-bold text-red-600">{rejectedCount}</p>
          <p className="text-[10px] text-red-600">Rejected</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-lg font-bold">{evidenceItems.length - approvedCount - rejectedCount}</p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </div>
      </div>

      {/* Evidence Cards */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Camera className="h-4 w-4 text-muted-foreground" /> Evidence Items
          </CardTitle>
          <p className="text-xs text-muted-foreground">Review each evidence item from the Project Owner&apos;s submission.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {evidenceItems.map(renderEvidenceCard)}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={open => {
        if (!open) {
          setViewItem(null);
          if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); }
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogTitle>{viewItem?.title || 'Evidence Preview'}</DialogTitle>
          <DialogDescription className="sr-only">Evidence file preview</DialogDescription>
          {viewItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <Badge variant="outline" className="text-[10px] capitalize">{viewItem.type}</Badge>
                {viewItem.file_type && <span>{viewItem.file_type}</span>}
                {viewItem.file_name && <span>{viewItem.file_name}</span>}
              </div>
              {blobLoading ? (
                <div className="rounded-lg border bg-muted/30 p-8 text-center min-h-[300px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : viewItem.url && blobUrl ? (
                isImageType(viewItem.file_type || '') ? (
                  <div className="rounded-lg border overflow-hidden bg-black/5 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={blobUrl} alt={viewItem.title} className="max-w-full max-h-[500px] object-contain" />
                  </div>
                ) : isVideoType(viewItem.file_type || '') ? (
                  <div className="rounded-lg border overflow-hidden">
                    <video src={blobUrl} controls className="w-full max-h-[500px]" />
                  </div>
                ) : (
                  <div className="rounded-lg border bg-muted/30 p-8 text-center">
                    <File className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
                    <a href={viewItem.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
                      Open in new tab <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )
              ) : (
                <div className="rounded-lg border bg-muted/30 p-8 text-center">
                  <File className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Could not load evidence file.</p>
                  {viewItem.url && (
                    <a href={viewItem.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
                      Open in new tab <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {viewItem.location && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {viewItem.location}</span>}
                {viewItem.date_collected && <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {new Date(viewItem.date_collected).toLocaleDateString()}</span>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
