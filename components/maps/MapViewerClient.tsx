import * as React from 'react';
import Map, { NavigationControl, FullscreenControl, ScaleControl, GeolocateControl, MapRef, ViewState, MapLayerMouseEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { LayerSwitcher, MapStyle } from './LayerSwitcher';

interface MapViewerProps {
  children?: React.ReactNode;
  initialViewState?: Partial<ViewState>;
  mapStyle?: MapStyle;
  interactive?: boolean;
  cursor?: string;
  mapRef?: React.Ref<MapRef>;
  onLoad?: (e: any) => void;
  onClick?: (e: MapLayerMouseEvent) => void;
  onMouseMove?: (e: MapLayerMouseEvent) => void;
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

export function MapViewer({
  children,
  initialViewState = { longitude: 81.31015, latitude: 21.68045, zoom: 10.9 },
  mapStyle = 'hybrid',
  interactive = true,
  cursor,
  mapRef,
  onLoad,
  onClick,
  onMouseMove
}: MapViewerProps) {
  const [style, setStyle] = React.useState<MapStyle>(mapStyle);

  if (!MAPTILER_KEY) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted p-4 text-center rounded-xl border border-border min-h-[400px]">
        <p className="text-sm text-muted-foreground font-medium">Map unavailable. Please configure your MapTiler API key.</p>
      </div>
    );
  }

  const getStyleUrl = (s: MapStyle) => {
    switch(s) {
      case 'satellite': return `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`;
      case 'street': return `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;
      case 'hybrid': return `https://api.maptiler.com/maps/hybrid-v4/style.json?key=${MAPTILER_KEY}`;
      case 'terrain': return `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`;
      default: return `https://api.maptiler.com/maps/hybrid-v4/style.json?key=${MAPTILER_KEY}`;
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border min-h-[400px]">
      <Map
        ref={mapRef}
        initialViewState={initialViewState}
        mapStyle={getStyleUrl(style)}
        interactive={interactive}
        cursor={cursor}
        onLoad={onLoad}
        onClick={onClick}
        onMouseMove={onMouseMove}
      >
        <NavigationControl position="top-left" showCompass={true} showZoom={true} />
        <FullscreenControl position="top-left" />
        <GeolocateControl position="top-left" />
        <ScaleControl />

        <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
          <LayerSwitcher currentStyle={style} onStyleChange={setStyle} />
        </div>

        {children}
      </Map>
    </div>
  );
}
