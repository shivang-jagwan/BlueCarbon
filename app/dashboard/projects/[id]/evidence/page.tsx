'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProjectDocuments } from '@/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  FileCheck,
  Clock,
  Download,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'ground_image', label: 'Ground Image', icon: ImageIcon },
  { id: 'drone_image', label: 'Drone Image', icon: ImageIcon },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'gps_log', label: 'GPS Log', icon: FileText },
  { id: 'survey_report', label: 'Survey Report', icon: FileCheck },
  { id: 'water_quality', label: 'Water Quality', icon: FileText },
  { id: 'soil_report', label: 'Soil Report', icon: FileText },
];

function getIcon(mime: string | null) {
  if (!mime) return FileText;
  if (mime.startsWith('image/')) return ImageIcon;
  if (mime.startsWith('video/')) return Video;
  if (mime === 'application/pdf') return FileCheck;
  return FileText;
}

function formatSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EvidencePage() {
  const params = useParams();
  const projectId = params.id as string;
  const { documents, loading, refetch } = useProjectDocuments(projectId);
  const { user } = useAuth();
  const [uploading, setUploading] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState('ground_image');
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const filePath = `${projectId}/${selectedCategory}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('project-evidence')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: docError } = await supabase.from('project_documents').insert({
        project_id: projectId,
        uploaded_by: user.id,
        name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        category: selectedCategory,
      });

      if (docError) throw docError;

      await supabase.from('project_activity').insert({
        project_id: projectId,
        actor_id: user.id,
        event_type: 'evidence_uploaded',
        title: 'Evidence Uploaded',
        description: `${file.name} uploaded to ${CATEGORIES.find((c) => c.id === selectedCategory)?.label}`,
      });

      toast.success('Evidence uploaded successfully');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string, filePath: string) => {
    try {
      await supabase.storage.from('project-evidence').remove([filePath]);
      await supabase.from('project_documents').delete().eq('id', docId);
      toast.success('Document deleted');
      refetch();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Evidence Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload and manage monitoring evidence and field data
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  selectedCategory === cat.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-primary/40 hover:bg-muted/30"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            accept="image/*,video/*,.pdf,.csv,.txt"
          />
          {uploading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-3 text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">
                Upload to {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click to browse or drag and drop
              </p>
            </>
          )}
        </div>
      </Card>

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No evidence uploaded yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload ground images, drone footage, surveys, and reports
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {documents.map((doc) => {
            const Icon = getIcon(doc.mime_type);
            const cat = CATEGORIES.find((c) => c.id === doc.category);
            return (
              <Card key={doc.id} className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    {cat && <Badge variant="secondary" className="text-xs">{cat.label}</Badge>}
                    <span className="text-xs text-muted-foreground">{formatSize(doc.file_size)}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(doc.id, doc.file_path)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
