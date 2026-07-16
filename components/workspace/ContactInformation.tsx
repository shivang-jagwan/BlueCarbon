'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, Building2, MapPin, AlertCircle, ShieldCheck } from 'lucide-react';
import type { ProjectContact } from '@/lib/types';

interface ContactInformationProps {
  projectId: string;
  ownerProfile?: any;
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/60 last:border-b-0">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export function ContactInformation({ projectId, ownerProfile }: ContactInformationProps) {
  const [contact, setContact] = React.useState<ProjectContact | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [exists, setExists] = React.useState(false);

  React.useEffect(() => {
    supabase
      .from('project_contacts')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle()
      .then(({ data }: { data: any }) => {
        setContact(data as ProjectContact | null);
        setExists(!!data);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <Card className="p-6 shadow-sm border-border/60 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </Card>
    );
  }

  return (
    <Card className="p-6 shadow-sm border-border/60">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Contact Information
        </h2>
        <Badge variant="secondary" className="text-[10px]">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Read Only
        </Badge>
      </div>

      {!exists ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground max-w-[260px]">
            Contact information has not been set up yet. Contact details can be configured in Account
            Settings.
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          <ContactRow icon={User} label="Contact Person" value={contact?.contact_person} />
          <ContactRow icon={Phone} label="Phone Number" value={contact?.phone} />
          <ContactRow icon={Mail} label="Email" value={contact?.email} />
          <ContactRow icon={Building2} label="Organization" value={contact?.organization} />
          <ContactRow icon={MapPin} label="Address" value={contact?.address} />
          {(contact?.emergency_contact || contact?.emergency_phone) && (
            <div className="flex items-start gap-3 py-3">
              <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Emergency Contact</p>
                <p className="text-sm font-medium mt-0.5">
                  {contact?.emergency_contact}
                  {contact?.emergency_phone && `: ${contact.emergency_phone}`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
