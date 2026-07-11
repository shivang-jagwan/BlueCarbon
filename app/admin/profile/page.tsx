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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User, Save, Loader2, ShieldCheck, MapPin
} from 'lucide-react';
import { getRoleLabel } from '@/lib/navigation';

export default function AdminProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    full_name: '', mobile_number: '', bio: '', country: '', state: '', district: ''
  });

  React.useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '', 
        mobile_number: profile.mobile_number || '',
        bio: profile.bio || '', 
        country: profile.country || '', 
        state: profile.state || '',
        district: profile.district || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const update = {
        full_name: form.full_name, 
        mobile_number: form.mobile_number, 
        bio: form.bio,
        country: form.country, 
        state: form.state, 
        district: form.district,
      };

      const { error } = await supabase.from('profiles').update(update).eq('id', user?.id);
      if (error) throw error;
      toast.success('Admin profile updated');
      refreshProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  const initials = (profile.full_name || profile.email).split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Admin Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your personal information and administrative credentials</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-display text-lg font-semibold">{profile.full_name || 'Administrator'}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground">Platform Admin</Badge>
              <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" />Superuser Access</Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2"><User className="h-4.5 w-4.5 text-primary" /><h2 className="font-semibold">Personal Information</h2></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Mobile Number</Label><Input value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} className="mt-1.5" /></div>
        </div>
        <div className="mt-4"><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1.5 min-h-20" placeholder="Tell us about yourself..." /></div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2"><MapPin className="h-4.5 w-4.5 text-primary" /><h2 className="font-semibold">Location</h2></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="mt-1.5" /></div>
          <div><Label>State/Region</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="mt-1.5" /></div>
          <div><Label>City/District</Label><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="mt-1.5" /></div>
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Admin Profile</>}
      </Button>
    </div>
  );
}
