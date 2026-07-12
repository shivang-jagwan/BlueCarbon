'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Bookmark, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SaveProjectButtonProps {
  projectId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function SaveProjectButton({ projectId, className, variant = 'outline', size = 'default', showText = true }: SaveProjectButtonProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    
    (async () => {
      const { data } = await supabase
        .from('saved_projects')
        .select('id')
        .eq('company_id', user.id)
        .eq('project_id', projectId)
        .maybeSingle();
      
      setIsSaved(!!data);
      setLoading(false);
    })();
  }, [projectId, user]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if inside a Link
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in to save projects');
      return;
    }

    setLoading(true);
    try {
      if (isSaved) {
        await supabase
          .from('saved_projects')
          .delete()
          .eq('company_id', user.id)
          .eq('project_id', projectId);
        setIsSaved(false);
        toast.success('Project removed from saved list');
      } else {
        await supabase
          .from('saved_projects')
          .insert({
            company_id: user.id,
            project_id: projectId
          });
        setIsSaved(true);
        toast.success('Project saved successfully');
      }
    } catch (err: any) {
      toast.error('Failed to update saved status');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className, isSaved && "text-primary border-primary/50 bg-primary/5")}
      onClick={toggleSave}
      disabled={loading}
      title={isSaved ? "Remove from Saved" : "Save Project"}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bookmark className={cn("h-4 w-4", isSaved && "fill-primary")} />
      )}
      {showText && <span className="ml-2">{isSaved ? 'Saved' : 'Save Project'}</span>}
    </Button>
  );
}
