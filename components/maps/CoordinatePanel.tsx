import * as React from 'react';
import { MapPin } from 'lucide-react';

interface CoordinatePanelProps {
  lat: number | null;
  lng: number | null;
  cursorLat?: number;
  cursorLng?: number;
}

export function CoordinatePanel({ lat, lng, cursorLat, cursorLng }: CoordinatePanelProps) {
  const displayLat = cursorLat ?? lat;
  const displayLng = cursorLng ?? lng;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-background/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur-sm border border-border">
      <div className="flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium text-muted-foreground">Lat:</span>
        <span className="font-mono">{displayLat ? displayLat.toFixed(5) : '---'}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-muted-foreground">Lng:</span>
        <span className="font-mono">{displayLng ? displayLng.toFixed(5) : '---'}</span>
      </div>
    </div>
  );
}
