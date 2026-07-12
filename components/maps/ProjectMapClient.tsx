import * as React from 'react';
import { Source, Layer, MapRef } from 'react-map-gl/maplibre';
import * as turf from '@turf/turf';
import { MapViewer } from './MapViewer';
import { MeasurementPanel } from './MeasurementPanel';
import { CoordinatePanel } from './CoordinatePanel';
import type { GeoJSON } from '@/lib/types';

interface ProjectMapProps {
  geojson: GeoJSON.FeatureCollection | null;
  areaHa?: number | null;
  perimeterKm?: number | null;
  bbox?: number[] | null;
  center?: { lat: number; lng: number } | null;
  height?: string;
}

export function ProjectMap({ geojson, areaHa, perimeterKm, bbox, center, height = '500px' }: ProjectMapProps) {
  const mapRef = React.useRef<MapRef>(null);

  const calculatedArea = areaHa ?? (geojson && geojson.features.length > 0 ? turf.area(geojson as turf.AllGeoJSON)/10000 : 0);
  const calculatedPerim = perimeterKm ?? (geojson && geojson.features.length > 0 ? turf.length(geojson as GeoJSON.FeatureCollection, { units: 'kilometers' }) : 0);

  const computedCenter = React.useMemo(() => {
    if (center) return center;
    if (geojson && geojson.features.length > 0) {
      try {
        const pt = turf.center(geojson as turf.AllGeoJSON);
        return { lat: pt.geometry.coordinates[1], lng: pt.geometry.coordinates[0] };
      } catch {
        return null;
      }
    }
    return null;
  }, [geojson, center]);

  const computedBbox = React.useMemo(() => {
    if (bbox && bbox.length === 4) return bbox as [number, number, number, number];
    if (geojson && geojson.features.length > 0) {
      try {
        return turf.bbox(geojson as turf.AllGeoJSON) as [number, number, number, number];
      } catch {
        return null;
      }
    }
    return null;
  }, [geojson, bbox]);

  React.useEffect(() => {
    if (computedBbox && mapRef.current) {
      mapRef.current.fitBounds(computedBbox, { padding: 40, duration: 1000 });
    } else if (computedCenter && mapRef.current) {
      mapRef.current.flyTo({ center: [computedCenter.lng, computedCenter.lat], zoom: 14 });
    }
  }, [computedBbox, computedCenter]);

  return (
    <div style={{ height }} className="relative w-full">
      <MapViewer 
        mapRef={mapRef}
        interactive={true} 
      >
        {geojson && (
          <Source type="geojson" data={geojson as GeoJSON.FeatureCollection}>
            <Layer 
              id="project-fill" 
              type="fill" 
              paint={{
                'fill-color': '#3b82f6',
                'fill-opacity': 0.25
              }} 
            />
            <Layer 
              id="project-line" 
              type="line" 
              paint={{
                'line-color': '#3b82f6',
                'line-width': 2
              }} 
            />
          </Source>
        )}

        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
          <CoordinatePanel 
            lat={computedCenter?.lat || null}
            lng={computedCenter?.lng || null}
          />
        </div>
        
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
          {calculatedArea > 0 && (
            <MeasurementPanel 
              areaHa={calculatedArea}
              perimeterKm={calculatedPerim}
            />
          )}
        </div>
      </MapViewer>
    </div>
  );
}
