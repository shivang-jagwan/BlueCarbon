'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Camera,
  Video,
  Plane,
  MapPin,
  Clock,
  Smartphone,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  requestBrowserGps,
  extractExifData,
  extractGpsFromExif,
  extractDeviceFromExif,
  extractCaptureTimestamp,
  computeFileHash,
  validateEvidence,
} from '@/lib/evidence-validation';
import { createEvidenceRecord } from '@/services/evidence';
import { uploadFile } from '@/services/storage';
import type { VerificationEvidence, GpsCoordinates, ProjectBoundary, EvidenceType } from '@/lib/types';

interface EvidenceCaptureProps {
  projectId: string;
  verificationRequestId?: string | null;
  projectBoundary: ProjectBoundary;
  existingEvidence: VerificationEvidence[];
  onSuccess: () => void;
}

const CAPTURE_TYPES: { type: EvidenceType; label: string; icon: React.ElementType; accept: string }[] = [
  { type: 'photo', label: 'Capture Photo', icon: Camera, accept: 'image/jpeg,image/png,image/webp' },
  { type: 'video', label: 'Capture Video', icon: Video, accept: 'video/mp4,video/webm,video/quicktime' },
  { type: 'drone_image', label: 'Drone Image', icon: Plane, accept: 'image/jpeg,image/png,image/tiff' },
  { type: 'drone_video', label: 'Drone Video', icon: Plane, accept: 'video/mp4,video/webm' },
];

interface CaptureState {
  gps: GpsCoordinates | null;
  gpsStatus: 'idle' | 'acquiring' | 'acquired' | 'error';
  gpsError: string | null;
}

