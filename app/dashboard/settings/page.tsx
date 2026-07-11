'use client';

import * as React from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Bell, Lock, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = React.useState('en');
  const [notifEmail, setNotifEmail] = React.useState(true);
  const [notifPush, setNotifPush] = React.useState(true);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your preferences, security, and account
        </p>
      </div>

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

      {/* Language */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-4.5 w-4.5 text-primary" />
          <h2 className="font-semibold">Language & Region</h2>
        </div>
        <div>
          <Label>Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">Hindi</SelectItem>
              <SelectItem value="id">Bahasa Indonesia</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
            </SelectContent>
          </Select>
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
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Two-Factor Authentication
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
            onClick={() => toast.info('Contact support to delete your account')}
          >
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
