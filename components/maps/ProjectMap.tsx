import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ProjectMapClient = dynamic(
  () => import('./ProjectMapClient').then((mod) => mod.ProjectMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-lg" />,
  }
);

export { ProjectMapClient as ProjectMap };
