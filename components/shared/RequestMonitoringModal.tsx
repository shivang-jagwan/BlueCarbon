'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { sendNotification } from '@/lib/voc-services';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, MapPin, Bookmark, FolderCheck, Globe, ArrowRight } from 'lucide-react';
import { PROJECT_TYPE_LABELS, statusColor, type Project, type ProjectStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RequestMonitoringModalProps {
  verifierId: string;
  verifierName: string;
  isOpen: boolean;
  onClose: () => void;
}

const MONITORING_SERVICES = [
  { id: 'monthly', label: 'Monthly Monitoring', description: 'Regular check-ins' },
  { id: 'quarterly', label: 'Quarterly Monitoring', description: 'Every 3 months' },
  { id: 'annual', label: 'Annual Monitoring', description: 'Yearly deep-dive' },
  { id: 'lifecycle', label: 'Full Lifecycle', description: 'Complete project span' },
];

function ServiceRadioIndicator({ selected }: { selected: boolean }) {
  return (
    <div
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded-full border',
        selected ? 'border-primary' : 'border-muted-foreground/30'
      )}
    >
      {selected && <div className="h-2 w-2 rounded-full bg-primary" />}
    </div>
  );
}

export function RequestMonitoringModal({
  verifierId,
  verifierName,
  isOpen,
  onClose,
}: RequestMonitoringModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState<string>('saved');

  const [savedProjects, setSavedProjects] = React.useState<Project[]>([]);
  const [partneredProjects, setSupportedProjects] = React.useState<Project[]>([]);
  const [loadingSaved, setLoadingSaved] = React.useState(false);
  const [loadingPartnered, setLoadingSupported] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [projectId, setProjectId] = React.useState('');
  const [serviceType, setServiceType] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [budget, setBudget] = React.useState('');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (!isOpen || !user) return;

    setProjectId('');
    setServiceType('');
    setStartDate('');
    setBudget('');
    setMessage('');
    setActiveTab('saved');

    const loadSaved = async () => {
      setLoadingSaved(true);
      const { data: saved } = await supabase
        .from('saved_projects')
        .select('project_id')
        .eq('company_id', user.id);

      if (!saved || saved.length === 0) {
        setSavedProjects([]);
        setLoadingSaved(false);
        return;
      }

      const ids = saved.map((s: { project_id: string }) => s.project_id);
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .in('id', ids)
        .in('status', ['registered', 'verified', 'active']);

      setSavedProjects((projects as Project[]) || []);
      setLoadingSaved(false);
    };

    const loadPartnered = async () => {
      setLoadingSupported(true);
      const { data: partnerships } = await supabase
        .from('project_partnerships')
        .select('project_id, status')
        .eq('company_id', user.id)
        .in('status', ['active', 'pending_owner', 'pending_verifier']);

      if (!partnerships || partnerships.length === 0) {
        setSupportedProjects([]);
        setLoadingSupported(false);
        return;
      }

      const ids = Array.from(new Set(partnerships.map((p: { project_id: string }) => p.project_id)));
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .in('id', ids);

      setSupportedProjects((projects as Project[]) || []);
      setLoadingSupported(false);
    };

    loadSaved();
    loadPartnered();
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !serviceType) {
      toast.error('Please select a project and service type');
      return;
    }

    setIsSubmitting(true);
    try {
      const allProjects = [...savedProjects, ...partneredProjects];
      const selectedProject = allProjects.find((p) => p.id === projectId);
      if (!selectedProject) throw new Error('Project not found');

      const { error: insertErr } = await supabase.from('project_partnerships').insert({
        project_id: projectId,
        company_id: user?.id,
        owner_id: selectedProject.owner_id,
        verifier_id: verifierId,
        service_type: serviceType,
        start_date: startDate || null,
        budget_usd: budget ? parseFloat(budget) : null,
        message: message || null,
        status: 'pending_owner',
      });

      if (insertErr) throw insertErr;

      await supabase.from('project_activity').insert({
        project_id: projectId,
        actor_id: user?.id,
        event_type: 'monitoring_invitation_sent',
        title: 'Monitoring Invitation Sent',
        description: 'Company requested monitoring partnership with ' + verifierName,
      });

      await sendNotification({
        title: 'New Monitoring Partnership Invitation',
        body: 'A Sustainability Partner wants to fund monitoring for ' + selectedProject.name + '.',
        type: 'verification',
        targetUserId: selectedProject.owner_id,
        link: '/dashboard/projects/' + projectId + '/monitoring',
      });

      await sendNotification({
        title: 'New Monitoring Partnership Request',
        body: 'A Sustainability Partner has requested you to monitor ' + selectedProject.name + '.',
        type: 'verification',
        targetUserId: verifierId,
        link: '/dashboard/monitoring',
      });

      toast.success('Monitoring partnership request sent successfully.');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit request';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selected = projectId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Project Monitoring</DialogTitle>
          <DialogDescription>
            Send a monitoring partnership invitation to {verifierName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <ProjectSelector
            activeTab={activeTab}
            onTabChange={setActiveTab}
            savedProjects={savedProjects}
            partneredProjects={partneredProjects}
            loadingSaved={loadingSaved}
            loadingPartnered={loadingPartnered}
            selectedId={selected}
            onSelect={setProjectId}
            onClose={onClose}
          />

          <div className="space-y-3">
            <Label>Monitoring Service Plan</Label>
            <div className="grid grid-cols-2 gap-3">
              {MONITORING_SERVICES.map((svc) => (
                <div
                  key={svc.id}
                  onClick={() => setServiceType(svc.id)}
                  className={cn(
                    'relative flex cursor-pointer flex-col rounded-lg border p-4 hover:border-primary/50 transition-colors',
                    serviceType === svc.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{svc.label}</span>
                    <ServiceRadioIndicator selected={serviceType === svc.id} />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{svc.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Preferred Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message to Verifier &amp; Owner</Label>
            <Textarea
              id="message"
              placeholder="Provide any additional context or requirements..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none h-20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !projectId || !serviceType}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Request...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ProjectSelectorProps {
  activeTab: string;
  onTabChange: (v: string) => void;
  savedProjects: Project[];
  partneredProjects: Project[];
  loadingSaved: boolean;
  loadingPartnered: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function ProjectSelector({
  activeTab,
  onTabChange,
  savedProjects,
  partneredProjects,
  loadingSaved,
  loadingPartnered,
  selectedId,
  onSelect,
  onClose,
}: ProjectSelectorProps) {
  const renderCard = (project: Project) => {
    const isSelected = selectedId === project.id;
    return (
      <div
        key={project.id}
        onClick={() => onSelect(project.id)}
        className={cn(
          'relative flex cursor-pointer rounded-lg border hover:border-primary/50 transition-colors overflow-hidden',
          isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'
        )}
      >
        <div className="w-20 h-20 shrink-0 bg-muted overflow-hidden">
          {project.cover_image_url ? (
            <img
              src={project.cover_image_url}
              alt={project.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <Globe className="h-6 w-6 text-primary/30" />
            </div>
          )}
        </div>
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium text-sm leading-tight line-clamp-1">{project.name}</span>
            {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {PROJECT_TYPE_LABELS[project.project_type as keyof typeof PROJECT_TYPE_LABELS] ||
                project.project_type}
            </Badge>
            <Badge
              variant="secondary"
              className={cn('text-[10px] px-1.5 py-0', statusColor(project.status as ProjectStatus))}
            >
              {project.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
            {project.location_name ? (
              <span className="flex items-center gap-0.5 line-clamp-1">
                <MapPin className="h-3 w-3 shrink-0" /> {project.location_name}
              </span>
            ) : null}
            {project.area_hectares ? (
              <span>{project.area_hectares.toLocaleString()} ha</span>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="flex h-[180px] items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <Bookmark className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium mb-1">You have not saved any projects yet</p>
      <p className="text-xs text-muted-foreground mb-4 max-w-[250px]">
        Save projects from the Discovery Hub to request monitoring for them.
      </p>
      <Button asChild size="sm" variant="outline">
        <Link href="/dashboard/discover" onClick={onClose}>
          Explore Projects <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );

  const renderPartneredEmpty = () => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <FolderCheck className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium mb-1">No active partnerships</p>
      <p className="text-xs text-muted-foreground max-w-[250px]">
        Projects with active monitoring partnerships will appear here.
      </p>
    </div>
  );

  return (
    <div className="space-y-3">
      <Label>Select a Project</Label>
      <p className="text-xs text-muted-foreground -mt-1 mb-1">
        Choose a project to monitor.
      </p>

      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="w-full bg-muted/50">
          <TabsTrigger value="saved" className="flex-1 gap-1.5 text-xs">
            <Bookmark className="h-3.5 w-3.5" />
            Saved Projects
            {savedProjects.length > 0 ? (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                {savedProjects.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="partnered" className="flex-1 gap-1.5 text-xs">
            <FolderCheck className="h-3.5 w-3.5" />
            Partnered Projects
            {partneredProjects.length > 0 ? (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                {partneredProjects.length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-3">
          {loadingSaved ? (
            renderLoading()
          ) : savedProjects.length === 0 ? (
            renderEmpty()
          ) : (
            <ScrollArea className="h-[240px] rounded-md border p-2">
              <div className="grid gap-2">{savedProjects.map(renderCard)}</div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="partnered" className="mt-3">
          {loadingPartnered ? (
            renderLoading()
          ) : partneredProjects.length === 0 ? (
            renderPartneredEmpty()
          ) : (
            <ScrollArea className="h-[240px] rounded-md border p-2">
              <div className="grid gap-2">{partneredProjects.map(renderCard)}</div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
