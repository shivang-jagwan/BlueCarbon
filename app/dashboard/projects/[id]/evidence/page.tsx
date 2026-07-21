'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import type { ProjectGalleryItem, ProjectAlbum } from '@/lib/types';
import type { AuditMediaItem, GalleryAlbum } from '@/lib/voc-types';
import { AUDIT_MEDIA_TYPE_LABELS, AUDIT_MEDIA_TYPE_COLORS } from '@/lib/voc-types';
import { getAuditMediaSignedUrls } from '@/lib/voc-services';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Upload,
  Grid3X3,
  Clock,
  Image as ImageIcon,
  Video,
  FolderOpen,
  Plus,
  MapPin,
  User,
  Calendar,
  X,
  Play,
  Info,
  Shield,
  Lock,
  Plane,
  Satellite,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EvidencePage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project } = useProject(projectId);
  const { profile } = useAuth();
  const isPartner = profile?.role === 'sustainability_partner';

  const [albums, setAlbums] = React.useState<ProjectAlbum[]>([]);
  const [items, setItems] = React.useState<ProjectGalleryItem[]>([]);
  const [auditAlbums, setAuditAlbums] = React.useState<GalleryAlbum[]>([]);
  const [auditMedia, setAuditMedia] = React.useState<AuditMediaItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<'grid' | 'timeline'>('grid');
  const [selectedAlbum, setSelectedAlbum] = React.useState<string>('all');
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [isAlbumDialogOpen, setIsAlbumDialogOpen] = React.useState(false);
  const [previewMedia, setPreviewMedia] = React.useState<AuditMediaItem | null>(null);
  const [previewItem, setPreviewItem] = React.useState<ProjectGalleryItem | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const [albumsRes, itemsRes, auditAlbumsRes, auditMediaRes] = await Promise.all([
      supabase
        .from('project_albums')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
      supabase
        .from('project_gallery_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
      supabase
        .from('gallery_albums')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
      supabase
        .from('audit_media')
        .select('*')
        .eq('project_id', projectId)
        .order('captured_at', { ascending: false }),
    ]);
    setAlbums((albumsRes.data as ProjectAlbum[]) || []);
    setItems((itemsRes.data as ProjectGalleryItem[]) || []);
    setAuditAlbums((auditAlbumsRes.data as GalleryAlbum[]) || []);
    const rawAuditMedia = (auditMediaRes.data as AuditMediaItem[]) || [];
    if (rawAuditMedia.length > 0) {
      const withSignedUrls = await getAuditMediaSignedUrls(rawAuditMedia);
      setAuditMedia(withSignedUrls);
    } else {
      setAuditMedia([]);
    }
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = React.useMemo(() => {
    if (selectedAlbum === 'all') return items;
    if (selectedAlbum.startsWith('audit-')) {
      const albumId = selectedAlbum.replace('audit-', '');
      return auditMedia
        .filter((m) => m.album_id === albumId)
        .map((m) => ({
          id: m.id,
          project_id: m.project_id,
          album_id: '',
          uploaded_by: m.uploaded_by,
          uploader_name: m.verifier_name || null,
          media_type: m.media_type === 'drone_video' ? ('video' as const) : ('image' as const),
          file_name: m.file_name,
          file_size: m.file_size,
          mime_type: m.mime_type,
          storage_path: m.storage_path,
          public_url: m.url || null,
          caption: m.field_notes || null,
          location_name: null,
          latitude: m.latitude,
          longitude: m.longitude,
          created_at: m.uploaded_at,
        })) as ProjectGalleryItem[];
    }
    return items.filter((item) => item.album_id === selectedAlbum);
  }, [items, auditMedia, selectedAlbum]);

  const albumItemCount = React.useCallback(
    (albumId: string) => items.filter((i) => i.album_id === albumId).length,
    [items]
  );

  const auditAlbumItemCount = React.useCallback(
    (albumId: string) => auditMedia.filter((m) => m.album_id === albumId).length,
    [auditMedia]
  );

  const imageCount = items.filter((i) => i.media_type === 'image').length;
  const videoCount = items.filter((i) => i.media_type === 'video').length;
  const auditImageCount = auditMedia.filter((m) => m.media_type === 'photo' || m.media_type === 'drone_image' || m.media_type === 'satellite').length;
  const auditVideoCount = auditMedia.filter((m) => m.media_type === 'drone_video').length;

  const timelineGroups = React.useMemo(() => {
    const groups: Record<string, ProjectGalleryItem[]> = {};
    filteredItems.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  }, [filteredItems]);

  return (
    <div className="space-y-6">
      {project?.verification_status === 'approved' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <Info className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Project Monitoring Gallery</p>
            <p className="text-xs text-emerald-600">
              Continue uploading photos and videos to document the ongoing progress of your verified project. These uploads are part of continuous monitoring and do not modify the previously verified evidence.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Project Gallery</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isPartner ? 'Browse all project media — uploads, audits, drone surveys, and satellite imagery' : 'Field photos, drone images, and videos'}
          </p>
        </div>
        {!isPartner && (
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Upload className="mr-2 h-4 w-4" />
              Upload Media
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <UploadDialog
              projectId={projectId}
              albums={albums}
              profile={profile}
              onClose={() => setIsUploadOpen(false)}
              onSuccess={() => {
                setIsUploadOpen(false);
                fetchData();
              }}
            />
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Album Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedAlbum('all')}
          className={cn(
            'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            selectedAlbum === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          )}
        >
          All ({items.length + auditMedia.length})
        </button>
        {albums.map((album) => (
          <button
            key={album.id}
            onClick={() => setSelectedAlbum(album.id)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              selectedAlbum === album.id
                ? 'bg-green-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            )}
          >
            {album.name} ({albumItemCount(album.id)})
          </button>
        ))}
        {auditAlbums.length > 0 && (
          <>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 shrink-0" />
            {auditAlbums.map((album) => (
              <button
                key={`audit-${album.id}`}
                onClick={() => setSelectedAlbum(`audit-${album.id}`)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5',
                  selectedAlbum === `audit-${album.id}`
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40'
                )}
              >
                <Shield className="h-3 w-3" />
                {album.title} ({auditAlbumItemCount(album.id)})
                <Badge variant="outline" className="text-[10px] px-1 py-0 border-current opacity-70">
                  Audit
                </Badge>
              </button>
            ))}
          </>
        )}
        {!isPartner && (
        <button
          onClick={() => setIsAlbumDialogOpen(true)}
          className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus className="inline h-3.5 w-3.5 mr-1" />
          New Album
        </button>
        )}
      </div>

      {/* View Toggle + Stats */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 p-1">
          <button
            onClick={() => setView('grid')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              view === 'grid'
                ? 'bg-green-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            )}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            Grid
          </button>
          <button
            onClick={() => setView('timeline')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              view === 'timeline'
                ? 'bg-green-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            Timeline
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            {items.length + auditMedia.length} items
          </span>
          <span className="flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            {imageCount + auditImageCount} images
          </span>
          <span className="flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5" />
            {videoCount + auditVideoCount} videos
          </span>
          <span className="flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            {albums.length + auditAlbums.length} albums
          </span>
          {auditMedia.length > 0 && (
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <Shield className="h-3.5 w-3.5" />
              {auditMedia.length} audit evidence
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {selectedAlbum.startsWith('audit-') && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <Lock className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Audit Evidence (Read-Only)</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              This evidence was collected by the verification agency during their field audit. It cannot be modified or deleted by the project owner.
            </p>
          </div>
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <Skeleton className="aspect-square" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No gallery items yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload field photos and videos to document your project.
            </p>
          </div>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {filteredItems.map((item) => (
            <GalleryCard key={item.id} item={item} isAudit={selectedAlbum.startsWith('audit-')} onClick={() => {
              if (selectedAlbum.startsWith('audit-')) {
                const am = auditMedia.find((a) => a.id === item.id);
                if (am) setPreviewMedia(am);
              } else {
                setPreviewItem(item);
              }
            }} />
          ))}
        </div>
      ) : (
        <div className="relative ml-4 border-l-2 border-slate-200 dark:border-slate-800 pl-8 space-y-8">
          {Object.entries(timelineGroups).map(([date, dateItems]) => (
            <div key={date} className="relative">
              <div className="absolute -left-12 top-1 h-4 w-4 rounded-full bg-green-600 border-2 border-white dark:border-slate-900" />
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {date}
              </h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {dateItems.map((item) => (
                  <GalleryCard key={item.id} item={item} isAudit={selectedAlbum.startsWith('audit-')} onClick={() => {
                    if (selectedAlbum.startsWith('audit-')) {
                      const am = auditMedia.find((a) => a.id === item.id);
                      if (am) setPreviewMedia(am);
                    } else {
                      setPreviewItem(item);
                    }
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Album Dialog */}
      <Dialog open={isAlbumDialogOpen} onOpenChange={setIsAlbumDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <CreateAlbumDialog
            projectId={projectId}
            onClose={() => setIsAlbumDialogOpen(false)}
            onSuccess={() => {
              setIsAlbumDialogOpen(false);
              fetchData();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Audit Media Preview Dialog */}
      <Dialog open={!!previewMedia} onOpenChange={(open) => !open && setPreviewMedia(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {previewMedia && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Audit Evidence Preview
                </DialogTitle>
                <DialogDescription>{previewMedia.file_name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {previewMedia.media_type === 'drone_video' ? (
                  <div className="rounded-lg overflow-hidden bg-black">
                    <video
                      src={previewMedia.url}
                      controls
                      className="w-full max-h-[60vh]"
                      preload="metadata"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={previewMedia.url}
                      alt={previewMedia.file_name || 'Audit evidence'}
                      className="w-full max-h-[60vh] object-contain"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Type:</span>{' '}
                      <Badge className={cn('text-xs', AUDIT_MEDIA_TYPE_COLORS[previewMedia.media_type])}>
                        {AUDIT_MEDIA_TYPE_LABELS[previewMedia.media_type]}
                      </Badge>
                    </div>
                    {previewMedia.latitude && previewMedia.longitude && (
                      <div>
                        <span className="text-muted-foreground">GPS:</span>{' '}
                        {previewMedia.latitude.toFixed(6)}, {previewMedia.longitude.toFixed(6)}
                      </div>
                    )}
                    {previewMedia.description && (
                      <div>
                        <span className="text-muted-foreground">Description:</span> {previewMedia.description}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Captured:</span>{' '}
                      {previewMedia.captured_at ? new Date(previewMedia.captured_at).toLocaleString() : new Date(previewMedia.uploaded_at).toLocaleString()}
                    </div>
                    {previewMedia.file_size && (
                      <div>
                        <span className="text-muted-foreground">Size:</span>{' '}
                        {(previewMedia.file_size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    )}
                    {previewMedia.field_notes && (
                      <div>
                        <span className="text-muted-foreground">Notes:</span> {previewMedia.field_notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Gallery Item Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {previewItem && (
            <>
              <DialogHeader>
                <DialogTitle>{previewItem.file_name || 'Gallery Item'}</DialogTitle>
                {previewItem.caption && <DialogDescription>{previewItem.caption}</DialogDescription>}
              </DialogHeader>
              <div className="space-y-4">
                {previewItem.media_type === 'video' ? (
                  <div className="rounded-lg overflow-hidden bg-black">
                    {previewItem.public_url ? (
                      <video
                        src={previewItem.public_url}
                        controls
                        className="w-full max-h-[60vh]"
                        preload="metadata"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center text-white/50">
                        <Play className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                ) : previewItem.public_url ? (
                  <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={previewItem.public_url}
                      alt={previewItem.file_name || 'Gallery image'}
                      className="w-full max-h-[60vh] object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Uploaded:</span>{' '}
                      {new Date(previewItem.created_at).toLocaleString()}
                    </div>
                    {previewItem.file_size && (
                      <div>
                        <span className="text-muted-foreground">Size:</span>{' '}
                        {(previewItem.file_size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {previewItem.location_name && (
                      <div>
                        <span className="text-muted-foreground">Location:</span>{' '}
                        {previewItem.location_name}
                      </div>
                    )}
                    {previewItem.uploader_name && (
                      <div>
                        <span className="text-muted-foreground">Uploader:</span>{' '}
                        {previewItem.uploader_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GalleryCard({ item, isAudit, onClick }: { item: ProjectGalleryItem; isAudit?: boolean; onClick?: () => void }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200',
        hovered && 'shadow-lg scale-[1.02]',
        isAudit && 'border-blue-200 dark:border-blue-800',
        onClick && 'cursor-pointer'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div className="aspect-square overflow-hidden relative bg-slate-100 dark:bg-slate-800">
        {item.media_type === 'image' && item.public_url ? (
          <img
            src={item.public_url}
            alt={item.file_name || 'Gallery image'}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : item.media_type === 'video' ? (
          <div className="flex h-full w-full items-center justify-center bg-slate-900">
            {item.public_url ? (
              <video
                src={item.public_url}
                className="h-full w-full object-cover"
                preload="metadata"
              />
            ) : (
              <Play className="h-10 w-10 text-white/60" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                <Play className="h-5 w-5 text-white fill-white" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-1.5">
          {isAudit && (
            <Shield className="h-3 w-3 text-blue-600 shrink-0" />
          )}
          <p className="truncate text-sm font-medium">{item.file_name || 'Untitled'}</p>
        </div>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        {item.location_name && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {item.location_name}
          </p>
        )}
        {item.uploader_name && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {item.uploader_name}
          </p>
        )}
      </div>
    </div>
  );
}

function UploadDialog({
  projectId,
  albums,
  profile,
  onClose,
  onSuccess,
}: {
  projectId: string;
  albums: ProjectAlbum[];
  profile: { id: string; full_name: string | null } | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mediaType, setMediaType] = React.useState<'image' | 'video'>('image');
  const [albumId, setAlbumId] = React.useState<string>('');
  const [caption, setCaption] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${projectId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('project-gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-gallery')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('project_gallery_items')
        .insert({
          project_id: projectId,
          album_id: albumId || null,
          uploaded_by: profile?.id || null,
          uploader_name: profile?.full_name || null,
          media_type: mediaType,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          storage_path: filePath,
          public_url: urlData?.publicUrl || null,
          caption: caption || null,
        });

      if (insertError) throw insertError;

      toast.success('Media uploaded successfully');
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload Media</DialogTitle>
        <DialogDescription>
          Add field photos or videos to the project gallery.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Media Type</Label>
          <div className="flex gap-2">
            <button
              onClick={() => setMediaType('image')}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                mediaType === 'image'
                  ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              <ImageIcon className="h-4 w-4" />
              Image
            </button>
            <button
              onClick={() => setMediaType('video')}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                mediaType === 'video'
                  ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              <Video className="h-4 w-4" />
              Video
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Album</Label>
          <Select value={albumId} onValueChange={setAlbumId}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {albums.map((album) => (
                <SelectItem key={album.id} value={album.id}>
                  {album.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>File</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept={mediaType === 'image' ? 'image/*' : 'video/*'}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900/20 dark:file:text-green-300"
          />
          {file && (
            <p className="text-xs text-muted-foreground">{file.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Caption</Label>
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </>
  );
}

function CreateAlbumDialog({
  projectId,
  onClose,
  onSuccess,
}: {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Album name is required');
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.from('project_albums').insert({
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || null,
        item_count: 0,
      });
      if (error) throw error;
      toast.success('Album created');
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create album';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Album</DialogTitle>
        <DialogDescription>
          Group gallery items into an album for better organization.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Album Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Site Visit July 2026"
          />
        </div>
        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description..."
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {creating ? 'Creating...' : 'Create Album'}
          </Button>
        </div>
      </div>
    </>
  );
}
