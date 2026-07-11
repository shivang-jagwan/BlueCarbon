'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save, ShieldAlert, Mail, Globe, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function SystemSettingsPage() {
  const [loading, setLoading] = React.useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('System settings updated successfully.');
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">Configure global platform behavior and integrations</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-4 bg-muted/50 p-1 w-full sm:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="general" className="rounded-sm gap-2"><Settings className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="email" className="rounded-sm gap-2"><Mail className="h-4 w-4" /> Email Templates</TabsTrigger>
          <TabsTrigger value="security" className="rounded-sm gap-2"><ShieldAlert className="h-4 w-4" /> Security & Access</TabsTrigger>
          <TabsTrigger value="system" className="rounded-sm gap-2"><Database className="h-4 w-4" /> Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="m-0 border-none space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Details</CardTitle>
              <CardDescription>Basic information about the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input id="platformName" defaultValue="CarbonRush AI" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input id="supportEmail" defaultValue="support@carbonrush.ai" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="platformUrl">Platform URL</Label>
                <Input id="platformUrl" defaultValue="https://app.carbonrush.ai" />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                    <Globe className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Button variant="outline" size="sm">Upload New Logo</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-6">
              <Button onClick={handleSave} disabled={loading} className="ml-auto w-32">
                {loading ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="m-0 border-none space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>Configure outgoing emails and templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Welcome Emails</Label>
                  <p className="text-sm text-muted-foreground">Send an automated welcome email on registration</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Approval Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notify users when their account or project is approved</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Reports</Label>
                  <p className="text-sm text-muted-foreground">Send weekly summaries to admins and project owners</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="m-0 border-none space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security & Roles</CardTitle>
              <CardDescription>Manage defaults and access restrictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-Approve Project Owners</Label>
                  <p className="text-sm text-muted-foreground">Automatically set Project Owner accounts to active</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-Approve Verifiers</Label>
                  <p className="text-sm text-muted-foreground">Automatically set Verifier accounts to active</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (Minutes)</Label>
                <Input id="sessionTimeout" type="number" defaultValue="60" className="max-w-[200px]" />
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-6">
              <Button onClick={handleSave} disabled={loading} className="ml-auto w-32">
                {loading ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="m-0 border-none space-y-4">
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Critical system operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="space-y-0.5">
                  <Label className="text-base text-destructive font-semibold">Maintenance Mode</Label>
                  <p className="text-sm text-destructive/80">Disable access for all non-admin users across the platform.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
