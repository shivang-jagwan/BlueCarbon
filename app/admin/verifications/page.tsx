'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ShieldCheck, UserPlus, FileCheck, CheckCircle2, XCircle, ExternalLink, Calendar as CalendarIcon, User as UserIcon, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

type VerificationRequest = {
  id: string;
  status: string;
  created_at: string;
  project_id: string;
  verifier_id: string | null;
  projects: {
    name: string;
    profiles: {
      full_name: string | null;
      organization: string | null;
    } | null;
  } | null;
  verifier: {
    full_name: string | null;
    organization: string | null;
  } | null;
};

export default function VerificationRequestsPage() {
  const [requests, setRequests] = React.useState<VerificationRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    // Note: Due to complex joins, we fetch everything needed
    const { data, error } = await supabase
      .from('verification_requests')
      .select(`
        id, 
        status, 
        created_at,
        project_id,
        verifier_id,
        projects (
          name,
          profiles:owner_id (
            full_name,
            organization
          )
        ),
        verifier:verifier_id (
          full_name,
          organization
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load verifications: ' + error.message);
    } else {
      setRequests(data as unknown as VerificationRequest[]);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusUpdate = async (reqId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('verification_requests')
        .update({ status: newStatus })
        .eq('id', reqId);
      if (error) throw error;
      toast.success('Status updated');
      fetchRequests();
    } catch (e: any) {
      toast.error('Failed to update status');
    }
  };

  const renderTable = (typeFilter: string) => {
    // Currently all requests from DB are considered 'project' type since we don't have a type column
    const filtered = typeFilter === 'all' 
      ? requests 
      : requests.filter(r => (typeFilter === 'project'));

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Verifier</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-48 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="mb-2 h-6 w-6 animate-spin" />
                  Loading requests...
                </div>
              </TableCell>
            </TableRow>
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No requests found in this category.
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((req) => {
              // Extract names safely
              const projName = req.projects?.name || 'Unknown Project';
              // owner_id relation can be a single object or array depending on schema, assume single object for simplicity
              const ownerProfile: any = req.projects?.profiles;
              const ownerName = ownerProfile ? (ownerProfile.organization || ownerProfile.full_name || 'Unknown Owner') : 'Unknown Owner';
              const verifierName = req.verifier ? (req.verifier.organization || req.verifier.full_name || 'Unknown Verifier') : 'Unassigned';
              const priority = 'Medium'; // Mock priority

              return (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{projName}</span>
                      <span className="text-xs text-muted-foreground">{req.id.substring(0, 8)}...</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{ownerName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {req.verifier_id == null ? (
                      <Badge variant="outline" className="text-muted-foreground border-dashed">Unassigned</Badge>
                    ) : (
                      <span className="text-sm">{verifierName}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-warning/10 text-warning hover:bg-warning/20">
                      MEDIUM
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{req.created_at ? format(new Date(req.created_at), 'MMM d, yyyy') : 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={
                        req.status === 'pending' ? 'border-warning/50 text-warning' : 
                        req.status === 'in_review' ? 'border-blue-500/50 text-blue-500' : 
                        req.status === 'approved' ? 'border-success/50 text-success' : 
                        'border-orange-500/50 text-orange-500'
                      }
                    >
                      {req.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {req.verifier_id == null && (
                          <DropdownMenuItem><UserPlus className="mr-2 h-4 w-4" /> Assign Verifier</DropdownMenuItem>
                        )}
                        <DropdownMenuItem><ExternalLink className="mr-2 h-4 w-4" /> Open Workspace</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-success" onClick={() => handleStatusUpdate(req.id, 'approved')}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleStatusUpdate(req.id, 'rejected')}>
                          <XCircle className="mr-2 h-4 w-4" /> Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Verification Requests</h1>
          <p className="text-sm text-muted-foreground">Unified inbox for all platform verifications and monitoring</p>
        </div>
        <Button variant="outline" onClick={fetchRequests}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4 bg-muted/50 p-1">
          <TabsTrigger value="all" className="rounded-sm">All Requests</TabsTrigger>
          <TabsTrigger value="land" className="rounded-sm">Land Verification</TabsTrigger>
          <TabsTrigger value="project" className="rounded-sm">Project Verification</TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-sm">Monthly Monitoring</TabsTrigger>
          <TabsTrigger value="corporate" className="rounded-sm">Corporate</TabsTrigger>
        </TabsList>
        
        <Card>
          <CardContent className="p-0">
            <TabsContent value="all" className="m-0 border-none">{renderTable('all')}</TabsContent>
            <TabsContent value="land" className="m-0 border-none">{renderTable('land')}</TabsContent>
            <TabsContent value="project" className="m-0 border-none">{renderTable('project')}</TabsContent>
            <TabsContent value="monthly" className="m-0 border-none">{renderTable('monthly')}</TabsContent>
            <TabsContent value="corporate" className="m-0 border-none">{renderTable('corporate')}</TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
