import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, Activity, Trees, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MonitoringHistory({ reports, assignment, onViewReport }: { reports: any[]; assignment: any; onViewReport?: () => void }) {
  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <Activity className="h-10 w-10 mx-auto mb-4 opacity-30" />
        <h3 className="font-medium text-foreground mb-1">No History Available</h3>
        <p className="text-sm">No monthly monitoring visits have been logged yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Monitoring History</h2>
          <p className="text-sm text-muted-foreground">Chronological timeline of all monthly verification visits.</p>
        </div>
      </div>

      <div className="relative border-l border-border/50 ml-4 space-y-8 pb-8">
        {reports.map((report, index) => {
          const date = new Date(report.report_date);
          const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          const isLatest = index === 0;

          return (
            <div key={report.id} className="relative pl-8">
              <div className={cn("absolute -left-[5px] top-4 h-[10px] w-[10px] rounded-full border-2", isLatest ? "border-primary bg-white dark:bg-slate-900 ring-4 ring-primary/20" : "border-muted-foreground bg-muted-foreground")} />
              
              <Card className={cn("transition-colors hover:bg-muted/30", isLatest && "border-primary/50 shadow-sm")}>
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{monthYear} Visit</h4>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <ShieldCheck className="h-3 w-3" />
                          Lead: {report.lead_inspector || 'Unknown Inspector'}
                        </div>
                      </div>
                    </div>
                    <Badge variant={report.status === 'submitted' ? 'default' : 'secondary'} className={cn(report.status === 'submitted' && 'bg-green-600 hover:bg-green-700')}>
                      {report.status === 'submitted' ? 'Finalized' : 'Draft'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border/50 mb-4">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Health Score</div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-blue-500" />
                        <span className={cn(
                          Number(report.overall_health_score) >= 80 ? 'text-green-600' :
                          Number(report.overall_health_score) >= 50 ? 'text-amber-500' : 'text-red-500'
                        )}>
                          {report.overall_health_score || 0}/100
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Tree Count</div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <Trees className="h-3.5 w-3.5 text-green-500" />
                        {report.current_tree_count ? report.current_tree_count.toLocaleString() : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Carbon Gain</div>
                      <div className="font-semibold text-emerald-600">
                        {report.carbon_gain ? `+${report.carbon_gain}t` : '0t'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Risk Level</div>
                      <div className="font-semibold">
                        {report.risk_level || 'Unknown'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="default" size="sm" className="h-8" onClick={onViewReport}>
                      <FileText className="h-3.5 w-3.5 mr-2" /> View Report
                    </Button>
                    <Button variant="outline" size="sm" className="h-8">
                      <Download className="h-3.5 w-3.5 mr-2" /> Download PDF
                    </Button>
                    {!isLatest && (
                      <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">
                        <ArrowRightLeft className="h-3.5 w-3.5 mr-2" /> Compare
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
