'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProject } from '@/hooks/use-projects';
import { useAuth } from '@/components/providers/auth-provider';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { BoundaryEditor } from '@/components/maps/BoundaryEditor';
import { ProjectMap } from '@/components/maps/ProjectMap';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Save } from 'lucide-react';
import type { GeoJSON } from '@/lib/types';

export default function MapPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { project, loading } = useProject(projectId);
  const { user } = useAuth();
  const [geojson, setGeojson] = React.useState<GeoJSON.FeatureCollection | null>(null);
  const [area, setArea] = React.useState(0);
  const [perimeter, setPerimeter] = React.useState(0);
  const [center, setCenter] = React.useState<{ lat: number; lng: number } | null>(null);
  const [bbox, setBbox] = React.useState<number[] | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (project?.boundary_geojson) {
      setGeojson(project.boundary_geojson as GeoJSON.FeatureCollection);
      setArea(project.area_hectares || 0);
      setPerimeter(project.perimeter_km || 0);
      if (project.center_lat && project.center_lng) {
        setCenter({ lat: project.center_lat, lng: project.center_lng });
      }
      if (project.bounding_box) {
        setBbox(project.bounding_box);
      }
    }
  }, [project]);

  const handleMapChange = React.useCallback(
    (gj: GeoJSON.FeatureCollection | null, a: number, p: number, c: { lat: number; lng: number } | null, b: number[] | null) => {
      setGeojson(gj);
      setArea(a);
      setPerimeter(p);
      setCenter(c);
      setBbox(b);
    },
    []
  );

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          boundary_geojson: geojson as any,
          area_hectares: area || null,
          perimeter_km: perimeter || null,
          center_lat: center?.lat || null,
          center_lng: center?.lng || null,
          bounding_box: bbox || null,
        })
        .eq('id', projectId);

      if (error) throw error;

      await supabase.from('project_activity').insert({
        project_id: projectId,
        actor_id: user.id,
        event_type: 'boundary_updated',
        title: 'Project Boundary Updated',
        description: `Area: ${area.toFixed(2)} ha, Perimeter: ${perimeter.toFixed(2)} km`,
      });

      toast.success('Boundary saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save boundary');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Project Map</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Draw and edit your project boundary with interactive mapping tools
          </p>
        </div>
        {project && user?.id === project.owner_id ? (
          <Button onClick={handleSave} disabled={saving || !geojson}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Boundary'}
          </Button>
        ) : null}
      </div>

      <Card className="p-6">
        {project && user?.id === project.owner_id ? (
          <BoundaryEditor geojson={geojson} onChange={handleMapChange} height="500px" />
        ) : (
          <ProjectMap 
            geojson={geojson} 
            areaHa={area} 
            perimeterKm={perimeter} 
            center={center} 
            bbox={bbox} 
            height="500px" 
          />
        )}
      </Card>
    </div>
  );
}
