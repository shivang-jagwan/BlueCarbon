import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Maximize2, Ruler } from 'lucide-react';

interface MeasurementPanelProps {
  areaHa: number;
  perimeterKm: number;
}

export function MeasurementPanel({ areaHa, perimeterKm }: MeasurementPanelProps) {
  if (areaHa === 0 && perimeterKm === 0) {
    return null;
  }

  const areaSqm = areaHa * 10000;
  const areaAcres = areaHa * 2.47105;

  return (
    <Card className="flex flex-col gap-3 p-4 shadow-md bg-background/95 backdrop-blur-sm border-border">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Measurements</h4>
      
      <div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <Maximize2 className="h-3.5 w-3.5 text-primary" />
          Area
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl font-bold">{areaHa.toFixed(2)}</span>
          <span className="text-sm font-medium text-muted-foreground">ha</span>
        </div>
        <div className="text-[10px] text-muted-foreground/80 mt-0.5">
          {areaSqm.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² • {areaAcres.toFixed(2)} acres
        </div>
      </div>

      <div className="h-px w-full bg-border" />

      <div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <Ruler className="h-3.5 w-3.5 text-primary" />
          Perimeter
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl font-bold">{perimeterKm.toFixed(2)}</span>
          <span className="text-sm font-medium text-muted-foreground">km</span>
        </div>
        <div className="text-[10px] text-muted-foreground/80 mt-0.5">
          {(perimeterKm * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} m
        </div>
      </div>
    </Card>
  );
}
