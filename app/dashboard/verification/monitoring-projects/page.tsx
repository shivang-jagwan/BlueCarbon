'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Clock, MapPin, Calendar, FileText, ExternalLink } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getAcceptedMonitoringAssignments } from '@/lib/monitoring-services';

export default function MonitoringProjectsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [assignments, setAssignments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!profile) return;
    
    async function load() {
      if (!profile) return;
      try {
        const data = await getAcceptedMonitoringAssignments(profile.id);
        setAssignments(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile]);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Lifecycle Monitoring Center
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your active monthly monitoring assignments.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-48 bg-muted rounded-xl" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
          <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No active monitoring projects.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => {
            const nextDue = assignment.next_monitoring_date ? new Date(assignment.next_monitoring_date).toLocaleDateString() : 'Pending';
            
            return (
            <Card key={assignment.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base line-clamp-1">{assignment.projects?.name}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      Owner: {assignment.projects?.owner_id}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mr-2 shrink-0" />
                    <span className="truncate">{assignment.projects?.location_name || 'Unknown Location'}</span>
                  </div>
                  
                  <div className="pt-2 border-t mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Next Due Date:</span>
                      <span className="font-medium">{nextDue}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 mt-auto">
                  <Button 
                    className="w-full bg-primary" 
                    onClick={() => router.push(`/dashboard/verification/monitoring-projects/${assignment.id}`)}
                  >
                    Open Workspace
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}
    </div>
  );
}