export function EvidenceCapture({
  projectId,
  verificationRequestId,
  projectBoundary,
  existingEvidence,
  onSuccess,
}: EvidenceCaptureProps) {
  const [selectedType, setSelectedType] = React.useState<EvidenceType>('photo');
  const [captureState, setCaptureState] = React.useState<CaptureState>({
    gps: null,
    gpsStatus: 'idle',
    gpsError: null,
  });
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [monitoringNotes, setMonitoringNotes] = React.useState('');
  const [lastResult, setLastResult] = React.useState<{
    status: string;
    score: number;
    flags: string[];
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-acquire GPS on mount
  React.useEffect(() => {
    acquireGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acquireGps = async () => {
    setCaptureState((s) => ({ ...s, gpsStatus: 'acquiring', gpsError: null }));
    try {
      const coords = await requestBrowserGps();
      setCaptureState({ gps: coords, gpsStatus: 'acquired', gpsError: null });
      toast.success(`GPS acquired (accuracy: ${Math.round(coords.accuracy || 0)}m)`);
    } catch (err) {
      setCaptureState((s) => ({
        ...s,
        gpsStatus: 'error',
        gpsError: err instanceof Error ? err.message : 'GPS unavailable',
      }));
      toast.warning('GPS unavailable — evidence will be flagged');
    }
  };

  const handleCapture = async (type: EvidenceType) => {
    setSelectedType(type);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input for re-selection
    e.target.value = '';

    // File type validation
    const acceptMap: Record<EvidenceType, string[]> = {
      photo: ['image/jpeg', 'image/png', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
      drone_image: ['image/jpeg', 'image/png', 'image/tiff'],
      drone_video: ['video/mp4', 'video/webm'],
    };
    if (!acceptMap[selectedType].includes(file.type)) {
      toast.error(`Unsupported file type: ${file.type}`);
      return;
    }

    // Max size: 200MB for video, 50MB for images
    const maxSize = selectedType.includes('video') ? 200 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum: ${selectedType.includes('video') ? '200MB' : '50MB'}`);
      return;
    }

    setUploading(true);
    setProgress(10);
    setLastResult(null);

    try {
      // Step 1: Extract EXIF data
      setProgress(20);
      const exifData = await extractExifData(file);

      // Step 2: Determine GPS (prefer browser GPS, fallback to EXIF)
      let gps = captureState.gps;
      if (!gps) {
        const exifGps = extractGpsFromExif(exifData);
        if (exifGps) {
          gps = exifGps;
        }
      }

      // Step 3: Compute file hash
      setProgress(35);
      const fileHash = await computeFileHash(file);

      // Step 4: Validate evidence
      setProgress(50);
      const validation = await validateEvidence(
        file,
        gps,
        projectBoundary,
        existingEvidence,
        exifData
      );

      // Step 5: Upload to storage
      setProgress(65);
      const category = `${selectedType}s`;
      const fileRecord = await uploadFile(file, 'evidence-verified', category, projectId);

      // Step 6: Extract metadata
      setProgress(80);
      const device = extractDeviceFromExif(exifData);
      const captureTimestamp = extractCaptureTimestamp(exifData);

      // Step 7: Create evidence record
      setProgress(90);
      const evidenceData: Parameters<typeof createEvidenceRecord>[0] = {
        project_id: projectId,
        verification_request_id: verificationRequestId ?? null,
        storage_path: fileRecord.storage_path,
        evidence_type: selectedType,
        latitude: gps?.latitude ?? null,
        longitude: gps?.longitude ?? null,
        gps_accuracy_meters: gps?.accuracy ?? null,
        gps_source: gps === captureState.gps ? 'device' : gps ? 'exif' : 'none',
        capture_timestamp: captureTimestamp,
        device_name: device.deviceName ?? null,
        device_model: device.deviceModel ?? null,
        device_platform: device.platform ?? null,
        exif_data: Object.keys(exifData).length > 0 ? exifData : null,
        file_hash: fileHash,
        file_size: file.size,
        mime_type: file.type,
        original_filename: file.name,
        monitoring_notes: monitoringNotes || null,
        validation_status: validation.status,
        fraud_score: validation.fraud_score,
        fraud_flags: validation.fraud_flags,
        validation_notes: validation.validation_notes,
      };

      // Set URL based on type
      if (selectedType === 'photo') evidenceData.photo_url = fileRecord.public_url;
      else if (selectedType === 'video') evidenceData.video_url = fileRecord.public_url;
      else if (selectedType === 'drone_image') evidenceData.drone_image_url = fileRecord.public_url;
      else if (selectedType === 'drone_video') evidenceData.drone_video_url = fileRecord.public_url;

      await createEvidenceRecord(evidenceData);

      setProgress(100);
      setLastResult({
        status: validation.status,
        score: validation.fraud_score,
        flags: validation.fraud_flags,
      });

      if (validation.status === 'rejected') {
        toast.error(`Evidence rejected (fraud score: ${validation.fraud_score}/100)`);
      } else if (validation.status === 'warning') {
        toast.warning(`Evidence uploaded with warnings (fraud score: ${validation.fraud_score}/100)`);
      } else {
        toast.success('Evidence validated and uploaded successfully');
      }

      setMonitoringNotes('');
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 800);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        className="hidden"
        accept={CAPTURE_TYPES.find((t) => t.type === selectedType)?.accept}
      />

      {/* GPS Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              captureState.gpsStatus === 'acquired' ? 'bg-success/10 text-success' :
              captureState.gpsStatus === 'acquiring' ? 'bg-primary/10 text-primary' :
              captureState.gpsStatus === 'error' ? 'bg-destructive/10 text-destructive' :
              'bg-muted text-muted-foreground'
            )}>
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Location Status</p>
              <p className="text-xs text-muted-foreground">
                {captureState.gpsStatus === 'acquired' && captureState.gps
                  ? `${captureState.gps.latitude.toFixed(6)}, ${captureState.gps.longitude.toFixed(6)} (±${Math.round(captureState.gps.accuracy || 0)}m)`
                  : captureState.gpsStatus === 'acquiring'
                  ? 'Acquiring GPS signal...'
                  : captureState.gpsStatus === 'error'
                  ? captureState.gpsError || 'GPS unavailable'
                  : 'Click to acquire GPS'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={acquireGps}
            disabled={captureState.gpsStatus === 'acquiring'}
          >
            {captureState.gpsStatus === 'acquiring' ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <MapPin className="mr-1.5 h-3.5 w-3.5" />
            )}
            {captureState.gpsStatus === 'acquired' ? 'Refresh' : 'Acquire GPS'}
          </Button>
        </div>
      </Card>

      {/* Capture Buttons */}
      {uploading ? (
        <Card className="p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Processing evidence...</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Extracting metadata, validating, uploading
              </p>
            </div>
            <Progress value={progress} className="h-2 w-full max-w-[300px]" />
            <p className="text-xs text-muted-foreground">{progress}%</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {CAPTURE_TYPES.map((ct) => {
            const Icon = ct.icon;
            return (
              <Button
                key={ct.type}
                variant="outline"
                className="h-auto flex-col gap-2 py-6"
                onClick={() => handleCapture(ct.type)}
              >
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">{ct.label}</span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Monitoring Notes */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Monitoring Notes (optional)</p>
            <Textarea
              value={monitoringNotes}
              onChange={(e) => setMonitoringNotes(e.target.value)}
              placeholder="Add field observations, conditions, or notes..."
              className="mt-2 min-h-[80px]"
            />
          </div>
        </div>
      </Card>

      {/* Last Result */}
      {lastResult && (
        <Card className={cn(
          'p-4',
          lastResult.status === 'valid' && 'border-success/30 bg-success/5',
          lastResult.status === 'warning' && 'border-amber-300 bg-amber-50 dark:bg-amber-900/10',
          lastResult.status === 'rejected' && 'border-destructive/30 bg-destructive/5',
        )}>
          <div className="flex items-start gap-3">
            {lastResult.status === 'valid' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
            ) : lastResult.status === 'warning' ? (
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {lastResult.status === 'valid' ? 'Evidence Validated' :
                 lastResult.status === 'warning' ? 'Evidence with Warnings' :
                 'Evidence Rejected'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Fraud Score: {lastResult.score}/100
              </p>
              {lastResult.flags.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {lastResult.flags.map((flag, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {flag}</li>
                  ))}
                </ul>
              )}
            </div>
            <Badge variant="secondary" className={cn(
              'text-xs',
              lastResult.status === 'valid' && 'bg-success/10 text-success',
              lastResult.status === 'warning' && 'bg-amber-100 text-amber-700',
              lastResult.status === 'rejected' && 'bg-destructive/10 text-destructive',
            )}>
              {lastResult.status.toUpperCase()}
            </Badge>
          </div>
        </Card>
      )}

      {/* Requirements */}
      <Card className="p-4 bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground mb-2">Evidence Requirements</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            Minimum 5 photos required per monitoring visit
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            Each photo should have distinct GPS coordinates
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            Evidence must be within project boundary
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            GPS metadata and EXIF data are automatically validated
          </li>
        </ul>
      </Card>
    </div>
  );
}
