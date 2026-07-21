'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  MapPin, Camera, Upload, Crosshair, Satellite, Plane, Video,
  Image, X, Loader2, ChevronLeft, ChevronRight, FileText, Clock,
  Smartphone, Trash2, Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { AuditMediaItem, AuditMediaType } from '@/lib/voc-types';
import { AUDIT_MEDIA_TYPE_LABELS, AUDIT_MEDIA_TYPE_COLORS } from '@/lib/voc-types';
import { uploadAuditMedia, getAuditMediaSignedUrls } from '@/lib/voc-services';

interface GeospatialEvidenceSectionProps {
  projectId: string;
  auditId?: string;
  verificationId?: string;
  auditorName: string;
  onMediaUploaded?: (item: AuditMediaItem) => void;
}

interface PendingUpload {
  id: string;
  file: File;
  preview: string;
  mediaType: AuditMediaType;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  deviceName: string;
  description: string;
  fieldNotes: string;
  flightDate: string;
  satelliteDate: string;
}

interface CapturedLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  timestamp: string;
}

export function GeospatialEvidenceSection({
  projectId, auditId, verificationId, auditorName, onMediaUploaded,
}: GeospatialEvidenceSectionProps) {
  const [pendingUploads, setPendingUploads] = React.useState<PendingUpload[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [gpsLoading, setGpsLoading] = React.useState(false);
  const [capturedLocations, setCapturedLocations] = React.useState<CapturedLocation[]>([]);
  const [previewItem, setPreviewItem] = React.useState<PendingUpload | null>(null);
  const [previewIndex, setPreviewIndex] = React.useState(0);
  const [uploadedItems, setUploadedItems] = React.useState<AuditMediaItem[]>([]);
  const [loadingExisting, setLoadingExisting] = React.useState(true);

  const photoRef = React.useRef<HTMLInputElement>(null);
  const droneImageRef = React.useRef<HTMLInputElement>(null);
  const droneVideoRef = React.useRef<HTMLInputElement>(null);
  const satelliteRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (auditId) {
      loadExistingMedia();
    } else {
      setLoadingExisting(false);
    }
  }, [auditId]);

  async function loadExistingMedia() {
    try {
      const { getAuditMediaForAudit } = await import('@/lib/voc-services');
      const items = await getAuditMediaForAudit(auditId!);
      const withUrls = await getAuditMediaSignedUrls(items);
      setUploadedItems(withUrls);
    } catch (err) {
      console.error('[GeospatialEvidence] loadExisting', err);
    } finally {
      setLoadingExisting(false);
    }
  }

  function captureCurrentGPS(): Promise<CapturedLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            timestamp: new Date(pos.timestamp).toISOString(),
          });
        },
        (err) => reject(new Error(err.message)),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  async function handleCaptureLocation() {
    setGpsLoading(true);
    try {
      const loc = await captureCurrentGPS();
      setCapturedLocations(prev => [...prev, loc]);
      toast.success('GPS location captured');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to capture GPS');
    } finally {
      setGpsLoading(false);
    }
  }

  function handleFileSelect(files: FileList | null, mediaType: AuditMediaType) {
    if (!files) return;
    Array.from(files).forEach(file => {
      const preview = URL.createObjectURL(file);
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          setPendingUploads(prev => [...prev, {
            id, file, preview, mediaType,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy,
            deviceName: '', description: '', fieldNotes: '',
            flightDate: '', satelliteDate: '',
          }]);
        },
        () => {
          setPendingUploads(prev => [...prev, {
            id, file, preview, mediaType,
            latitude: null, longitude: null, accuracyMeters: null,
            deviceName: '', description: '', fieldNotes: '',
            flightDate: '', satelliteDate: '',
          }]);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
      );
    });
  }

  function updatePending(id: string, updates: Partial<PendingUpload>) {
    setPendingUploads(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }

  function removePending(id: string) {
    setPendingUploads(prev => {
      const item = prev.find(u => u.id === id);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter(u => u.id !== id);
    });
  }

  async function handleUploadAll() {
    if (pendingUploads.length === 0) return;
    setUploading(true);
    let successCount = 0;
    for (const pending of pendingUploads) {
      try {
        const item = await uploadAuditMedia({
          projectId,
          verificationId,
          auditId,
          mediaType: pending.mediaType,
          file: pending.file,
          latitude: pending.latitude ?? undefined,
          longitude: pending.longitude ?? undefined,
          accuracyMeters: pending.accuracyMeters ?? undefined,
          deviceName: pending.deviceName || undefined,
          verifierName: auditorName,
          capturedAt: new Date().toISOString(),
          flightDate: pending.flightDate || undefined,
          satelliteDate: pending.satelliteDate || undefined,
          description: pending.description || undefined,
          fieldNotes: pending.fieldNotes || undefined,
        });
        const url = await getAuditMediaSignedUrls([item]);
        if (url[0]) {
          setUploadedItems(prev => [...prev, url[0]]);
          onMediaUploaded?.(url[0]);
        }
        successCount++;
      } catch (err) {
        toast.error(`Failed to upload ${pending.file.name}`);
      }
    }
    pendingUploads.forEach(u => { if (u.preview) URL.revokeObjectURL(u.preview); });
    setPendingUploads([]);
    setUploading(false);
    if (successCount > 0) toast.success(`${successCount} file(s) uploaded successfully`);
  }

  const photoCount = pendingUploads.filter(u => u.mediaType === 'photo').length;
  const droneImageCount = pendingUploads.filter(u => u.mediaType === 'drone_image').length;
  const droneVideoCount = pendingUploads.filter(u => u.mediaType === 'drone_video').length;
  const satelliteCount = pendingUploads.filter(u => u.mediaType === 'satellite').length;

  return (
    <div className="space-y-4">
      <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileSelect(e.target.files, 'photo')} />
      <input ref={droneImageRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileSelect(e.target.files, 'drone_image')} />
      <input ref={droneVideoRef} type="file" accept="video/*" multiple className="hidden" onChange={e => handleFileSelect(e.target.files, 'drone_video')} />
      <input ref={satelliteRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileSelect(e.target.files, 'satellite')} />

      {/* Current Location Capture */}
      <div className="rounded-lg border border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <Crosshair className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Current GPS Location</p>
              <p className="text-xs text-muted-foreground">Capture your current position for the audit record</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleCaptureLocation} disabled={gpsLoading}>
            {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <MapPin className="h-4 w-4 mr-1" />}
            {gpsLoading ? 'Capturing...' : 'Capture GPS'}
          </Button>
        </div>
        {capturedLocations.length > 0 && (
          <div className="mt-3 space-y-2">
            {capturedLocations.map((loc, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-white dark:bg-slate-800 border p-2 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" />
                  <span className="font-mono">{loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</span>
                  {loc.accuracy && <Badge variant="outline" className="text-[10px]">±{Math.round(loc.accuracy)}m</Badge>}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(loc.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Sources */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => photoRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
        >
          <Camera className="h-6 w-6 text-emerald-600" />
          <div className="text-center">
            <p className="text-xs font-semibold">Geo-tagged Photos</p>
            {photoCount > 0 && <Badge className="mt-1 text-[10px] bg-emerald-100 text-emerald-700">{photoCount} staged</Badge>}
          </div>
        </button>
        <button
          onClick={() => droneImageRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 p-4 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
        >
          <Plane className="h-6 w-6 text-blue-600" />
          <div className="text-center">
            <p className="text-xs font-semibold">Drone Images</p>
            {droneImageCount > 0 && <Badge className="mt-1 text-[10px] bg-blue-100 text-blue-700">{droneImageCount} staged</Badge>}
          </div>
        </button>
        <button
          onClick={() => droneVideoRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20 p-4 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors cursor-pointer"
        >
          <Video className="h-6 w-6 text-purple-600" />
          <div className="text-center">
            <p className="text-xs font-semibold">Drone Videos</p>
            {droneVideoCount > 0 && <Badge className="mt-1 text-[10px] bg-purple-100 text-purple-700">{droneVideoCount} staged</Badge>}
          </div>
        </button>
        <button
          onClick={() => satelliteRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-4 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
        >
          <Satellite className="h-6 w-6 text-amber-600" />
          <div className="text-center">
            <p className="text-xs font-semibold">Satellite Imagery</p>
            {satelliteCount > 0 && <Badge className="mt-1 text-[10px] bg-amber-100 text-amber-700">{satelliteCount} staged</Badge>}
          </div>
        </button>
      </div>

      {/* Pending Uploads Queue */}
      {pendingUploads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Staged Evidence ({pendingUploads.length})</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { pendingUploads.forEach(u => { if (u.preview) URL.revokeObjectURL(u.preview); }); setPendingUploads([]); }}>
                Clear All
              </Button>
              <Button size="sm" onClick={handleUploadAll} disabled={uploading} className="bg-emerald-600 hover:bg-emerald-700">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                {uploading ? 'Uploading...' : 'Upload All'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingUploads.map((pending) => (
              <Card key={pending.id} className="overflow-hidden">
                <div className="flex">
                  {pending.file.type.startsWith('image/') ? (
                    <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-muted">
                      <img src={pending.preview} alt="" className="h-full w-full object-cover" />
                      <button
                        onClick={() => setPreviewItem(pending)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <Eye className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative h-28 w-28 shrink-0 bg-muted flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 p-3 space-y-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{pending.file.name}</p>
                        <Badge className={cn('text-[10px] mt-0.5 border-0', AUDIT_MEDIA_TYPE_COLORS[pending.mediaType])}>
                          {AUDIT_MEDIA_TYPE_LABELS[pending.mediaType]}
                        </Badge>
                      </div>
                      <button onClick={() => removePending(pending.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {pending.latitude != null && pending.longitude != null ? (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        <MapPin className="h-3 w-3 inline mr-0.5" />
                        {pending.latitude.toFixed(6)}, {pending.longitude.toFixed(6)}
                        {pending.accuracyMeters != null && <span className="ml-1">±{Math.round(pending.accuracyMeters)}m</span>}
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-600">No GPS data</p>
                    )}
                    <Input
                      placeholder="Description (optional)"
                      value={pending.description}
                      onChange={e => updatePending(pending.id, { description: e.target.value })}
                      className="h-7 text-xs"
                    />
                    {pending.mediaType === 'drone_image' || pending.mediaType === 'drone_video' ? (
                      <Input
                        type="date"
                        placeholder="Flight date"
                        value={pending.flightDate}
                        onChange={e => updatePending(pending.id, { flightDate: e.target.value })}
                        className="h-7 text-xs"
                      />
                    ) : pending.mediaType === 'satellite' ? (
                      <Input
                        type="date"
                        placeholder="Acquisition date"
                        value={pending.satelliteDate}
                        onChange={e => updatePending(pending.id, { satelliteDate: e.target.value })}
                        className="h-7 text-xs"
                      />
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Already Uploaded Evidence */}
      {uploadedItems.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <p className="text-sm font-semibold">Uploaded Evidence ({uploadedItems.length})</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {uploadedItems.map((item) => (
              <EvidenceThumb key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {loadingExisting && (
        <div className="flex items-center justify-center py-4 text-muted-foreground text-xs">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading existing evidence...
        </div>
      )}

      {/* Full-screen Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {previewItem && (
            <div className="relative">
              <img src={previewItem.preview} alt="" className="w-full max-h-[70vh] object-contain bg-black" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                <p className="text-sm font-medium">{previewItem.file.name}</p>
                {previewItem.latitude != null && previewItem.longitude != null && (
                  <p className="text-xs font-mono mt-1">
                    <MapPin className="h-3 w-3 inline mr-0.5" />
                    {previewItem.latitude.toFixed(6)}, {previewItem.longitude.toFixed(6)}
                  </p>
                )}
                {previewItem.description && <p className="text-xs mt-1 opacity-80">{previewItem.description}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EvidenceThumb({ item }: { item: AuditMediaItem }) {
  const [showDialog, setShowDialog] = React.useState(false);
  const isImage = item.mime_type?.startsWith('image/') || item.media_type === 'photo' || item.media_type === 'drone_image' || item.media_type === 'satellite';

  return (
    <>
      <div
        className="group relative rounded-lg overflow-hidden border bg-muted cursor-pointer hover:shadow-md transition-shadow aspect-square"
        onClick={() => setShowDialog(true)}
      >
        {item.url && isImage ? (
          <img src={item.url} alt={item.file_name || ''} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Badge className={cn('absolute top-1 right-1 text-[9px] border-0 opacity-0 group-hover:opacity-100 transition-opacity', AUDIT_MEDIA_TYPE_COLORS[item.media_type])}>
          {AUDIT_MEDIA_TYPE_LABELS[item.media_type]}
        </Badge>
        {item.latitude != null && item.longitude != null && (
          <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-[9px] text-white font-mono bg-black/50 rounded px-1 py-0.5 truncate">
              {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
            </p>
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {item.url && isImage ? (
            <img src={item.url} alt={item.file_name || ''} className="w-full max-h-[60vh] object-contain bg-black" />
          ) : (
            <div className="flex items-center justify-center h-48 bg-muted">
              <Video className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{item.file_name}</p>
              <Badge className={cn('text-[10px] border-0', AUDIT_MEDIA_TYPE_COLORS[item.media_type])}>
                {AUDIT_MEDIA_TYPE_LABELS[item.media_type]}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {item.latitude != null && item.longitude != null && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="font-mono">{item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}</span>
                </div>
              )}
              {item.accuracy_meters != null && (
                <div>Accuracy: ±{Math.round(item.accuracy_meters)}m</div>
              )}
              {item.verifier_name && <div>By: {item.verifier_name}</div>}
              {item.captured_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(item.captured_at).toLocaleString()}
                </div>
              )}
            </div>
            {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
            {item.field_notes && <p className="text-xs italic text-muted-foreground">{item.field_notes}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
