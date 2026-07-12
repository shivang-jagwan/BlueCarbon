'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Bell, Lock, Moon, Sun, LogOut, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

export default function SettingsPage() {
  const { signOut, user, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [changingPassword, setChangingPassword] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [notifEmail, setNotifEmail] = React.useState(true);
  const [notifPush, setNotifPush] = React.useState(true);

  React.useEffect(() => {
    if (user) {
      supabase.from('profiles').select('full_name, phone').eq('id', user.id).single().then(({ data }: { data: any }) => {
        if (data) {
          setFullName(data.full_name || '');
          setPhone(data.phone || '');
        }
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Profile updated');
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated');
      setPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    }
    setChangingPassword(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your preferences, security, and account
        </p>
      </div>

      {/* Profile */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-4.5 w-4.5 text-primary" />
          <h2 className="font-semibold">Profile</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Profile
          </Button>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Moon className="h-4.5 w-4.5 text-primary" />
          <h2 className="font-semibold">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">Choose light or dark mode</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <Button
              variant={theme === 'light' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTheme('light')}
            >
              <Sun className="mr-1.5 h-3.5 w-3.5" />
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTheme('dark')}
            >
              <Moon className="mr-1.5 h-3.5 w-3.5" />
              Dark
            </Button>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-4.5 w-4.5 text-primary" />
          <h2 className="font-semibold">Notification Preferences</h2>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between text-sm">
            <span>Email notifications</span>
            <input
              type="checkbox"
              checked={notifEmail}
              onChange={(e) => setNotifEmail(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>Push notifications</span>
            <input
              type="checkbox"
              checked={notifPush}
              onChange={(e) => setNotifPush(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
          </label>
        </div>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4.5 w-4.5 text-primary" />
          <h2 className="font-semibold">Security</h2>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <Button variant="outline" onClick={handleChangePassword} disabled={changingPassword}>
            {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Change Password
          </Button>
          <Button variant="outline" disabled className="text-muted-foreground">
            Two-Factor Authentication (Coming Soon)
          </Button>
        </div>
      </Card>

      {/* Account */}
      <Card className="border-destructive/30 p-6">
        <h2 className="mb-4 font-semibold text-destructive">Account</h2>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            disabled
          >
            Delete Account (Contact Support)
          </Button>
        </div>
      </Card>
    </div>
  );
}
