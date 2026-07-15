'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import { useEvidence, useEvidenceStats } from '@/hooks/use-evidence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Camera,
  ShieldCheck,
  MapPin,
  Image as ImageIcon,
  Video,
  Plane,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Upload,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EvidenceCapture } from '@/components/evidence/EvidenceCapture';
import { EvidenceGallery } from '@/components/evidence/EvidenceGallery';
import { EvidenceMap } from '@/components/evidence/EvidenceMap';
import { FraudScoreBadge } from '@/components/evidence/FraudScoreBadge';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function EvidencePage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project } = useProject(projectId);
  const { profile } = useAuth();
  const { evidence, loading, refetch } = useEvidence(projectId);
  const { stats } = useEvidenceStats(projectId);

  const role = profile?.role;
  const isOwner = role === 'project_owner';
  const isPartner = role === 'sustainability_partner';
  const isVerifier = role === 'verifier';
  const isAdmin = role === 'admin';
  const readOnly = isOwner || isPartner;

  const projectBoundary = {
    boundary_geojson: project?.boundary_geojson ?? null,
    center_lat: project?.center_lat ?? null,
    center_lng: project?.center_lng ?? null,
    allowed_radius_meters: 100,
  };

  const handleDelete = async (evidenceId: string, storagePath: string) => {
    try {
      await supabase.storage.from('evidence-verified').remove([storagePath]);
      await supabase.from('verification_evidence').delete().eq('id', evidenceId);
      toast.success('Evidence deleted');
      refetch();
    } catch {
      toast.error('Failed to delete evidence');
    }
  };

  const photoCount = evidence.filter((e) => e.evidence_type === 'photo').length;
  const uniqueGpsPositions = new Set(
    evidence
      .filter((e) => e.latitude != null && e.longitude != null)
      .map((e) => `${Math.round(e.latitude! * 10000)},${Math.round(e.longitude! * 10000)}`)
  ).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">
            {readOnly ? 'Evidence Review' : 'Evidence Upload'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {readOnly
              ? 'View monitoring evidence collected during field verification'
              : 'Upload and validate geo-tagged evidence for monitoring visits'}
          </p>
        </div>
        {!readOnly && (
          <Badge variant="outline" className="gap-1">
            <Upload className="h-3 w-3" />
            Upload Mode
          </Badge>
        )}
        {readOnly && (
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="h-3 w-3" />
            Read Only
          </Badge>
        )}
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Photos</p>
                <p className="text-lg font-semibold">{stats.photos}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Videos</p>
                <p className="text-lg font-semibold">{stats.videos}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Drone</p>
                <p className="text-lg font-semibold">{stats.droneImages + stats.droneVideos}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">GPS Valid</p>
                <p className="text-lg font-semibold">{stats.gpsValid}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">Valid</p>
                <p className="text-lg font-semibold">{stats.valid}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Fraud</p>
                <p className="text-lg font-semibold">{stats.avgFraudScore}/100</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Multi-photo progress */}
      {!readOnly && stats && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Monitoring Visit Progress</p>
            <span className="text-xs text-muted-foreground">
              {photoCount}/5 photos min • {uniqueGpsPositions} unique positions
            </span>
          </div>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 flex-1 rounded-full transition-colors',
                  i < photoCount ? 'bg-success' : 'bg-muted'
                )}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {photoCount >= 5 && uniqueGpsPositions >= 3
              ? 'Minimum requirements met'
              : photoCount >= 5
              ? `Need ${Math.max(0, 3 - uniqueGpsPositions)} more unique GPS positions`
              : `Need ${5 - photoCount} more photos`}
          </p>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue={readOnly ? 'gallery' : 'upload'} className="space-y-4">
        <TabsList>
          {!readOnly && (
            <TabsTrigger value="upload" className="gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              Upload Evidence
            </TabsTrigger>
          )}
          <TabsTrigger value="gallery" className="gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            Gallery ({evidence.length})
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Map View
          </TabsTrigger>
          {(isAdmin || isVerifier) && (
            <TabsTrigger value="analysis" className="gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Analysis
            </TabsTrigger>
          )}
        </TabsList>

        {/* Upload Tab */}
        {!readOnly && (
          <TabsContent value="upload">
            <EvidenceCapture
              projectId={projectId}
              projectBoundary={projectBoundary}
              existingEvidence={evidence}
              onSuccess={refetch}
            />
          </TabsContent>
        )}

        {/* Gallery Tab */}
        <TabsContent value="gallery">
          <EvidenceGallery
            evidence={evidence}
            loading={loading}
            onDelete={!readOnly ? handleDelete : undefined}
            readOnly={readOnly}
          />
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map">
          <EvidenceMap
            markers={stats?.mapMarkers || []}
            projectCenter={
              project?.center_lat && project?.center_lng
                ? { lat: project.center_lat, lng: project.center_lng }
                : null
            }
          />
        </TabsContent>

        {/* Analysis Tab (Admin/Verifier only) */}
        {(isAdmin || isVerifier) && (
          <TabsContent value="analysis">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Fraud Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Validation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          Valid
                        </span>
                        <span className="text-sm font-medium">{stats.valid}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          Warning
                        </span>
                        <span className="text-sm font-medium">{stats.warning}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm">
                          <XCircle className="h-4 w-4 text-destructive" />
                          Rejected
                        </span>
                        <span className="text-sm font-medium">{stats.rejected}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          Pending
                        </span>
                        <span className="text-sm font-medium">{stats.pending}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Fraud Flags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fraud Flags Detected</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {evidence
                    .filter((e) => e.fraud_flags && e.fraud_flags.length > 0)
                    .slice(0, 10)
                    .map((item) => (
                      <div key={item.id} className="flex items-start gap-2">
                        <FraudScoreBadge score={item.fraud_score} showIcon={false} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-xs text-muted-foreground">
                            {item.original_filename}
                          </p>
                          {item.fraud_flags?.map((flag, i) => (
                            <p key={i} className="text-xs text-destructive">• {flag}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  {evidence.filter((e) => e.fraud_flags && e.fraud_flags.length > 0).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No fraud flags detected
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
