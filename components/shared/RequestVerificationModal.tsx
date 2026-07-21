'use client';

import * as React from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { Project, VerificationRequestType, VerificationPriority } from '@/lib/types';

interface RequestVerificationModalProps {
  verifierId: string;
  verifierName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RequestVerificationModal({
  verifierId,
  verifierName,
  isOpen,
  onClose,
}: RequestVerificationModalProps) {
  const { user } = useAuth();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [projectId, setProjectId] = React.useState('');
  const [requestType, setRequestType] = React.useState<VerificationRequestType | ''>('');
  const [priority, setPriority] = React.useState<VerificationPriority>('medium');
  const [dueDate, setDueDate] = React.useState('');
  const [description, setDescription] = React.useState('');

  React.useEffect(() => {
    if (isOpen && user) {
      // Reset form
      setProjectId('');
      setRequestType('');
      setPriority('medium');
      setDueDate('');
      setDescription('');
      
      // Fetch projects
      const fetchProjects = async () => {
        setLoadingProjects(true);
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', user.id);
        
        if (!error && data) {
          setProjects(data as Project[]);
        }
        setLoadingProjects(false);
      };
      fetchProjects();
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !requestType) {
      toast.error('Please select a project and request type');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Insert verification request
      const { data: request, error: requestError } = await supabase
        .from('verification_service_requests')
        .insert({
          project_id: projectId,
          verifier_id: verifierId,
          request_type: requestType,
          priority,
          due_date: dueDate || null,
          description: description || null,
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // 2. Add activity to project_activity timeline
      await supabase.from('project_activity').insert({
        project_id: projectId,
        actor_id: user?.id,
        event_type: 'verification_requested',
        title: 'Verification Requested',
        description: `Requested ${requestType.replace('_', ' ')} verification from ${verifierName}`,
      });

      // 3. Send Notifications
      // Notification to Verifier
      await sendNotification({
        title: 'New verification request received.',
        body: `You have received a new ${requestType} verification request.`,
        type: 'verification',
        targetUserId: verifierId,
        link: '/dashboard/verification',
      });

      // Notification to Project Owner
      await sendNotification({
        title: 'Verification request successfully submitted.',
        body: `Your request to ${verifierName} was successfully submitted.`,
        type: 'verification',
        targetUserId: user?.id || '',
        link: `/dashboard/projects/${projectId}/verification`,
      });

      toast.success('Verification request submitted successfully.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Verification</DialogTitle>
          <DialogDescription>
            Send a verification request to {verifierName}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="project">Select Project</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={loadingProjects}>
              <SelectTrigger id="project">
                <SelectValue placeholder={loadingProjects ? "Loading..." : "Choose a project"} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
                {projects.length === 0 && !loadingProjects && (
                  <SelectItem value="none" disabled>No projects found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestType">Select Request Type</Label>
            <Select value={requestType} onValueChange={(val) => setRequestType(val as VerificationRequestType)}>
              <SelectTrigger id="requestType">
                <SelectValue placeholder="Choose type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="land">Land Verification</SelectItem>
                <SelectItem value="project">Project Verification</SelectItem>
                <SelectItem value="monthly">Monthly Monitoring</SelectItem>
                <SelectItem value="corporate">Corporate Verification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as VerificationPriority)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Preferred Due Date</Label>
              <Input 
                id="dueDate" 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide any additional context or requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !projectId || !requestType}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
