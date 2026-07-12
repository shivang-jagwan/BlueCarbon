'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useProjectFiles } from '@/hooks/use-projects';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Download, Upload, FileCheck, FileX, Trash2 } from 'lucide-react';
import { FileUpload } from '@/components/shared/FileUpload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

const DOC_CATEGORIES = [
  'land_registry',
  'survey',
  'ngo_report',
  'agreement',
  'certificate',
  'kyc',
  'other',
];

export default function DocumentsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { files: documents, loading, refetch } = useProjectFiles(projectId);
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);

  const handleDelete = async (docId: string, filePath: string) => {
    try {
      await supabase.storage.from('project-documents').remove([filePath]);
      await supabase.from('project_files').delete().eq('id', docId);
      toast.success('Document deleted');
      refetch();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const docCategoryDocs = documents.filter((d) =>
    DOC_CATEGORIES.includes(d.category)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Land registry, surveys, agreements, certificates, and reports
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload agreements, registry documents, or surveys for this project.
              </DialogDescription>
            </DialogHeader>
            <FileUpload
              bucket="project-documents"
              projectId={projectId}
              category="other"
              allowedTypes={['application/pdf', 'image/jpeg', 'image/png']}
              onUploadSuccess={() => {
                setIsUploadOpen(false);
                refetch();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : docCategoryDocs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No documents yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload land registry documents, surveys, agreements, and certificates
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {docCategoryDocs.map((doc) => (
            <Card key={doc.id} className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FileCheck className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{doc.file_name}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {doc.category.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => {
                try {
                  const { data } = await supabase.storage.from('project-documents').createSignedUrl(doc.storage_path, 60);
                  if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                  else toast.error('Could not generate download link');
                } catch { toast.error('Download failed'); }
              }}>
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(doc.id, doc.storage_path)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
