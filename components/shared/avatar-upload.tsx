'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showActions?: boolean;
  onAvatarChange?: (url: string | null) => void;
}

const sizeMap = {
  sm: 'h-9 w-9',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
};

const iconSizeMap = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function AvatarUpload({ size = 'md', className, showActions = true, onAvatarChange }: AvatarUploadProps) {
  const { profile, refreshProfile } = useAuth();
  const [uploading, setUploading] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const currentUrl = previewUrl || profile?.avatar_url || null;

  const initials = (profile?.full_name || profile?.email || 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${profile.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (dbError) throw dbError;

      setPreviewUrl(null);
      await refreshProfile();
      onAvatarChange?.(publicUrl);
      toast.success('Profile photo updated');
    } catch (err) {
      setPreviewUrl(null);
      toast.error(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!profile) return;
    setUploading(true);
    try {
      const ext = profile.avatar_url?.split('.').pop();
      if (ext) {
        await supabase.storage.from('profile-images').remove([`${profile.id}/avatar.${ext}`]);
      }

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id);

      if (error) throw error;

      setPreviewUrl(null);
      await refreshProfile();
      onAvatarChange?.(null);
      toast.success('Profile photo removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('relative inline-flex flex-col items-center gap-2', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      <div className="relative group">
        <Avatar className={cn(sizeMap[size], 'border-2 border-border')}>
          {currentUrl && <AvatarImage src={currentUrl} alt={profile?.full_name || 'Avatar'} />}
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {uploading ? <Loader2 className={cn(iconSizeMap[size], 'animate-spin')} /> : initials}
          </AvatarFallback>
        </Avatar>

        {showActions && !uploading && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Change photo"
          >
            <Camera className={cn(size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5', 'text-white')} />
          </button>
        )}
      </div>

      {showActions && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {currentUrl ? 'Change' : 'Upload'}
          </Button>
          {currentUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={handleRemove}
              disabled={uploading}
            >
              Remove
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
