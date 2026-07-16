'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import type { ProjectGalleryItem, ProjectAlbum } from '@/lib/types';
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
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getActiveApplicationForProject } from '@/lib/voc-services';

export default function EvidencePage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project } = useProject(projectId);
  const { profile } = useAuth();
  const activeApp = React.useMemo(() => getActiveApplicationForProject(projectId), [projectId]);
  const isLocked = !!activeApp;

  const [albums, setAlbums] = React.useState<ProjectAlbum[]>([]);
  const [items, setItems] = React.useState<ProjectGalleryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<'grid' | 'timeline'>('grid');
  const [selectedAlbum, setSelectedAlbum] = React.useState<string>('all');
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [isAlbumDialogOpen, setIsAlbumDialogOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const [albumsRes, itemsRes] = await Promise.all([
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
    ]);
    setAlbums((albumsRes.data as ProjectAlbum[]) || []);
    setItems((itemsRes.data as ProjectGalleryItem[]) || []);
    setLoading(false);
  }, [projectId]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = React.useMemo(() => {
    if (selectedAlbum === 'all') return items;
    return items.filter((item) => item.album_id === selectedAlbum);
  }, [items, selectedAlbum]);

  const albumItemCount = React.useCallback(
    (albumId: string) => items.filter((i) => i.album_id === albumId).length,
    [items]
  );

  const imageCount = items.filter((i) => i.media_type === 'image').length;
  const videoCount = items.filter((i) => i.media_type === 'video').length;

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
      {isLocked && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <Lock className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Evidence is locked</p>
            <p className="text-xs text-amber-600">Verification Application {activeApp?.application_number} is under review. Upload, delete, and replace are disabled.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Project Gallery</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Field photos, drone images, and videos
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={isLocked}>
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
          All ({items.length})
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
        <button
          onClick={() => setIsAlbumDialogOpen(true)}
          className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
        >
          <Plus className="inline h-3.5 w-3.5 mr-1" />
          New Album
        </button>
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
            {items.length} items
          </span>
          <span className="flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" />
            {imageCount} images
          </span>
          <span className="flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5" />
            {videoCount} videos
          </span>
          <span className="flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" />
            {albums.length} albums
          </span>
        </div>
      </div>

      {/* Content */}
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
            <GalleryCard key={item.id} item={item} />
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
                  <GalleryCard key={item.id} item={item} />
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
    </div>
  );
}

function GalleryCard({ item }: { item: ProjectGalleryItem }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200',
        hovered && 'shadow-lg scale-[1.02]'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
        <p className="truncate text-sm font-medium">{item.file_name || 'Untitled'}</p>
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
