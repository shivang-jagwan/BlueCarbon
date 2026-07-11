import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type MapStyle = 'satellite' | 'street' | 'hybrid' | 'terrain' | 'ndvi';

interface LayerSwitcherProps {
  currentStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
}

export function LayerSwitcher({ currentStyle, onStyleChange }: LayerSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="h-9 w-9 shadow-sm bg-background/90 backdrop-blur-sm border-border">
          <Layers className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuRadioGroup value={currentStyle} onValueChange={(v) => onStyleChange(v as MapStyle)}>
          <DropdownMenuRadioItem value="satellite">Satellite</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="street">Street</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="hybrid">Hybrid</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="terrain">Terrain</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ndvi" disabled>NDVI (Coming Soon)</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
