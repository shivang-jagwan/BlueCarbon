'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MapMarker {
  lat: number;
  lng: number;
  status: string;
  type: string;
}

interface EvidenceMapProps {
  markers: MapMarker[];
  projectCenter?: { lat: number; lng: number } | null;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  valid: '#22c55e',
  warning: '#f59e0b',
  rejected: '#ef4444',
  pending: '#94a3b8',
};

export function EvidenceMap({ markers, projectCenter, className }: EvidenceMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<unknown>(null);

  React.useEffect(() => {
    if (!mapContainerRef.current || markers.length === 0) return;

    const initMap = async () => {
      const maplibregl = await import('maplibre-gl');

      const defaultCenter = projectCenter
        ? [projectCenter.lng, projectCenter.lat] as [number, number]
        : markers.length > 0
        ? [markers[0].lng, markers[0].lat] as [number, number]
        : [78.9, 20.6] as [number, number];

      const m = new maplibregl.Map({
        container: mapContainerRef.current!,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`,
        center: defaultCenter,
        zoom: 12,
      });

      // Add markers
      for (const marker of markers) {
        const color = STATUS_COLORS[marker.status] || STATUS_COLORS.pending;

        const el = document.createElement('div');
        el.style.cssText = `
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${color};
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          cursor: pointer;
        `;

        const popup = new maplibregl.Popup({ offset: 15 }).setHTML(
          `<div style="padding: 4px 8px; font-size: 12px;">
            <strong>${marker.type.replace('_', ' ')}</strong><br/>
            Status: ${marker.status}<br/>
            ${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}
          </div>`
        );

        new maplibregl.Marker({ element: el })
          .setLngLat([marker.lng, marker.lat])
          .setPopup(popup)
          .addTo(m);
      }

      // Fit bounds
      if (markers.length > 1) {
        const bounds = new maplibregl.LngLatBounds();
        for (const marker of markers) {
          bounds.extend([marker.lng, marker.lat]);
        }
        m.fitBounds(bounds, { padding: 40 });
      }

      mapRef.current = m;
    };

    initMap();

    return () => {
      const current = mapRef.current;
      if (current && typeof (current as { remove: () => void }).remove === 'function') {
        (current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, [markers, projectCenter]);

  if (markers.length === 0) {
    return (
      <Card className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <p className="text-sm text-muted-foreground">No GPS-tagged evidence to display on map</p>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <p className="text-sm font-medium">Evidence Locations</p>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-success" /> Valid
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" /> Warning
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-destructive" /> Rejected
          </span>
        </div>
      </div>
      <div ref={mapContainerRef} className="h-[300px] w-full" />
    </Card>
  );
}
