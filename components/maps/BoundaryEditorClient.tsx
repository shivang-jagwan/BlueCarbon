import * as React from 'react';
import { Source, Layer, MapRef, MapMouseEvent } from 'react-map-gl/maplibre';
import * as turf from '@turf/turf';
import { MapViewer } from './MapViewer';
import { MapToolbar } from './MapToolbar';
import { MeasurementPanel } from './MeasurementPanel';
import { CoordinatePanel } from './CoordinatePanel';
import type { GeoJSON } from '@/lib/types';
import { toast } from 'sonner';

interface BoundaryEditorProps {
  geojson: GeoJSON.FeatureCollection | null;
  onChange: (
    geojson: GeoJSON.FeatureCollection | null,
    areaHa: number,
    perimeterKm: number,
    center: { lat: number; lng: number } | null,
    bbox: number[] | null
  ) => void;
  height?: string;
}

export function BoundaryEditor({ geojson, onChange, height = '500px' }: BoundaryEditorProps) {
  const mapRef = React.useRef<MapRef>(null);
  const [mode, setMode] = React.useState<'view' | 'draw' | 'edit'>('view');
  const [points, setPoints] = React.useState<number[][]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [cursorPos, setCursorPos] = React.useState<{ lat: number; lng: number } | null>(null);

  // Initialize from existing geojson
  React.useEffect(() => {
    if (geojson && geojson.features.length > 0) {
      const feature = geojson.features[0];
      if (feature.geometry.type === 'Polygon') {
        const coords = feature.geometry.coordinates[0];
        // Turf/GeoJSON stores [lng, lat], our points state also stores [lng, lat]
        if (coords.length > 0) {
          // Exclude the last closing point to allow editing easily, or keep it if we only replace it on clear
          setPoints(coords.slice(0, -1));
          
          // Fit bounds
          try {
             const bbox = turf.bbox(geojson as turf.AllGeoJSON);
             if (mapRef.current) {
                mapRef.current.fitBounds([bbox[0], bbox[1], bbox[2], bbox[3]], { padding: 40, duration: 1000 });
             }
           } catch(e) {
              // Malformed geometry — skip fit bounds
           }
        }
      }
    }
  }, []); // Only on mount

  const updateParent = React.useCallback((currentPoints: number[][]) => {
    if (currentPoints.length >= 3) {
      const closedPoints = [...currentPoints, currentPoints[0]];
      const polygon = turf.polygon([closedPoints]);
      
      const areaSqm = turf.area(polygon);
      const areaHa = areaSqm / 10000;
      
      const perimeterKm = turf.length(polygon, { units: 'kilometers' });
      
      const centerPt = turf.center(polygon);
      const center = { lat: centerPt.geometry.coordinates[1], lng: centerPt.geometry.coordinates[0] };
      
      const bbox = turf.bbox(polygon);

      const fc: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [polygon as unknown as GeoJSON.Feature]
      };

      onChange(fc, areaHa, perimeterKm, center, bbox);
    } else {
      onChange(null, 0, 0, null, null);
    }
  }, [onChange]);

  const handleMapClick = (e: MapMouseEvent) => {
    if (mode !== 'draw') return;
    
    const newPoint = [e.lngLat.lng, e.lngLat.lat];
    const newPoints = [...points, newPoint];
    setPoints(newPoints);
    updateParent(newPoints);
  };

  const handleMouseMove = (e: MapMouseEvent) => {
    setCursorPos({ lat: e.lngLat.lat, lng: e.lngLat.lng });
  };

  const handleUndo = () => {
    if (points.length === 0) return;
    const newPoints = points.slice(0, -1);
    setPoints(newPoints);
    updateParent(newPoints);
  };

  const handleClear = () => {
    setPoints([]);
    updateParent([]);
    setMode('draw');
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        mapRef.current?.flyTo({ center: [parseFloat(lon), parseFloat(lat)], zoom: 12, duration: 2000 });
      } else {
        toast.error('Location not found');
      }
    } catch (e) {
      toast.error('Search failed');
    }
  };

  // Generate GeoJSON for rendering
  const displayGeojson = React.useMemo(() => {
    if (points.length === 0) return null;
    
    if (points.length < 3) {
      // Just lines and points
      return turf.featureCollection([
        turf.lineString(points.length === 1 ? [points[0], points[0]] : points),
        ...points.map(p => turf.point(p))
      ] as any);
    }
    
    // Polygon
    const closedPoints = [...points, points[0]];
    return turf.featureCollection([
      turf.polygon([closedPoints]),
      ...points.map(p => turf.point(p))
    ] as any);
  }, [points]);

  return (
    <div className="space-y-3">
      <MapToolbar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        mode={mode}
        onModeChange={setMode}
        onUndo={handleUndo}
        onClear={handleClear}
        canUndo={points.length > 0}
        canClear={points.length > 0}
      />

      <div style={{ height }} className="relative">
        <MapViewer 
          mapRef={mapRef}
          interactive={true} 
          cursor={mode === 'draw' ? 'crosshair' : 'grab'}
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
        >
          {displayGeojson && (
            <Source type="geojson" data={displayGeojson as any}>
              <Layer 
                id="boundary-fill" 
                type="fill" 
                paint={{
                  'fill-color': '#22c55e',
                  'fill-opacity': 0.2
                }} 
                filter={['==', '$type', 'Polygon']}
              />
              <Layer 
                id="boundary-line" 
                type="line" 
                paint={{
                  'line-color': '#22c55e',
                  'line-width': 2
                }} 
              />
              <Layer 
                id="boundary-points" 
                type="circle" 
                paint={{
                  'circle-radius': 5,
                  'circle-color': '#f59e0b',
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff'
                }} 
                filter={['==', '$type', 'Point']}
              />
            </Source>
          )}

          <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
            <CoordinatePanel 
              lat={points.length > 0 ? points[0][1] : null}
              lng={points.length > 0 ? points[0][0] : null}
              cursorLat={cursorPos?.lat}
              cursorLng={cursorPos?.lng}
            />
          </div>
          
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
            <MeasurementPanel 
              areaHa={geojson && geojson.features.length > 0 ? turf.area(geojson as any)/10000 : 0}
              perimeterKm={geojson && geojson.features.length > 0 ? turf.length(geojson as any, { units: 'kilometers' }) : 0}
            />
          </div>
        </MapViewer>
      </div>
    </div>
  );
}
