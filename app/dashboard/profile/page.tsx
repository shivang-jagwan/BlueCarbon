'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/shared/avatar-upload';
import { FileUpload } from '@/components/shared/FileUpload';
import {
  User, MapPin, Landmark, ShieldCheck, Save, Loader2, Building2, Leaf,
} from 'lucide-react';
import { getRoleLabel } from '@/lib/navigation';
import { INDUSTRIES, SUSTAINABILITY_FOCUS_AREAS } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [saving, setSaving] = React.useState(false);
  const [focusAreas, setFocusAreas] = React.useState<string[]>([]);

  const [form, setForm] = React.useState({
    full_name: '', mobile_number: '', bio: '', country: '', state: '', district: '',
    village: '', pin_code: '', bank_name: '', account_number: '', ifsc_code: '',
    upi_id: '', occupation: '', organization: '', experience: '', primary_activity: '',
    organization_type: '', registration_number: '', website: '', designation: '',
    office_address: '', industry: '', cin: '', gst: '', esg_goals: '',
    csr_objectives: '', net_zero_target_year: '', annual_csr_budget: '',
  });

  React.useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '', mobile_number: profile.mobile_number || '',
        bio: profile.bio || '', country: profile.country || '', state: profile.state || '',
        district: profile.district || '', village: profile.village || '', pin_code: profile.pin_code || '',
        bank_name: profile.bank_name || '', account_number: profile.account_number || '',
        ifsc_code: profile.ifsc_code || '', upi_id: profile.upi_id || '',
        occupation: profile.occupation || '', organization: profile.organization || '',
        experience: profile.experience || '', primary_activity: profile.primary_activity || '',
        organization_type: profile.organization_type || '', registration_number: profile.registration_number || '',
        website: profile.website || '', designation: profile.designation || '',
        office_address: profile.office_address || '', industry: profile.industry || '',
        cin: profile.cin || '', gst: profile.gst || '', esg_goals: profile.esg_goals || '',
        csr_objectives: profile.csr_objectives || '', net_zero_target_year: profile.net_zero_target_year?.toString() || '',
        annual_csr_budget: profile.annual_csr_budget?.toString() || '',
      });
      setFocusAreas(profile.sustainability_focus || []);
    }
  }, [profile]);

  const isPartner = profile?.role === 'sustainability_partner';
  const isVerifier = profile?.role === 'verifier';

  const handleSave = async () => {
    setSaving(true);
    try {
      const update: Record<string, unknown> = {
        full_name: form.full_name, mobile_number: form.mobile_number, bio: form.bio,
        country: form.country, state: form.state, district: form.district,
      };

      if (isPartner) {
        update.organization = form.organization;
        update.industry = form.industry;
        update.cin = form.cin;
        update.gst = form.gst;
        update.website = form.website;
        update.designation = form.designation;
        update.esg_goals = form.esg_goals;
        update.csr_objectives = form.csr_objectives;
        update.net_zero_target_year = form.net_zero_target_year ? parseInt(form.net_zero_target_year) : null;
        update.sustainability_focus = focusAreas;
        update.annual_csr_budget = form.annual_csr_budget ? parseFloat(form.annual_csr_budget) : null;
        update.office_address = form.office_address;
        update.pin_code = form.pin_code;
      } else if (isVerifier) {
        update.organization = form.organization;
        update.organization_type = form.organization_type;
        update.registration_number = form.registration_number;
        update.website = form.website;
        update.designation = form.designation;
        update.office_address = form.office_address;
        update.pin_code = form.pin_code;
      } else {
        update.village = form.village;
        update.pin_code = form.pin_code;
        update.bank_name = form.bank_name;
        update.account_number = form.account_number;
        update.ifsc_code = form.ifsc_code;
        update.upi_id = form.upi_id;
        update.occupation = form.occupation;
        update.organization = form.organization;
        update.experience = form.experience;
        update.primary_activity = form.primary_activity;
      }

      const { error } = await supabase.from('profiles').update(update).eq('id', user?.id);
      if (error) throw error;
      toast.success('Profile updated');
      refreshProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {isPartner ? 'Organization Profile' : 'Profile'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPartner ? 'Manage your organization and sustainability information' : 'Manage your personal information and account details'}
        </p>
      </div>

      {/* Profile Photo + Identity Header */}
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <AvatarUpload size="lg" />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-display text-lg font-semibold">{profile.full_name || 'User'}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
              <Badge variant="secondary">{getRoleLabel(profile.role)}</Badge>
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="h-3 w-3" />KYC: {profile.kyc_status}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Info */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2"><User className="h-4.5 w-4.5 text-primary" /><h2 className="font-semibold">Personal Information</h2></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Mobile Number</Label><Input value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} className="mt-1.5" /></div>
        </div>
        <div className="mt-4"><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1.5 min-h-20" placeholder="Tell us about yourself..." /></div>
      </Card>

      {/* Partner-specific fields */}
      {isPartner && (
        <>
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2"><Building2 className="h-4.5 w-4.5 text-primary" /><h2 className="font-semibold">Organization Information</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Company Name</Label><Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Industry</Label><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="mt-1.5" /></div>
              <div><Label>CIN</Label><Input value={form.cin} onChange={(e) => setForm({ ...form, cin: e.target.value })} className="mt-1.5" /></div>
              <div><Label>GST</Label><Input value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Designation</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="mt-1.5" /></div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2"><Leaf className="h-4.5 w-4.5 text-primary" /><h2 className="font-semibold">Sustainability Information</h2></div>
            <div className="space-y-4">
              <div><Label>ESG Goals</Label><Textarea value={form.esg_goals} onChange={(e) => setForm({ ...form, esg_goals: e.target.value })} className="mt-1.5 min-h-20" /></div>
              <div><Label>CSR Objectives</Label><Textarea value={form.csr_objectives} onChange={(e) => setForm({ ...form, csr_objectives: e.target.value })} className="mt-1.5 min-h-20" /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Net Zero Target Year</Label><Input type="number" value={form.net_zero_target_year} onChange={(e) => setForm({ ...form, net_zero_target_year: e.target.value })} className="mt-1.5" /></div>
                <div><Label>Annual CSR Budget (USD)</Label><Input type="number" value={form.annual_csr_budget} onChange={(e) => setForm({ ...form, annual_csr_budget: e.target.value })} className="mt-1.5" /></div>
              </div>
              <div>
                <Label>Sustainability Focus Areas</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {SUSTAINABILITY_FOCUS_AREAS.map((area) => {
                    const isSelected = focusAreas.includes(area);
                    return (
                      <button key={area} type="button" onClick={() => setFocusAreas((prev) => isSelected ? prev.filter((a) => a !== area) : [...prev, area])}
                        className={cn('flex items-center gap-3 rounded-lg border p-3 text-left text-sm font-medium transition-colors',
                          isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground')}>
                        <div className={cn('flex h-5 w-5 items-center justify-center rounded border-2', isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30')}>
                          {isSelected && <span className="text-xs">✓</span>}
                        </div>
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Address */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2"><MapPin className="h-4.5 w-4.5 text-primary" /><h2 className="font-semibold">Address</h2></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-1.5" /></div>
          <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="mt-1.5" /></div>
          <div><Label>{isPartner ? 'City' : 'District'}</Label><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="mt-1.5" /></div>
          {!isPartner && <div><Label>Village</Label><Input value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} className="mt-1.5" /></div>}
          <div><Label>PIN Code</Label><Input value={form.pin_code} onChange={(e) => setForm({ ...form, pin_code: e.target.value })} className="mt-1.5" /></div>
        </div>
      </Card>

      {/* Owner-specific bank details */}
      {!isPartner && !isVerifier && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2"><Landmark className="h-4.5 w-4.5 text-primary" /><h2 className="font-semibold">Bank Details</h2></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label>Bank Name</Label><Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} className="mt-1.5" /></div>
            <div><Label>Account Number</Label><Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} className="mt-1.5" /></div>
            <div><Label>IFSC Code</Label><Input value={form.ifsc_code} onChange={(e) => setForm({ ...form, ifsc_code: e.target.value })} className="mt-1.5" /></div>
            <div><Label>UPI ID</Label><Input value={form.upi_id} onChange={(e) => setForm({ ...form, upi_id: e.target.value })} className="mt-1.5" /></div>
          </div>
        </Card>
      )}

      {/* KYC Documents */}
      {profile.kyc_status !== 'verified' && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-4.5 w-4.5 text-primary" /><h2 className="font-semibold">KYC Documents</h2></div>
          <p className="mb-4 text-sm text-muted-foreground">Upload your identity verification documents to get your profile approved.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FileUpload
              bucket="profile-documents"
              category="aadhaar"
              label="Upload Aadhaar / ID"
              onUploadSuccess={() => {
                toast.success('Document uploaded');
              }}
            />
            <FileUpload
              bucket="profile-documents"
              category="passport_photo"
              label="Upload Passport Photo"
              onUploadSuccess={() => {
                toast.success('Document uploaded');
              }}
            />
          </div>
        </Card>
      )}

      <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Profile</>}
      </Button>
    </div>
  );
}
