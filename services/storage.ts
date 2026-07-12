import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export async function uploadFile(
  file: File, 
  bucket: string, 
  category: string, 
  projectId?: string
) {
  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('You must be signed in to upload files');

  // Generate unique file name
  const fileExt = file.name.split('.').pop();
  const uniqueName = `${uuidv4()}.${fileExt}`;
  
  // Path depends on if it's tied to a project or generic (like profile)
  const filePath = projectId 
    ? `${projectId}/${category}/${uniqueName}`
    : `${user.id}/${category}/${uniqueName}`;

  // Upload to Supabase Storage
  const { error: uploadError, data: uploadData } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Storage error: ${uploadError.message}`);
  }

  // Get public URL if bucket is public, else it requires signed URLs later
  const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  
  // If this is a project file, record it in project_files table
  let fileRecord = null;
  if (projectId) {
    // Determine file_type (simplified)
    let fileType = 'document';
    if (file.type.startsWith('image/')) fileType = 'image';
    if (file.type.startsWith('video/')) fileType = 'video';
    
    const { data: record, error: dbError } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        uploaded_by: user.id,
        file_name: file.name,
        file_type: fileType,
        category: category,
        storage_path: uploadData.path,
        public_url: publicUrlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (dbError) throw new Error(`Database error: ${dbError.message}`);
    fileRecord = record;

    // Log Activity
    await supabase.from('project_activity').insert({
      project_id: projectId,
      actor_id: user.id,
      event_type: 'file_uploaded',
      title: `${category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Uploaded`,
      description: `Uploaded file: ${file.name}`,
    });
  } else {
    // For profile-related files, we just return the storage details
    fileRecord = {
      storage_path: uploadData.path,
      public_url: publicUrlData.publicUrl,
      file_name: file.name,
    };
  }

  return fileRecord;
}
