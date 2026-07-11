'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
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
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        values.email,
        { redirectTo: `${window.location.origin}/login` }
      );
      if (error) throw error;
      setSent(true);
      toast.success('Password reset link sent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>

      <Card className="p-8 shadow-soft">
        {sent ? (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
              <MailCheck className="h-7 w-7" />
            </div>
            <h1 className="font-display text-xl font-semibold">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a password reset link to your email. Click the link to
              set a new password.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setSent(false)}
            >
              Try a different email
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="font-display text-2xl font-semibold">
                Reset password
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter your email and we will send you a reset link.
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
                        <Input
                          type="email"
                          placeholder="you@organization.org"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
}
