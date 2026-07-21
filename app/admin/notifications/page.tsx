'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bell, Send, Users, ShieldCheck, Briefcase, Globe, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { sendNotification } from '@/lib/voc-services';

export default function NotificationsPage() {
  const [loading, setLoading] = React.useState(false);
  const [audience, setAudience] = React.useState('all');
  const [sentCount, setSentCount] = React.useState(0);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const message = formData.get('message') as string;

    if (!title || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Get target users based on audience
      let query = supabase.from('profiles').select('id');
      if (audience === 'owners') query = query.eq('role', 'project_owner');
      else if (audience === 'verifiers') query = query.eq('role', 'verifier');
      else if (audience === 'partners') query = query.eq('role', 'sustainability_partner');

      const { data: users, error: usersError } = await query;
      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        toast.warning('No users found in selected audience');
        setLoading(false);
        return;
      }

      // Insert notifications for each user
      for (const u of users) {
        await sendNotification({
          title,
          body: message,
          type: 'admin_broadcast',
          targetUserId: u.id,
        });
      }

      setSentCount(users.length);
      toast.success(`Notification sent to ${users.length} user${users.length > 1 ? 's' : ''}`);
      form.reset();
      setAudience('all');
    } catch (err: any) {
      toast.error(`Failed to send: ${err.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Broadcast Notifications</h1>
        <p className="text-sm text-muted-foreground">Send system-wide alerts and updates to user groups</p>
      </div>

      {sentCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-4">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <p className="text-sm">Last broadcast sent to {sentCount} users</p>
        </div>
      )}

      <Card>
        <form onSubmit={handleSend}>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Compose Message</CardTitle>
                <CardDescription>This message will appear in the users&apos; notification center</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Target Audience</Label>
              <RadioGroup value={audience} onValueChange={setAudience} className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="all" id="all" className="peer sr-only" />
                  <Label
                    htmlFor="all"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Globe className="mb-3 h-6 w-6" />
                    All Users
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="owners" id="owners" className="peer sr-only" />
                  <Label
                    htmlFor="owners"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Briefcase className="mb-3 h-6 w-6" />
                    Project Owners
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="verifiers" id="verifiers" className="peer sr-only" />
                  <Label
                    htmlFor="verifiers"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <ShieldCheck className="mb-3 h-6 w-6" />
                    Verifiers
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="partners" id="partners" className="peer sr-only" />
                  <Label
                    htmlFor="partners"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Users className="mb-3 h-6 w-6" />
                    Partners
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Notification Title</Label>
              <Input id="title" name="title" placeholder="e.g. Platform Maintenance Scheduled" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message Body</Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Type your message here..."
                className="min-h-[120px]"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="border-t border-border pt-6">
            <Button type="submit" disabled={loading} className="ml-auto w-32">
              {loading ? 'Sending...' : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
