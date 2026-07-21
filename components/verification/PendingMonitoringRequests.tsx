'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, MapPin, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getPendingMonitoringAssignments, acceptMonitoringAssignment, declineMonitoringAssignment, type MonitoringAssignment } from '@/lib/monitoring-services';
import { toast } from 'sonner';

export function PendingMonitoringRequests() {
  const { profile } = useAuth();
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!profile) return;
    
    async function load() {
      if (!profile) return;
      try {
        const data = await getPendingMonitoringAssignments(profile.id);
        setAssignments(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile]);

  const handleAccept = async (id: string) => {
    if (!profile) return;
    try {
      await acceptMonitoringAssignment(id, profile.full_name || 'Verifier');
      toast.success('Monitoring assignment accepted.');
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error('Failed to accept assignment');
    }
  };

  const handleDecline = async (id: string) => {
    if (!profile) return;
    try {
      await declineMonitoringAssignment(id, profile.full_name || 'Verifier');
      toast.success('Monitoring assignment declined.');
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      toast.error('Failed to decline assignment');
    }
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-muted rounded-xl" />;
  }

  if (assignments.length === 0) {
    return null; // Don't show the section if there are no pending requests
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Pending Monitoring Requests</h2>
        <Badge variant="secondary">{assignments.length} Pending</Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base line-clamp-1">{assignment.projects?.name}</CardTitle>
              <CardDescription className="line-clamp-1">
                Owner: {assignment.projects?.owner_id} {/* Ideally we'd join owner profile too */}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mr-2 shrink-0" />
                  <span className="truncate">{assignment.projects?.location_name || 'Unknown Location'}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Badge variant="outline" className="mr-2">Partner</Badge>
                  <span className="truncate">{assignment.profiles?.full_name || assignment.profiles?.email}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 mr-2 shrink-0" />
                  <span>{assignment.project_partnerships?.service_type} monitoring</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5 mr-2 shrink-0" />
                  <span>${assignment.project_partnerships?.budget_usd?.toLocaleString() || '0'} Budget</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 mr-2 shrink-0" />
                  <span>Requested: {new Date(assignment.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 mt-auto">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  onClick={() => handleAccept(assignment.id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accept
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => handleDecline(assignment.id)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
