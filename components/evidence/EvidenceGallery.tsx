'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Download,
  Trash2,
  MapPin,
  Clock,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Video,
  Plane,
  Eye,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FraudScoreBadge } from './FraudScoreBadge';
import { EVIDENCE_TYPE_LABELS, EVIDENCE_STATUS_LABELS, EVIDENCE_STATUS_COLORS } from '@/lib/types';
import type { VerificationEvidence, EvidenceType } from '@/lib/types';

interface EvidenceGalleryProps {
  evidence: VerificationEvidence[];
  loading: boolean;
  onDelete?: (id: string, storagePath: string) => void;
  readOnly?: boolean;
}

const TYPE_ICONS: Record<EvidenceType, React.ElementType> = {
  photo: ImageIcon,
  video: Video,
  drone_image: Plane,
  drone_video: Plane,
};

function formatFileSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EvidenceGallery({ evidence, loading, onDelete, readOnly }: EvidenceGalleryProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse p-4">
            <div className="h-32 rounded-lg bg-muted" />
            <div className="mt-3 space-y-2">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (evidence.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <h3 className="font-semibold">No evidence uploaded yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload ground photos, drone images, videos, and monitoring notes
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {evidence.length} evidence items
        </Badge>
        <Badge variant="secondary" className="text-xs bg-success/10 text-success">
          {evidence.filter((e) => e.validation_status === 'valid').length} valid
        </Badge>
        {evidence.filter((e) => e.validation_status === 'warning').length > 0 && (
          <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
            {evidence.filter((e) => e.validation_status === 'warning').length} warnings
          </Badge>
        )}
        {evidence.filter((e) => e.validation_status === 'rejected').length > 0 && (
          <Badge variant="secondary" className="text-xs bg-destructive/10 text-destructive">
            {evidence.filter((e) => e.validation_status === 'rejected').length} rejected
          </Badge>
        )}
      </div>

      {/* Evidence cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {evidence.map((item) => {
          const TypeIcon = TYPE_ICONS[item.evidence_type] || ImageIcon;
          const isExpanded = expandedId === item.id;
          const mediaUrl = item.photo_url || item.video_url || item.drone_image_url || item.drone_video_url;

          return (
            <Card key={item.id} className="overflow-hidden">
              {/* Media preview or placeholder */}
              <div className="relative h-40 bg-muted flex items-center justify-center">
                {item.photo_url || item.drone_image_url ? (
                  <img
                    src={item.photo_url || item.drone_image_url || ''}
                    alt={item.original_filename || 'Evidence'}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : item.video_url || item.drone_video_url ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Video className="h-10 w-10" />
                    <span className="text-xs">Video file</span>
                  </div>
                ) : (
                  <TypeIcon className="h-10 w-10 text-muted-foreground/40" />
                )}

                {/* Status badge overlay */}
                <div className="absolute top-2 left-2">
                  <Badge
                    variant="secondary"
                    className={cn('text-xs', EVIDENCE_STATUS_COLORS[item.validation_status])}
                  >
                    {EVIDENCE_STATUS_LABELS[item.validation_status]}
                  </Badge>
                </div>

                {/* Type badge */}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="gap-1 text-xs bg-background/80 backdrop-blur-sm">
                    <TypeIcon className="h-3 w-3" />
                    {EVIDENCE_TYPE_LABELS[item.evidence_type]}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm font-medium">
                    {item.original_filename || 'Untitled'}
                  </p>
                  <FraudScoreBadge score={item.fraud_score} showIcon={false} />
                </div>

                {/* Quick metadata */}
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {item.latitude != null && item.longitude != null && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(item.created_at)}
                  </span>
                  <span>{formatFileSize(item.file_size)}</span>
                </div>

                {/* Monitoring notes */}
                {item.monitoring_notes && (
                  <p className="text-xs text-muted-foreground italic line-clamp-2">
                    &ldquo;{item.monitoring_notes}&rdquo;
                  </p>
                )}

                {/* Expand/Collapse */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {isExpanded ? 'Less details' : 'More details'}
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="space-y-2 border-t pt-2 text-xs text-muted-foreground">
                    {item.gps_source && (
                      <p><span className="font-medium">GPS Source:</span> {item.gps_source}</p>
                    )}
                    {item.gps_accuracy_meters != null && (
                      <p><span className="font-medium">GPS Accuracy:</span> ±{Math.round(item.gps_accuracy_meters)}m</p>
                    )}
                    {item.device_name && (
                      <p className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {item.device_name} {item.device_model || ''}
                      </p>
                    )}
                    {item.capture_timestamp && (
                      <p><span className="font-medium">Captured:</span> {formatDate(item.capture_timestamp)}</p>
                    )}
                    {item.file_hash && (
                      <p className="break-all"><span className="font-medium">Hash:</span> {item.file_hash.slice(0, 32)}...</p>
                    )}
                    {item.fraud_flags && item.fraud_flags.length > 0 && (
                      <div>
                        <p className="font-medium text-destructive">Fraud Flags:</p>
                        <ul className="mt-0.5 space-y-0.5">
                          {item.fraud_flags.map((flag, i) => (
                            <li key={i}>• {flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleDownload(item.storage_path)}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                      {item.photo_url || item.drone_image_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => window.open(item.photo_url || item.drone_image_url || '', '_blank')}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Full Size
                        </Button>
                      ) : null}
                      {!readOnly && onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => onDelete(item.id, item.storage_path)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      )}
                      {readOnly && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          Read only
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
