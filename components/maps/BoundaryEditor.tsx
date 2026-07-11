import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const BoundaryEditorClient = dynamic(
  () => import('./BoundaryEditorClient').then((mod) => mod.BoundaryEditor),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />,
  }
);

export { BoundaryEditorClient as BoundaryEditor };
