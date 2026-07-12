'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Star, Clock, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

export default function OrganizationManagementPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['verifier', 'sustainability_partner'])
        .order('created_at', { ascending: false });
      setProfiles((data as Profile[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = profiles.filter((p) =>
    (p.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.organization || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const verifiers = filtered.filter((p) => p.role === 'verifier');
  const partners = filtered.filter((p) => p.role === 'sustainability_partner');

  const renderTable = (orgs: Profile[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Organization</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              <Clock className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
            </TableCell>
          </TableRow>
        ) : orgs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-32 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Building2 className="h-8 w-8 opacity-40" />
                <p className="text-sm font-medium">No organizations found</p>
                <p className="text-xs">Organizations will appear here once verifiers and partners register</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          orgs.map((org) => (
            <TableRow key={org.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{org.full_name || org.organization || 'Unnamed'}</span>
                  <span className="text-xs text-muted-foreground">{org.organization || '—'}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{org.email}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium">{org.rating ? org.rating.toFixed(1) : '—'}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={
                    org.approval_status === 'approved' ? 'bg-success/10 text-success' :
                    org.approval_status === 'pending' ? 'bg-warning/10 text-warning' :
                    'bg-destructive/10 text-destructive'
                  }
                >
                  {org.approval_status.charAt(0).toUpperCase() + org.approval_status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{new Date(org.created_at).toLocaleDateString()}</span>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Organizations</h1>
        <p className="text-sm text-muted-foreground">Manage Verifiers and Sustainability Partners</p>
      </div>

      <div className="flex max-w-sm relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search organizations..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="verifier" className="w-full">
        <TabsList className="mb-4 bg-muted/50 p-1">
          <TabsTrigger value="verifier" className="rounded-sm">Verifiers ({verifiers.length})</TabsTrigger>
          <TabsTrigger value="partner" className="rounded-sm">Sustainability Partners ({partners.length})</TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="p-0">
            <TabsContent value="verifier" className="m-0 border-none">{renderTable(verifiers)}</TabsContent>
            <TabsContent value="partner" className="m-0 border-none">{renderTable(partners)}</TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
