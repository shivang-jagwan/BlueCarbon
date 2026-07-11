import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const MapViewerClient = dynamic(
  () => import('./MapViewerClient').then((mod) => mod.MapViewer),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-lg" />,
  }
);

export { MapViewerClient as MapViewer };
