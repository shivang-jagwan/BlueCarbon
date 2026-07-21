'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, LayoutDashboard, ClipboardSignature, History, Image as ImageIcon, Activity, FileText, Award, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { getMonitoringAssignment, getMonitoringReports } from '@/lib/monitoring-services';
import { OverviewTab } from './components/overview-tab';
import { ReportsTab } from './components/reports-tab';
import { MediaTab } from './components/media-tab';
import { TimelineTab } from './components/timeline-tab';
import { MonitoringWizard } from './components/monitoring-wizard';
import { MonitoringHistory } from './components/monitoring-history';
import { MonitoringAnalytics } from './components/monitoring-analytics';

type TabId = 'overview' | 'monthly_monitoring' | 'history' | 'media' | 'timeline' | 'reports' | 'records' | 'analytics';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'monthly_monitoring', label: 'Monthly Monitoring', icon: ClipboardSignature },
  { id: 'history', label: 'Monitoring History', icon: History },
  { id: 'media', label: 'Media Gallery', icon: ImageIcon },
  { id: 'timeline', label: 'Timeline', icon: Activity },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'records', label: 'Official Records', icon: Award },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function MonitoringPortalPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;
  const { profile } = useAuth();

  const [assignment, setAssignment] = React.useState<any>(null);
  const [reports, setReports] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState<TabId>('monthly_monitoring');
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    try {
      const data = await getMonitoringAssignment(assignmentId);
      setAssignment(data);
      if (data) {
        const rpts = await getMonitoringReports(assignmentId);
        setReports(rpts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Monitoring assignment not found.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push('/dashboard/verification/monitoring-projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] -m-6 bg-slate-50/50 dark:bg-slate-950/50">
      {/* Sidebar Portal Navigation */}
      <div className="w-64 border-r border-border bg-white dark:bg-slate-900 flex flex-col">
        <div className="p-4 border-b border-border">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/verification/monitoring-projects')} className="mb-4 h-8 px-2 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-600 border-green-200">
              ACTIVE MONITORING
            </Badge>
          </div>
          <h1 className="font-semibold text-sm line-clamp-2 leading-tight">
            {assignment.projects?.name}
          </h1>
          <p className="text-[10px] text-muted-foreground mt-1 truncate">
            ID: {assignment.project_id.split('-')[0]}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              VOC Portal
            </p>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
          {activeTab === 'overview' && <OverviewTab assignment={assignment} reportCount={reports.length} />}
          {activeTab === 'monthly_monitoring' && <MonitoringWizard assignment={assignment} onComplete={loadData} />}
          {activeTab === 'history' && <MonitoringHistory reports={reports} assignment={assignment} />}
          {activeTab === 'media' && <MediaTab projectId={assignment.project_id} />}
          {activeTab === 'timeline' && <TimelineTab projectId={assignment.project_id} />}
          {activeTab === 'reports' && <ReportsTab assignment={assignment} reports={reports} onReload={loadData} />}
          {activeTab === 'records' && (
             <div className="text-center py-20 text-muted-foreground border rounded-xl border-dashed bg-white dark:bg-slate-900">
               <Award className="h-10 w-10 mx-auto mb-4 opacity-50 text-primary" />
               <h3 className="font-medium text-foreground mb-1">Official Verification Records</h3>
               <p className="text-sm">Access immutable Verification Certificates and Passports.</p>
             </div>
          )}
          {activeTab === 'analytics' && <MonitoringAnalytics reports={reports} />}
        </div>
      </div>
    </div>
  );
}
