import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Users, ShieldCheck, Activity, Award, CheckCircle2, Clock, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers/auth-provider';

export function OverviewTab({ assignment, reportCount }: { assignment: any; reportCount: number }) {
  const { profile } = useAuth();
  
  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Status</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-xl font-bold">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Next Visit Due</span>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-blue-500" />
                <span className="text-xl font-bold">
                  {assignment.next_monitoring_date ? new Date(assignment.next_monitoring_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Pending'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Reports</span>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                <span className="text-xl font-bold">{reportCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Carbon Passport</span>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                <span className="text-xl font-bold">Issued</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Project & Partner Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 border-b border-border/50 pb-3">
              <span className="text-muted-foreground">Project Name</span>
              <span className="font-medium text-right">{assignment.projects?.name}</span>
            </div>
            <div className="grid grid-cols-2 border-b border-border/50 pb-3">
              <span className="text-muted-foreground">Project Owner</span>
              <span className="font-medium text-right truncate" title={assignment.projects?.owner_id}>{assignment.projects?.owner_id?.substring(0, 12)}...</span>
            </div>
            <div className="grid grid-cols-2 border-b border-border/50 pb-3">
              <span className="text-muted-foreground">Monitoring Partner</span>
              <span className="font-medium text-right">{assignment.profiles?.full_name || assignment.profiles?.email}</span>
            </div>
            <div className="grid grid-cols-2 pb-1">
              <span className="text-muted-foreground">Lead Verifier</span>
              <span className="font-medium text-right">{profile?.full_name || 'Assigned Agent'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Verification & Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Verification Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 border-b border-border/50 pb-3">
              <span className="text-muted-foreground">Verification Date</span>
              <span className="font-medium text-right">01 Jan 2026</span>
            </div>
            <div className="grid grid-cols-2 border-b border-border/50 pb-3">
              <span className="text-muted-foreground">Service Level</span>
              <span className="font-medium text-right capitalize">{assignment.project_partnerships?.service_type || 'Standard'}</span>
            </div>
            <div className="grid grid-cols-2 border-b border-border/50 pb-3">
              <span className="text-muted-foreground">Last Monitoring Date</span>
              <span className="font-medium text-right">
                {reportCount > 0 ? 'Recently Updated' : 'None yet'}
              </span>
            </div>
            <div className="grid grid-cols-2 pb-1">
              <span className="text-muted-foreground">Monitoring Progress</span>
              <div className="flex items-center justify-end gap-2">
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-1/4" />
                </div>
                <span className="text-xs font-medium text-right">Cycle 1/12</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Visit Callout */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Upcoming Monitoring Visit</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Prepare required equipment and review the previous report before arriving on site.</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-white dark:bg-slate-900 px-3 py-1.5 whitespace-nowrap">
              Due: {assignment.next_monitoring_date ? new Date(assignment.next_monitoring_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : 'Next Month'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
