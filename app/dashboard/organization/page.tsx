'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
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
import { Save, Loader2, Building2, Briefcase, Clock } from 'lucide-react';
import { ORGANIZATION_TYPES, VERIFICATION_SERVICES } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function OrganizationEditPage() {
  const { profile, user, refreshProfile } = useAuth();
  const router = useRouter();

  // Verifiers: redirect to full agency profile editor
  React.useEffect(() => {
    if (profile?.role === 'verifier') {
      let cancelled = false;
      (async () => {
        const { data } = await supabase
          .from('verification_agencies')
          .select('id')
          .eq('profile_id', profile.id)
          .single();
        if (!cancelled && data) {
          router.replace(`/dashboard/verification-agencies/${data.id}/edit`);
        }
      })();
      return () => { cancelled = true; };
    }
  }, [profile, router]);

  if (profile?.role === 'verifier') {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading agency profile...</p>
        </div>
      </div>
    );
  }

  const [saving, setSaving] = React.useState(false);
  const [services, setServices] = React.useState<string[]>([]);

  const [form, setForm] = React.useState({
    organization: '',
    organization_type: '',
    registration_number: '',
    website: '',
    designation: '',
    bio: '',
    office_address: '',
    country: '',
    state: '',
    district: '',
    pin_code: '',
    mobile_number: '',
    phone: '',
    availability_status: 'accepting',
  });

  React.useEffect(() => {
    if (profile) {
      setForm({
        organization: profile.organization || '',
        organization_type: profile.organization_type || '',
        registration_number: profile.registration_number || '',
        website: profile.website || '',
        designation: profile.designation || '',
        bio: profile.bio || '',
        office_address: profile.office_address || '',
        country: profile.country || '',
        state: profile.state || '',
        district: profile.district || '',
        pin_code: profile.pin_code || '',
        mobile_number: profile.mobile_number || '',
        phone: profile.phone || '',
        availability_status: profile.availability_status || 'accepting',
      });
      setServices(profile.services_offered || []);
    }
  }, [profile]);

  const toggleService = (service: string) => {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          organization: form.organization,
          organization_type: form.organization_type,
          registration_number: form.registration_number,
          website: form.website || null,
          designation: form.designation,
          bio: form.bio,
          office_address: form.office_address,
          country: form.country,
          state: form.state,
          district: form.district,
          pin_code: form.pin_code,
          mobile_number: form.mobile_number,
          phone: form.phone,
          services_offered: services,
          availability_status: form.availability_status,
        })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success('Organization profile updated');
      refreshProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Organization Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your organization information, services, and availability
        </p>
      </div>

      {/* Organization Info */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-4.5 w-4.5 text-primary" />
          <h2 className="font-semibold">Organization Information</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Organization Name</Label>
            <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label>Organization Type</Label>
            <Select value={form.organization_type} onValueChange={(v) => setForm({ ...form, organization_type: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {ORGANIZATION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Registration Number</Label>
            <Input value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label>Website</Label>
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="mt-1.5" />
          </div>
        </div>
        <div className="mt-4">
          <Label>About / Bio</Label>
          <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1.5 min-h-20" placeholder="Describe your organization..." />
        </div>
      </Card>

      {/* Services */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Briefcase className="h-4.5 w-4.5 text-primary" />
          <h2 className="font-semibold">Services Offered</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {VERIFICATION_SERVICES.map((service) => {
            const isSelected = services.includes(service);
            return (
              <button
                key={service}
                type="button"
                onClick={() => toggleService(service)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 text-left text-sm font-medium transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                <div className={cn(
                  'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                  isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                )}>
                  {isSelected && <span className="text-xs">✓</span>}
                </div>
                {service}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Availability */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-4.5 w-4.5 text-primary" />
          <h2 className="font-semibold">Availability</h2>
        </div>
        <Select value={form.availability_status} onValueChange={(v) => setForm({ ...form, availability_status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="accepting">Accepting new projects</SelectItem>
            <SelectItem value="limited">Limited availability</SelectItem>
            <SelectItem value="unavailable">Currently unavailable</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Contact */}
      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Contact Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label>Mobile</Label>
            <Input value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} className="mt-1.5" />
          </div>
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Organization Profile
          </>
        )}
      </Button>
    </div>
  );
}
