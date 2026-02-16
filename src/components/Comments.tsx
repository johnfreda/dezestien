'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { MessageSquare, Send, User, Loader2, Reply, Edit2, Trash2, X, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { track } from '@vercel/analytics';
import toast from 'react-hot-toast';

type CommentUser = {
  id?: string;
  name: string | null;
  image: string | null;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
  replies?: Comment[];
  parentCommentId?: string | null;
};

type CommentItemProps = {
  comment: Comment;
  slug: string;
  depth?: number;
  onReplyAdded: () => void;
  onCommentUpdated: () => void;
};

function CommentItem({ comment, slug, depth = 0, onReplyAdded, onCommentUpdated }: CommentItemProps) {
  const { data: session } = useSession();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replies, setReplies] = useState<Comment[]>(comment.replies || []);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetch('/api/user/role')
        .then(res => res.json())
        .then(data => setUserRole(data.role))
        .catch(() => setUserRole(null));
    }
  }, [session]);

  const isOwner = session?.user?.id === comment.user.id;
  const isModerator = userRole === 'MODERATOR' || userRole === 'ADMIN';
  const canDelete = isOwner || isModerator;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !replyContent.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          content: replyContent,
          parentCommentId: comment.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        track('Comment', {
          articleSlug: slug,
          commentLength: replyContent.length
        });
        
        setReplies([...replies, data.comment]);
        setReplyContent('');
        setShowReplyForm(false);
        onReplyAdded();
      } else {
        toast.error(data.error || 'Fout bij plaatsen reactie');
      }
    } catch (err) {
      toast.error('Fout bij plaatsen reactie');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim() || editContent.length < 3) {
      toast.error('Reactie moet minimaal 3 tekens zijn');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Reactie bijgewerkt!');
        setIsEditing(false);
        onCommentUpdated();
      } else {
        toast.error(data.error || 'Fout bij bijwerken reactie');
      }
    } catch (err) {
      toast.error('Fout bij bijwerken reactie');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Weet je zeker dat je deze reactie wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Reactie verwijderd');
        onCommentUpdated();
      } else {
        toast.error(data.error || 'Fout bij verwijderen reactie');
      }
    } catch (err) {
      toast.error('Fout bij verwijderen reactie');
    } finally {
      setDeleting(false);
    }
  };

  const maxDepth = 3;
  const canReply = depth < maxDepth && session;

  if (deleting) {
    return null; // Verberg tijdens verwijderen
  }

  return (
    <div id={`comment-${comment.id}`} className={depth > 0 ? 'ml-8 mt-4 border-l-2 border-gray-800 pl-4' : ''}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-bold text-xs uppercase flex-shrink-0">
          {comment.user.name?.substring(0, 2) || <User size={14} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white">{comment.user.name || 'Anoniem'}</span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: nl })}
            </span>
            {canDelete && (
              <div className="flex items-center gap-2 ml-auto">
                {!isEditing && (
                  <>
                    {isOwner && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1"
                        title="Bewerken"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
                      title={isModerator && !isOwner ? "Verwijderen (Moderator)" : "Verwijderen"}
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  disabled={submitting || !editContent.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-1.5 px-4 rounded text-sm transition-colors flex items-center gap-1"
                >
                  {submitting ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  Opslaan
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1.5 px-4 rounded text-sm transition-colors flex items-center gap-1"
                >
                  <X size={14} />
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-300 leading-relaxed mb-2 whitespace-pre-wrap">{comment.content}</p>
              
              {canReply && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Reply size={12} />
                  Reageren
                </button>
              )}
            </>
          )}

          {showReplyForm && session && (
            <form onSubmit={handleReply} className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Schrijf je reactie..."
                rows={3}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-1.5 px-4 rounded text-sm transition-colors flex items-center gap-1"
                >
                  {submitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  Reageren
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1.5 px-4 rounded text-sm transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </form>
          )}

          {/* Nested Replies */}
          {replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  slug={slug}
                  depth={depth + 1}
                  onReplyAdded={onReplyAdded}
                  onCommentUpdated={onCommentUpdated}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Comments({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchComments = () => {
    fetch(`/api/comments?slug=${slug}`)
      .then(res => res.json())
      .then(data => {
        setComments(data.comments || []);
        setFetching(false);
      });
  };

  useEffect(() => {
    fetchComments();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, content: newComment }),
      });

      const data = await res.json();
      if (res.ok) {
        track('Comment', {
          articleSlug: slug,
          commentLength: newComment.length
        });
        
        setComments([data.comment, ...comments]);
        setNewComment('');
      } else {
        toast.error(data.error || 'Fout bij plaatsen reactie');
      }
    } catch (err) {
      toast.error('Fout bij plaatsen reactie');
    } finally {
      setLoading(false);
    }
  };

  const countTotalComments = (comments: Comment[]): number => {
    return comments.reduce((count, comment) => {
      return count + 1 + (comment.replies ? countTotalComments(comment.replies) : 0);
    }, 0);
  };

  const totalComments = countTotalComments(comments);

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 md:p-8 mt-12">
      <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
        <MessageSquare className="text-blue-500" /> Reacties ({totalComments})
      </h3>

      {/* Input Form */}
      {session ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Wat vind jij hiervan?"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-white focus:outline-none focus:border-blue-500 min-h-[100px]"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              Plaats Reactie
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-900/50 rounded-lg p-6 text-center mb-8 border border-gray-800 border-dashed">
          <p className="text-gray-400 mb-4">Log in om mee te praten met de community.</p>
          <button
            onClick={() => signIn()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            Inloggen / Registreren
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {fetching ? (
          <div className="text-center py-8 text-gray-500 animate-pulse">Laden...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 italic font-medium">Nog geen reacties. Plaats de eerste reactie en verdien extra mana.</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-800 pb-6 last:border-0 last:pb-0">
              <CommentItem
                comment={comment}
                slug={slug}
                depth={0}
                onReplyAdded={fetchComments}
                onCommentUpdated={fetchComments}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
