import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Camera, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EvidenceGallery } from '@/components/evidence/EvidenceGallery';
import { supabase } from '@/lib/supabase/client';

export function MediaTab({ projectId }: { projectId: string }) {
  const [evidence, setEvidence] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      // Load gallery items that are inside albums starting with "Monitoring Visit"
      const { data: albums } = await supabase
        .from('project_albums')
        .select('id')
        .eq('project_id', projectId)
        .ilike('name', 'Monitoring Visit%');
        
      if (!albums || albums.length === 0) {
        setEvidence([]);
        setLoading(false);
        return;
      }

      const albumIds = albums.map((a: any) => a.id);
      const { data: items } = await supabase
        .from('project_gallery_items')
        .select('*')
        .eq('project_id', projectId)
        .in('album_id', albumIds)
        .order('created_at', { ascending: false });

      if (items) {
        // Map to EvidenceGallery format
        const mapped = items.map((item: any) => ({
          id: item.id,
          project_id: item.project_id,
          evidence_type: item.media_type === 'image' ? 'photo' : 'video',
          file_name: item.file_name || 'unknown',
          file_size: item.file_size || 0,
          mime_type: item.mime_type || 'image/jpeg',
          storage_path: item.storage_path,
          location_name: item.location_name,
          latitude: item.latitude,
          longitude: item.longitude,
          capture_date: item.capture_date || item.created_at,
          description: item.caption,
          uploaded_by: item.uploaded_by,
          verification_status: 'pending',
          fraud_score: null,
          metadata: {},
          created_at: item.created_at,
          updated_at: item.created_at,
        }));
        setEvidence(mapped);
      }
      setLoading(false);
    }
    load();
  }, [projectId]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Monitoring Media</CardTitle>
              <CardDescription>
                Upload geo-tagged photos, videos, drone, and satellite imagery. 
                Media uploaded here automatically syncs to the Project Owner and Company galleries in a "Monitoring Visit" album.
              </CardDescription>
            </div>
            <Button variant="outline">
              <UploadCloud className="h-4 w-4 mr-2" /> Upload New Media
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EvidenceGallery evidence={evidence} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}

