'use client';

import * as React from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Globe,
  Bell,
  Lock,
  Archive,
  Trash2,
  Save,
  Clock,
  Upload,
  ImageIcon,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { PROJECT_TYPE_LABELS, type ProjectType } from '@/lib/types';

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const { project, loading } = useProject(projectId);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [projectType, setProjectType] = React.useState<ProjectType>('mangrove');
  const [visibility, setVisibility] = React.useState('public');
  const [coverImage, setCoverImage] = React.useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = React.useState(false);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setProjectType(project.project_type);
      setCoverImage(project.cover_image_url || null);
    }
  }, [project]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name,
          description,
          project_type: projectType,
        })
        .eq('id', projectId);

      if (error) throw error;
      toast.success('Project settings updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Archive this project? It will be marked as paused.')) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'paused' })
        .eq('id', projectId);
      if (error) throw error;
      toast.success('Project archived');
      router.push('/dashboard/projects');
    } catch (err) {
      toast.error('Failed to archive project');
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    setUploadingCover(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${projectId}/cover.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-cover-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-cover-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: dbError } = await supabase
        .from('projects')
        .update({ cover_image_url: publicUrl })
        .eq('id', projectId);

      if (dbError) throw dbError;

      setCoverImage(publicUrl);
      toast.success('Cover image updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload cover image');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleCoverRemove = async () => {
    if (!confirm('Remove the cover image?')) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({ cover_image_url: null })
        .eq('id', projectId);
      if (error) throw error;
      setCoverImage(null);
      toast.success('Cover image removed');
    } catch (err) {
      toast.error('Failed to remove cover image');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to delete project');
      }
      toast.success('Project deleted');
      router.push('/dashboard/projects');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Project Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage project details, visibility, and preferences
        </p>
      </div>

      {/* General */}
      <Card className="p-6">
        <h2 className="mb-4 font-semibold">General</h2>
        <div className="space-y-4">
          <div>
            <Label>Project Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 min-h-20"
            />
          </div>
          <div>
            <Label>Project Type</Label>
            <Select value={projectType} onValueChange={(v) => setProjectType(v as ProjectType)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((t) => (
                  <SelectItem key={t} value={t}>{PROJECT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="mt-4">
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Card>

      {/* Project Appearance */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <ImageIcon className="h-4.5 w-4.5 text-primary" />
          <h2 className="font-semibold">Project Appearance</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Upload a cover image that will be displayed on your project card.
        </p>

        <input
          type="file"
          ref={coverInputRef}
          onChange={handleCoverUpload}
          className="hidden"
          accept="image/jpeg,image/png,image/webp"
        />

        {coverImage ? (
          <div className="space-y-3">
            <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border">
              <Image
                src={coverImage}
                alt="Project cover"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
              >
                {uploadingCover ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-3.5 w-3.5" />
                )}
                Replace Image
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCoverRemove}
                disabled={uploadingCover}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => !uploadingCover && coverInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/30"
          >
            {uploadingCover ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
            <p className="mt-2 text-sm font-medium">
              {uploadingCover ? 'Uploading...' : 'Click to upload a cover image'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPG, PNG, or WebP. Max 10MB.
            </p>
          </div>
        )}
      </Card>

      {/* Visibility */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-4.5 w-4.5 text-primary" />
          <h2 className="font-semibold">Visibility</h2>
        </div>
        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public — Visible in discovery hub</SelectItem>
            <SelectItem value="private">Private — Only invited users</SelectItem>
            <SelectItem value="unlisted">Unlisted — Link only</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4.5 w-4.5 text-primary" />
          <h2 className="font-semibold">Notification Preferences</h2>
        </div>
        <div className="space-y-3">
          {[
            'Verification status updates',
            'New evidence comments',
            'Monthly monitoring reminders',
            'NGO messages',
          ].map((item) => (
            <label key={item} className="flex items-center justify-between text-sm">
              <span>{item}</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border" />
            </label>
          ))}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4.5 w-4.5 text-destructive" />
          <h2 className="font-semibold text-destructive">Danger Zone</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Archive Project</p>
              <p className="text-xs text-muted-foreground">Pause this project and hide from active lists</p>
            </div>
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
          </div>
          <div className="border-t border-destructive/10 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete Project</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete this project and all its data, including verifiers, partnerships, documents, and evidence. This cannot be undone.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Delete Project
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="text-sm text-muted-foreground">
                        <p>
                          This will permanently delete <strong>{project.name}</strong> and all associated data:
                        </p>
                        <ul className="mt-2 list-disc pl-5 space-y-1">
                          <li>All documents and evidence files</li>
                          <li>Verifier connections and verification history</li>
                          <li>Partner company relationships</li>
                          <li>Carbon passport and monitoring reports</li>
                          <li>Calendar events and discussion comments</li>
                        </ul>
                        <p className="mt-3 text-destructive font-medium">This action cannot be undone.</p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Project
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
