'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card } from '@/components/ui/card';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('approval_status, role')
          .eq('id', data.user.id)
          .maybeSingle();

        const autoApproved =
          profile?.role === 'project_owner' || profile?.role === 'sustainability_partner';

        if (profile?.approval_status === 'pending' && !autoApproved) {
          toast.info('Your account is pending approval.');
          router.push('/pending-approval?email=' + encodeURIComponent(values.email));
        } else if (profile?.approval_status === 'rejected' || profile?.approval_status === 'suspended') {
          toast.error('Your account has been ' + profile.approval_status + '. Contact support.');
        } else {
          toast.success('Welcome back!');
          if (profile?.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="p-8 shadow-soft">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to your CarbonRush AI workspace
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@organization.org" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                  </div>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign in'}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to CarbonRush?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">Create an account</Link>
        </p>
      </Card>
    </div>
  );
}
