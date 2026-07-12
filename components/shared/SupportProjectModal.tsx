'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
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
import { Loader2, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SupportProjectModalProps {
  projectId: string;
  projectName: string;
  ownerId: string;
  isOpen: boolean;
  onClose: () => void;
}

const MONITORING_SERVICES = [
  { id: 'monthly', label: 'Monthly Monitoring', description: 'Regular check-ins' },
  { id: 'quarterly', label: 'Quarterly Monitoring', description: 'Every 3 months' },
  { id: 'annual', label: 'Annual Monitoring', description: 'Yearly deep-dive' },
  { id: 'lifecycle', label: 'Full Lifecycle', description: 'Complete project span' },
];

export function SupportProjectModal({
  projectId,
  projectName,
  ownerId,
  isOpen,
  onClose,
}: SupportProjectModalProps) {
  const { user } = useAuth();
  const [verifiers, setVerifiers] = React.useState<Profile[]>([]);
  const [loadingVerifiers, setLoadingVerifiers] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [verifierId, setVerifierId] = React.useState('');
  const [serviceType, setServiceType] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [budget, setBudget] = React.useState('');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setVerifierId('');
      setServiceType('');
      setStartDate('');
      setBudget('');
      setMessage('');

      const fetchVerifiers = async () => {
        setLoadingVerifiers(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'verifier')
          .eq('approval_status', 'approved');
        if (!error && data) {
          setVerifiers(data as Profile[]);
        }
        setLoadingVerifiers(false);
      };
      fetchVerifiers();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifierId || !serviceType) {
      toast.error('Please select a monitoring organization and service type.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedVerifier = verifiers.find(v => v.id === verifierId);
      if (!selectedVerifier) throw new Error('Monitoring organization not found');

      const { error: partnershipError } = await supabase
        .from('project_partnerships')
        .insert({
          project_id: projectId,
          company_id: user?.id,
          owner_id: ownerId,
          verifier_id: verifierId,
          service_type: serviceType,
          start_date: startDate || null,
          budget_usd: budget ? parseFloat(budget) : null,
          message: message || null,
          status: 'pending_owner',
        });

      if (partnershipError) throw partnershipError;

      await supabase.from('project_activity').insert({
        project_id: projectId,
        actor_id: user?.id,
        event_type: 'support_requested',
        title: 'Support Requested',
        description: `Sustainability Partner requested monitoring partnership with ${selectedVerifier.full_name || selectedVerifier.organization || 'Verifier'} for ${projectName}.${message ? ` Message: ${message}` : ''}`,
      });

      await supabase.from('notifications').insert([
        {
          user_id: ownerId,
          title: 'New Support Request',
          body: `A Sustainability Partner wants to support ${projectName} and has selected ${selectedVerifier.full_name || selectedVerifier.organization || 'a monitoring organization'}.`,
          type: 'verification',
          link: `/dashboard/projects/${projectId}/monitoring`,
        },
        {
          user_id: verifierId,
          title: 'New Monitoring Partnership Request',
          body: `A Sustainability Partner has requested you to monitor ${projectName}.`,
          type: 'verification',
          link: `/dashboard/projects/${projectId}/monitoring`,
        },
      ]);

      toast.success('Support request sent. The project owner will review your monitoring organization selection.');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit support request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Support {projectName}</DialogTitle>
          <DialogDescription>
            Select a monitoring organization to oversee this project. The project owner will review and approve the partnership.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label>Monitoring Organization</Label>
            <p className="text-xs text-muted-foreground -mt-2 mb-2">Choose a verified monitoring organization for this project.</p>
            {loadingVerifiers ? (
              <div className="flex h-[150px] items-center justify-center rounded-md border border-dashed">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : verifiers.length === 0 ? (
              <div className="flex h-[150px] items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">No verified monitoring organizations available.</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px] rounded-md border p-2">
                <div className="grid gap-2">
                  {verifiers.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setVerifierId(v.id)}
                      className={cn(
                        "relative flex cursor-pointer rounded-lg border p-3 hover:border-primary/50 transition-colors",
                        verifierId === v.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-muted"
                      )}
                    >
                      <div className="flex flex-1 flex-col">
                        <span className="font-medium flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          {v.full_name || v.organization || 'Verifier'}
                        </span>
                        {v.organization && v.full_name && (
                          <span className="text-xs text-muted-foreground mt-1">{v.organization}</span>
                        )}
                        {v.state && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {v.state}{v.district ? `, ${v.district}` : ''}
                          </span>
                        )}
                      </div>
                      {verifierId === v.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="space-y-3">
            <Label>Monitoring Service Plan</Label>
            <div className="grid grid-cols-2 gap-3">
              {MONITORING_SERVICES.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setServiceType(service.id)}
                  className={cn(
                    "relative flex cursor-pointer flex-col rounded-lg border p-4 hover:border-primary/50 transition-colors",
                    serviceType === service.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-muted"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{service.label}</span>
                    <div className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border",
                      serviceType === service.id ? "border-primary" : "border-muted-foreground/30"
                    )}>
                      {serviceType === service.id && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{service.description}</span>
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
            <Label htmlFor="message">Message to Project Owner</Label>
            <Textarea
              id="message"
              placeholder="Explain why you're supporting this project and any requirements..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none h-20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !verifierId || !serviceType}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Support Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
