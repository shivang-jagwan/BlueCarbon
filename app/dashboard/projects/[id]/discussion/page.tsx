'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useDiscussionComments } from '@/hooks/use-projects';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Clock, Reply, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DiscussionPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, profile } = useAuth();
  const { comments, loading, refetch } = useDiscussionComments(projectId);
  const [body, setBody] = React.useState('');
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const [replyBody, setReplyBody] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!body.trim() || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('discussion_comments').insert({
        project_id: projectId,
        author_id: user.id,
        body: body.trim(),
      });
      if (error) throw error;
      setBody('');
      toast.success('Comment posted');
      refetch();
    } catch (err) {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyBody.trim() || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('discussion_comments').insert({
        project_id: projectId,
        author_id: user.id,
        parent_id: parentId,
        body: replyBody.trim(),
      });
      if (error) throw error;
      setReplyBody('');
      setReplyTo(null);
      toast.success('Reply posted');
      refetch();
    } catch (err) {
      toast.error('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  const getInitials = (name: string) =>
    name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Discussion Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thread-based communication between project owners, verifiers, and partners
        </p>
      </div>

      {/* New Comment */}
      <Card className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {profile ? getInitials(profile.full_name || profile.email) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Write a comment..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-20 resize-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <Button variant="ghost" size="sm">
                <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                Attach
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || !body.trim()} size="sm">
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Comments */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Clock className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : topLevel.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold">No discussion yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a conversation about this project
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {topLevel.map((comment) => {
            const replies = getReplies(comment.id);
            return (
              <div key={comment.id} className="space-y-3">
                <CommentCard
                  comment={comment}
                  onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                />
                {replyTo === comment.id && (
                  <Card className="ml-12 p-3">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      className="min-h-16 resize-none"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleReply(comment.id)} disabled={submitting || !replyBody.trim()}>
                        <Reply className="mr-1.5 h-3.5 w-3.5" />
                        Reply
                      </Button>
                    </div>
                  </Card>
                )}
                {replies.length > 0 && (
                  <div className="ml-12 space-y-3 border-l-2 border-border pl-4">
                    {replies.map((reply) => (
                      <CommentCard key={reply.id} comment={reply} isReply />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CommentCard({
  comment,
  onReply,
  isReply,
}: {
  comment: { id: string; body: string; author_id: string; created_at: string };
  onReply?: () => void;
  isReply?: boolean;
}) {
  const { profile } = useAuth();
  const [author, setAuthor] = React.useState<{ full_name: string | null; email: string; role: string } | null>(null);

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', comment.author_id)
        .maybeSingle();
      if (data) setAuthor(data as any);
    })();
  }, [comment.author_id]);

  const name = author?.full_name || author?.email || 'Unknown';
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const roleLabel = author?.role === 'verifier' ? 'Verifier' : author?.role === 'sustainability_partner' ? 'Partner' : 'Owner';

  return (
    <Card className={cn('p-4', isReply && 'border-l-2 border-l-primary/30')}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 border border-border">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{name}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {roleLabel}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed">{comment.body}</p>
          {!isReply && onReply && (
            <button
              onClick={onReply}
              className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
