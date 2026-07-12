'use client';

import * as React from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FollowProjectButtonProps {
  projectId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function FollowProjectButton({ projectId, className, variant = 'outline', size = 'default', showText = true }: FollowProjectButtonProps) {
  const { user } = useAuth();
  const [isFollowed, setIsFollowed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    
    (async () => {
      const { data } = await supabase
        .from('followed_projects')
        .select('id')
        .eq('company_id', user.id)
        .eq('project_id', projectId)
        .maybeSingle();
      
      setIsFollowed(!!data);
      setLoading(false);
    })();
  }, [projectId, user]);

  const toggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if inside a Link
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in to follow projects');
      return;
    }

    setLoading(true);
    try {
      if (isFollowed) {
        await supabase
          .from('followed_projects')
          .delete()
          .eq('company_id', user.id)
          .eq('project_id', projectId);
        setIsFollowed(false);
        toast.success('Unfollowed project');
      } else {
        await supabase
          .from('followed_projects')
          .insert({
            company_id: user.id,
            project_id: projectId
          });
        setIsFollowed(true);
        toast.success('You will now receive updates about this project');
      }
    } catch (err: any) {
      toast.error('Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className, isFollowed && "text-primary border-primary/50 bg-primary/5")}
      onClick={toggleFollow}
      disabled={loading}
      title={isFollowed ? "Unfollow Project" : "Follow Project"}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bell className={cn("h-4 w-4", isFollowed && "fill-primary")} />
      )}
      {showText && <span className="ml-2">{isFollowed ? 'Following' : 'Follow Project'}</span>}
    </Button>
  );
}
