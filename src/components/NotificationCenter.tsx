'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Check, MessageSquare, AtSign, X, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

type Notification = {
  id: string;
  type: 'reply' | 'mention' | 'tag';
  read: boolean;
  createdAt: string;
  actorId: string;
  actorName: string | null;
  contextType: 'comment' | 'forum_reply';
  contextId: string;
  articleSlug: string | null;
  topicId: string | null;
  targetCommentId: string | null;
  targetReplyId: string | null;
};

export default function NotificationCenter() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch('/api/notifications?limit=20');
      const data = await res.json();
      if (res.ok) setNotifications(data.notifications || []);
    } catch {}
  };

  const fetchUnreadCount = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch('/api/notifications/count');
      const data = await res.json();
      if (res.ok) setUnreadCount(data.count || 0);
    } catch {}
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const interval = setInterval(() => {
      fetchUnreadCount();
      if (isOpen) fetchNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, [session, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (window.innerWidth < 768) document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {}
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch {}
    setLoading(false);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) await markAsRead(notification.id);
    setIsOpen(false);

    const scrollToElement = (elementId: string) => {
      const attempts = [100, 300, 600, 1000];
      attempts.forEach((delay) => {
        setTimeout(() => {
          const el = document.getElementById(elementId);
          if (el) {
            const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top, behavior: 'smooth' });
            el.classList.add('ring-2', 'ring-green-500/50');
            setTimeout(() => el.classList.remove('ring-2', 'ring-green-500/50'), 3000);
          }
        }, delay);
      });
    };

    if (notification.contextType === 'comment' && notification.articleSlug) {
      router.push(`/artikel/${notification.articleSlug}#comment-${notification.contextId}`);
      scrollToElement(`comment-${notification.contextId}`);
    } else if (notification.contextType === 'forum_reply' && notification.topicId) {
      router.push(`/forum/${notification.topicId}#reply-${notification.contextId}`);
      scrollToElement(`reply-${notification.contextId}`);
    }
  };

  const getIcon = (type: string) => {
    if (type === 'reply') return { icon: MessageSquare, color: 'bg-green-500/15 text-green-400' };
    return { icon: AtSign, color: 'bg-purple-500/15 text-purple-400' };
  };

  const getText = (n: Notification) => {
    const actor = n.actorName || 'Iemand';
    const where = n.contextType === 'comment' ? 'reactie' : 'bericht';
    if (n.type === 'reply') return { actor, action: `heeft gereageerd op je ${where}` };
    if (n.type === 'mention') return { actor, action: 'heeft je genoemd' };
    return { actor, action: 'heeft je getagd' };
  };

  if (!session?.user?.id) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}
        className="relative p-1.5 text-gray-400 hover:text-white transition-colors"
        title="Notificaties"
        aria-label={`Notificaties${unreadCount > 0 ? ` (${unreadCount} ongelezen)` : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-x-0 bottom-0 md:absolute md:inset-auto md:right-0 md:top-12 md:w-[360px] md:max-h-[480px] z-[101] flex flex-col md:rounded-xl rounded-t-2xl bg-[#0f1522]/98 backdrop-blur-xl border border-gray-700/50 shadow-2xl overflow-hidden animate-in md:fade-in md:slide-in-from-top-2 slide-in-from-bottom-4 duration-200 max-h-[70vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/50 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm">Notificaties</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500/15 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="flex items-center gap-1 text-[11px] text-green-400 hover:text-green-300 font-medium transition-colors disabled:opacity-50"
                  >
                    <Check size={12} />
                    {loading ? '...' : 'Alles gelezen'}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-gray-800/60"
                  aria-label="Sluiten"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 min-h-0 overscroll-contain">
              {notifications.length === 0 ? (
                <div className="py-12 px-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-800/60 flex items-center justify-center mx-auto mb-3">
                    <Bell size={20} className="text-gray-600" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Geen notificaties</p>
                  <p className="text-gray-600 text-xs mt-1">We laten het je weten als er iets gebeurt</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => {
                    const { icon: Icon, color } = getIcon(notification.type);
                    const { actor, action } = getText(notification);
                    return (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`w-full text-left px-5 py-3.5 hover:bg-gray-800/40 active:bg-gray-800/60 transition-colors flex items-start gap-3 group ${
                          !notification.read ? 'bg-green-500/[0.03]' : ''
                        }`}
                      >
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon size={14} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 leading-snug">
                            <span className="font-semibold text-white">{actor}</span>
                            {' '}{action}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: nl })}
                          </p>
                        </div>

                        {/* Unread dot + arrow */}
                        <div className="flex items-center gap-2 shrink-0 mt-1">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                          <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mobile drag indicator */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gray-600 md:hidden" />
          </div>
        </>
      )}
    </div>
  );
}
