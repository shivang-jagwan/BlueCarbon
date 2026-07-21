import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Camera, UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EvidenceGallery } from '@/components/evidence/EvidenceGallery';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { getOrCreateMonitoringAlbum } from '@/lib/monitoring-services';
import { useToast } from '@/hooks/use-toast';

export function MediaTab({ projectId }: { projectId: string }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [evidence, setEvidence] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
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
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !profile?.id) return;

    setUploading(true);
    let successCount = 0;

    try {
      const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const albumName = `Monitoring Visit - ${monthYear}`;
      const albumId = await getOrCreateMonitoringAlbum(projectId, albumName, profile.id);

      if (!albumId) throw new Error('Failed to create or access monthly monitoring album.');

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${projectId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-gallery')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const isVideo = file.type.startsWith('video/');
        const { error: dbError } = await supabase.from('project_gallery_items').insert({
          project_id: projectId,
          album_id: albumId,
          media_type: isVideo ? 'video' : 'image',
          storage_path: filePath,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          uploaded_by: profile.id
        });

        if (dbError) throw dbError;
        successCount++;
      }

      toast({ title: 'Success', description: `Uploaded ${successCount} media files to ${albumName}.` });
      load(); // Reload gallery
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Upload Failed', description: err.message || 'An error occurred during upload.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
            <div>
              <input type="file" multiple accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleUpload} />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                {uploading ? 'Uploading...' : 'Upload New Media'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EvidenceGallery evidence={evidence} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}

