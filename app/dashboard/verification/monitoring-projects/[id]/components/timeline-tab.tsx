'use client';

import * as React from 'react';
import { getActivityForProject } from '@/lib/voc-services';
import { Loader2 } from 'lucide-react';
import { ActivityTab } from '../../../workspace/[id]/components/activity-tab';

export function TimelineTab({ projectId }: { projectId: string }) {
  const [activities, setActivities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const data = await getActivityForProject(projectId);
      setActivities(data || []);
      setLoading(false);
    }
    load();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <ActivityTab activities={activities} />;
}

