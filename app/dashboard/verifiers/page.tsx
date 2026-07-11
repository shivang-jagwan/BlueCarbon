'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  Star,
  ShieldCheck,
  Award,
  Users,
  MapPin,
  Clock,
  Building2,
} from 'lucide-react';
import type { Profile } from '@/lib/types';

export default function VerifiersPage() {
  const [verifiers, setVerifiers] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'verifier')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });
      setVerifiers((data as Profile[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = verifiers.filter((v) =>
    (v.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.organization || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Verifier Directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse approved NGOs and verification organizations
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search verifiers by name or organization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No verifiers found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? 'Try a different search' : 'No approved verifiers are available yet'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((verifier) => {
            const initials = (verifier.full_name || verifier.email)
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            return (
              <Card key={verifier.id} className="p-5 transition-all hover:shadow-soft-lg">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold leading-tight">{verifier.full_name || 'Verifier'}</h3>
                    {verifier.organization && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{verifier.organization}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1">
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </Badge>
                    </div>
                  </div>
                </div>

                {verifier.bio && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{verifier.bio}</p>
                )}

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {verifier.country || '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-warning" />
                    New
                  </span>
                </div>

                <Button variant="outline" size="sm" className="mt-4 w-full">
                  Request Verification
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
