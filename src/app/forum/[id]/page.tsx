'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { MessageSquare, ArrowLeft, Lock, Pin, Eye, Clock, User, Send, AlertCircle, Reply, Edit2, Trash2, X, Check, Loader2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MarkdownEditor from '@/components/MarkdownEditor';

type ForumTopic = {
  id: string;
  title: string;
  content: string;
  category: string;
  views: number;
  replyCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  lastReplyAt: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

type ForumReply = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentReplyId?: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  replies?: ForumReply[];
};

type ReplyItemProps = {
  reply: ForumReply;
  topicId: string;
  topicLocked: boolean;
  depth?: number;
  onReplyAdded: () => void;
  onReplyUpdated: () => void;
};

function ReplyItem({ reply, topicId, topicLocked, depth = 0, onReplyAdded, onReplyUpdated }: ReplyItemProps) {
  const { data: session } = useSession();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replies, setReplies] = useState<ForumReply[]>(reply.replies || []);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetch('/api/user/role')
        .then(res => res.json())
        .then(data => setUserRole(data.role))
        .catch(() => setUserRole(null));
    }
  }, [session]);

  const isOwner = session?.user?.id === reply.user.id;
  const isModerator = userRole === 'MODERATOR' || userRole === 'ADMIN';
  const canDelete = isOwner || isModerator;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !replyContent.trim() || topicLocked) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/forum/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          content: replyContent,
          parentReplyId: reply.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Reactie geplaatst! +${data.manaEarned} Mana verdiend! 🎮`);
        setReplies([...replies, data.reply]);
        setReplyContent('');
        setShowReplyForm(false);
        onReplyAdded();
      } else {
        toast.error(data.error || 'Fout bij plaatsen reactie');
      }
    } catch (error) {
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
      const res = await fetch(`/api/forum/replies/${reply.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Reactie bijgewerkt!');
        setIsEditing(false);
        onReplyUpdated();
      } else {
        toast.error(data.error || 'Fout bij bijwerken reactie');
      }
    } catch (error) {
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
      const res = await fetch(`/api/forum/replies/${reply.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Reactie verwijderd');
        onReplyUpdated();
      } else {
        toast.error(data.error || 'Fout bij verwijderen reactie');
      }
    } catch (error) {
      toast.error('Fout bij verwijderen reactie');
    } finally {
      setDeleting(false);
    }
  };

  const maxDepth = 3;
  const canReply = depth < maxDepth && session && !topicLocked;

  if (deleting) {
    return null;
  }

  return (
    <div id={`reply-${reply.id}`} className={depth > 0 ? 'ml-8 mt-4 border-l-2 border-gray-800 pl-4' : ''}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
            {reply.user.name ? reply.user.name[0].toUpperCase() : 'A'}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-white">{reply.user.name || 'Anoniem'}</span>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: nl })}
            </span>
            {canDelete && (
              <div className="flex items-center gap-2 ml-auto">
                {!isEditing && (
                  <>
                    {isOwner && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs text-gray-400 hover:text-green-400 transition-colors flex items-center gap-1"
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
              <MarkdownEditor
                value={editContent}
                onChange={setEditContent}
                rows={4}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  disabled={submitting || !editContent.trim()}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-1.5 px-4 rounded text-sm transition-colors flex items-center gap-1"
                >
                  {submitting ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                  Opslaan
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(reply.content);
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
              <div className="text-gray-300 leading-relaxed mb-2 prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-gray-300 prose-a:text-green-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-code:text-yellow-400 prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-blockquote:border-l-green-500 prose-blockquote:text-gray-400 prose-ul:text-gray-300 prose-ol:text-gray-300">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({node, ...props}) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 hover:underline" />
                    ),
                    code: ({node, inline, ...props}: any) => {
                      if (inline) {
                        return <code {...props} className="bg-gray-800 text-yellow-400 px-1 py-0.5 rounded text-sm" />;
                      }
                      return <code {...props} className="block bg-gray-900 text-gray-300 p-3 rounded-lg overflow-x-auto" />;
                    },
                  }}
                >
                  {reply.content}
                </ReactMarkdown>
              </div>
              
              {canReply && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="text-xs text-green-400 hover:text-green-300 font-semibold flex items-center gap-1 transition-colors mb-2"
                >
                  <Reply size={12} />
                  Reageren
                </button>
              )}
            </>
          )}

          {showReplyForm && session && !topicLocked && (
            <form onSubmit={handleReply} className="mt-3">
              <MarkdownEditor
                value={replyContent}
                onChange={setReplyContent}
                placeholder="Schrijf je reactie... (Markdown ondersteund)"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  disabled={submitting || !replyContent.trim()}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-1.5 px-4 rounded text-sm transition-colors flex items-center gap-1"
                >
                  {submitting ? <Loader2 className="animate-spin" size={14} /> : <><Send size={14} /> Reageren</>}
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
              {replies.map((nestedReply) => (
                <ReplyItem
                  key={nestedReply.id}
                  reply={nestedReply}
                  topicId={topicId}
                  topicLocked={topicLocked}
                  depth={depth + 1}
                  onReplyAdded={onReplyAdded}
                  onReplyUpdated={onReplyUpdated}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TopicPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const topicId = params.id as string;

  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [newReply, setNewReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState(false);

  useEffect(() => {
    if (topicId) {
      fetchTopic();
      fetchReplies();
    }
  }, [topicId]);

  const fetchTopic = async () => {
    try {
      const res = await fetch(`/api/forum/topics/${topicId}`);
      const data = await res.json();
      
      if (res.ok) {
        setTopic(data.topic);
        setEditTitle(data.topic.title);
        setEditContent(data.topic.content);
        setEditCategory(data.topic.category);
      } else {
        toast.error(data.error || 'Topic niet gevonden');
        router.push('/forum');
      }
    } catch (error) {
      toast.error('Fout bij laden topic');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async () => {
    try {
      const res = await fetch(`/api/forum/replies?topicId=${topicId}`);
      const data = await res.json();
      
      if (res.ok) {
        setReplies(data.replies || []);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleEditTopic = async () => {
    if (!editTitle.trim() || editTitle.length < 3 || editContent.trim().length < 10) {
      toast.error('Titel moet minimaal 3 tekens zijn en inhoud minimaal 10 tekens');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/forum/topics/${topicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          category: editCategory,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Topic bijgewerkt!');
        setIsEditingTopic(false);
        fetchTopic();
      } else {
        toast.error(data.error || 'Fout bij bijwerken topic');
      }
    } catch (error) {
      toast.error('Fout bij bijwerken topic');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!confirm('Weet je zeker dat je dit topic wilt verwijderen? Alle reacties worden ook verwijderd. Dit kan niet ongedaan worden gemaakt.')) {
      return;
    }

    setDeletingTopic(true);
    try {
      const res = await fetch(`/api/forum/topics/${topicId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Topic verwijderd');
        router.push('/forum');
      } else {
        toast.error(data.error || 'Fout bij verwijderen topic');
      }
    } catch (error) {
      toast.error('Fout bij verwijderen topic');
    } finally {
      setDeletingTopic(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error('Je moet ingelogd zijn om te reageren');
      router.push(`/login?callbackUrl=/forum/${topicId}`);
      return;
    }

    if (!newReply.trim() || newReply.length < 3) {
      toast.error('Reactie moet minimaal 3 tekens zijn');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/forum/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId,
          content: newReply,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Reactie geplaatst! +${data.manaEarned} Mana verdiend! 🎮`);
        setNewReply('');
        fetchReplies();
        fetchTopic();
      } else {
        toast.error(data.error || 'Fout bij plaatsen reactie');
      }
    } catch (error) {
      toast.error('Fout bij plaatsen reactie');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Algemeen': 'bg-gray-600',
      'Reviews': 'bg-purple-600',
      'Nieuws': 'bg-green-600',
      'Hardware': 'bg-emerald-600',
      'Tech': 'bg-emerald-600',
      'Voetbal': 'bg-pink-600',
    };
    return colors[category] || 'bg-gray-600';
  };

  const countTotalReplies = (replies: ForumReply[]): number => {
    return replies.reduce((count, reply) => {
      return count + 1 + (reply.replies ? countTotalReplies(reply.replies) : 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Topic laden...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return null;
  }

  const totalReplies = countTotalReplies(replies);
  const isTopicOwner = session?.user?.id === topic.user.id;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-200 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Beta Warning Banner */}
        <div className="mb-6 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 border-2 border-yellow-500/50 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-yellow-300 font-bold text-xs mb-1 flex items-center gap-2">
              <span className="bg-yellow-500/30 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">BETA</span>
              Forum in ontwikkeling
            </h3>
            <p className="text-yellow-200/80 text-xs leading-relaxed">
              Dit forum is momenteel in beta. Er kunnen nog foutjes voorkomen.
            </p>
          </div>
        </div>

        {/* Back Button */}
        <Link
          href="/forum"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-bold">Terug naar Forum</span>
        </Link>

        {/* Topic Header */}
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                {topic.isPinned && <Pin size={20} className="text-yellow-500 fill-yellow-500" />}
                {topic.isLocked && <Lock size={20} className="text-red-500" />}
                <span className={`px-3 py-1 rounded ${getCategoryColor(topic.category)} text-white text-xs font-bold uppercase`}>
                  {topic.category}
                </span>
                {isTopicOwner && !isEditingTopic && (
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => setIsEditingTopic(true)}
                      className="text-xs text-gray-400 hover:text-green-400 transition-colors flex items-center gap-1"
                      title="Bewerken"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={handleDeleteTopic}
                      disabled={deletingTopic}
                      className="text-xs text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
                      title="Verwijderen"
                    >
                      {deletingTopic ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                    </button>
                  </div>
                )}
              </div>
              
              {isEditingTopic ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white font-bold text-xl focus:outline-none focus:border-green-500"
                    placeholder="Topic titel"
                  />
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="Algemeen">Algemeen</option>
                    <option value="Reviews">Reviews</option>
                    <option value="Nieuws">Nieuws</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Tech">Tech</option>
                    <option value="Voetbal">Voetbal</option>
                  </select>
                  <MarkdownEditor
                    value={editContent}
                    onChange={setEditContent}
                    rows={8}
                    placeholder="Topic inhoud (Markdown ondersteund)"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditTopic}
                      disabled={submitting || !editTitle.trim() || editContent.trim().length < 10}
                      className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {submitting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                      Opslaan
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingTopic(false);
                        fetchTopic();
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <X size={16} />
                      Annuleren
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl md:text-4xl font-black text-white mb-4">{topic.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>{topic.user.name || 'Anoniem'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true, locale: nl })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare size={16} />
                      <span>{totalReplies} reacties</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye size={16} />
                      <span>{topic.views} views</span>
                    </div>
                  </div>
                  <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-a:text-green-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-code:text-yellow-400 prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 prose-blockquote:border-l-green-500 prose-blockquote:text-gray-400 prose-ul:text-gray-300 prose-ol:text-gray-300">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({node, ...props}) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 hover:underline" />
                        ),
                        code: ({node, inline, ...props}: any) => {
                          if (inline) {
                            return <code {...props} className="bg-gray-800 text-yellow-400 px-1 py-0.5 rounded text-sm" />;
                          }
                          return <code {...props} className="block bg-gray-900 text-gray-300 p-3 rounded-lg overflow-x-auto" />;
                        },
                      }}
                    >
                      {topic.content}
                    </ReactMarkdown>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Replies Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare size={24} className="text-green-500" />
            Reacties ({totalReplies})
          </h2>

          {replies.length === 0 ? (
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 text-center">
              <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">Nog geen reacties. {session ? 'Wees de eerste!' : 'Log in om te reageren.'}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {replies.map((reply) => (
                <div key={reply.id} className="bg-[#111827] border border-gray-800 rounded-xl p-6">
                  <ReplyItem
                    reply={reply}
                    topicId={topicId}
                    topicLocked={topic.isLocked}
                    depth={0}
                    onReplyAdded={fetchReplies}
                    onReplyUpdated={fetchReplies}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply Form */}
        {topic.isLocked ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <Lock size={32} className="mx-auto text-red-500 mb-3" />
            <p className="text-red-400 font-bold">Dit topic is gesloten. Nieuwe reacties zijn niet meer mogelijk.</p>
          </div>
        ) : session ? (
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Reageer op dit topic</h3>
            <form onSubmit={handleSubmitReply} className="space-y-4">
              <MarkdownEditor
                value={newReply}
                onChange={setNewReply}
                placeholder="Schrijf je reactie... (Markdown ondersteund)"
                rows={6}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Je verdient <span className="text-green-400 font-bold">50 Mana</span> per reactie!
                </p>
                <button
                  type="submit"
                  disabled={submitting || !newReply.trim() || newReply.length < 3}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  <Send size={18} />
                  {submitting ? 'Plaatsen...' : 'Reactie Plaatsen'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
            <AlertCircle size={32} className="mx-auto text-green-500 mb-3" />
            <p className="text-green-400 font-bold mb-4">Je moet ingelogd zijn om te reageren</p>
            <Link
              href={`/login?callbackUrl=/forum/${topicId}`}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Inloggen
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
