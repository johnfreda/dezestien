'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { MessageSquare, Plus, Pin, Lock, Eye, Clock, User, Flame, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import toast from 'react-hot-toast';
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

const categories = [
  { value: 'all', label: 'Alle Topics' },
  { value: 'Algemeen', label: 'Algemeen' },
  { value: 'Reviews', label: 'Reviews' },
  { value: 'Nieuws', label: 'Nieuws' },
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Tech', label: 'Tech' },
  { value: 'Eredivisie', label: 'Eredivisie' },
];

export default function ForumPage() {
  const { data: session } = useSession();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '', category: 'Algemeen' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, [selectedCategory, sortBy]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('sort', sortBy);
      
      const res = await fetch(`/api/forum/topics?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setTopics(data.topics || []);
      } else {
        toast.error(data.error || 'Fout bij laden topics');
      }
    } catch (error) {
      toast.error('Fout bij laden topics');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error('Je moet ingelogd zijn om een topic te maken');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTopic),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Topic aangemaakt! +${data.manaEarned} Mana verdiend! 🎮`);
        setNewTopic({ title: '', content: '', category: 'Algemeen' });
        setShowNewTopicForm(false);
        fetchTopics();
      } else {
        toast.error(data.error || 'Fout bij aanmaken topic');
      }
    } catch (error) {
      toast.error('Fout bij aanmaken topic');
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

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-200 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Beta Warning Banner */}
        <div className="mb-6 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 border-2 border-yellow-500/50 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={24} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-yellow-300 font-bold text-sm mb-1 flex items-center gap-2">
              <span className="bg-yellow-500/30 px-2 py-0.5 rounded text-xs uppercase tracking-wider">BETA</span>
              Forum in ontwikkeling
            </h3>
            <p className="text-yellow-200/80 text-sm leading-relaxed">
              Dit forum is momenteel in beta. Er kunnen nog foutjes voorkomen. Meld problemen gerust en help ons het forum te verbeteren!
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mb-2">
                <MessageSquare className="inline-block mr-3 text-green-500" size={40} />
                Forum
              </h1>
              <p className="text-gray-400">Discussieer over games, nieuws en meer</p>
            </div>
            {session && (
              <button
                onClick={() => setShowNewTopicForm(!showNewTopicForm)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-full transition-colors shadow-lg"
              >
                <Plus size={20} />
                Nieuw Topic
              </button>
            )}
          </div>

          {/* New Topic Form */}
          {showNewTopicForm && session && (
            <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Nieuw Topic Aanmaken</h2>
              <form onSubmit={handleCreateTopic} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Categorie</label>
                  <select
                    value={newTopic.category}
                    onChange={(e) => setNewTopic({ ...newTopic, category: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                  >
                    {categories.filter(c => c.value !== 'all').map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Titel *</label>
                  <input
                    type="text"
                    value={newTopic.title}
                    onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                    placeholder="Bijv: Wat vinden jullie van de nieuwe Zelda?"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                    required
                    maxLength={200}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Inhoud *</label>
                  <MarkdownEditor
                    value={newTopic.content}
                    onChange={(content) => setNewTopic({ ...newTopic, content })}
                    placeholder="Beschrijf je topic... (Markdown ondersteund)"
                    rows={6}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitting || !newTopic.title || !newTopic.content}
                    className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-colors"
                  >
                    {submitting ? 'Aanmaken...' : 'Topic Aanmaken'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewTopicForm(false);
                      setNewTopic({ title: '', content: '', category: 'Algemeen' });
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 font-bold">Categorie:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-green-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 font-bold">Sorteren:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-green-500"
              >
                <option value="recent">Meest Recent</option>
                <option value="popular">Meest Populair</option>
                <option value="oldest">Oudste Eerst</option>
              </select>
            </div>
          </div>
        </div>

        {/* Topics List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Topics laden...</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-12 bg-[#111827] rounded-xl border border-gray-800">
            <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">Nog geen topics. {session ? 'Maak de eerste aan!' : 'Log in om een topic te maken.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/forum/${topic.id}`}
                className="block bg-[#111827] border border-gray-800 rounded-xl p-6 hover:border-green-500/50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getCategoryColor(topic.category)} text-white font-bold text-sm`}>
                      {topic.category[0]}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {topic.isPinned && <Pin size={16} className="text-yellow-500 fill-yellow-500" />}
                          {topic.isLocked && <Lock size={16} className="text-red-500" />}
                          <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors line-clamp-2">
                            {topic.title}
                          </h3>
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">{topic.content}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>{topic.user.name || 'Anoniem'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{formatDistanceToNow(new Date(topic.createdAt), { addSuffix: true, locale: nl })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare size={14} />
                            <span>{topic.replyCount} reacties</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye size={14} />
                            <span>{topic.views} views</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded ${getCategoryColor(topic.category)} text-white text-[10px] font-bold uppercase`}>
                            {topic.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
