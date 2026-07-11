import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PenTool, Trash2, Undo, MousePointer2 } from 'lucide-react';

interface MapToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  mode: 'view' | 'draw' | 'edit';
  onModeChange: (mode: 'view' | 'draw' | 'edit') => void;
  onClear: () => void;
  onUndo: () => void;
  canUndo: boolean;
  canClear: boolean;
}

export function MapToolbar({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  mode,
  onModeChange,
  onClear,
  onUndo,
  canUndo,
  canClear,
}: MapToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-card p-2 shadow-sm border border-border">
      <form 
        onSubmit={(e) => { e.preventDefault(); onSearchSubmit(); }}
        className="relative flex-1 min-w-[200px]"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search location (coordinates or place)..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 pl-9"
        />
      </form>
      
      <div className="mx-2 h-6 w-px bg-border hidden sm:block" />

      <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-muted/50">
        <Button
          type="button"
          variant={mode === 'view' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 gap-1.5 px-2.5"
          onClick={() => onModeChange('view')}
        >
          <MousePointer2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Select</span>
        </Button>
        <Button
          type="button"
          variant={mode === 'draw' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 gap-1.5 px-2.5"
          onClick={() => onModeChange('draw')}
        >
          <PenTool className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Draw Boundary</span>
        </Button>
      </div>

      <div className="mx-2 h-6 w-px bg-border hidden sm:block" />

      <div className="flex items-center gap-1">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="h-9 w-9 p-0" 
          onClick={onUndo} 
          disabled={!canUndo || mode === 'view'}
          title="Undo last point"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="h-9 w-9 p-0 hover:bg-destructive hover:text-destructive-foreground" 
          onClick={onClear} 
          disabled={!canClear}
          title="Clear boundary"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
