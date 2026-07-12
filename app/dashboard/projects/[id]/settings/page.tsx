'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Globe,
  Bell,
  Lock,
  Archive,
  Trash2,
  Save,
  Clock,
} from 'lucide-react';
import { PROJECT_TYPE_LABELS, type ProjectType, type ProjectStatus } from '@/lib/types';

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const { project, loading } = useProject(projectId);
  const { user } = useAuth();
  const [saving, setSaving] = React.useState(false);

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [projectType, setProjectType] = React.useState<ProjectType>('mangrove');
  const [visibility, setVisibility] = React.useState('public');

  React.useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setProjectType(project.project_type);
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
            'Support received',
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
        <div className="space-y-3">
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
        </div>
      </Card>
    </div>
  );
}
