import React, { useState } from 'react';
import {
  Bell,
  Send,
  Trash2,
  CheckCircle2,
  Sparkles,
  Music,
  CreditCard,
  Crown,
  DollarSign,
  Award,
  Users,
  Search,
  ExternalLink,
  Radio,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  FirestoreNotificationRecord,
  publishNotificationToFirestore,
  deleteNotificationFromFirestore,
  markNotificationReadInFirestore,
} from '../../lib/firebase';
import { useToast } from '../../context/ToastContext';

interface AdminNotificationsTabProps {
  notifications: FirestoreNotificationRecord[];
}

export const AdminNotificationsTab: React.FC<AdminNotificationsTabProps> = ({ notifications }) => {
  const { showToast } = useToast();

  // Form State
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'ARTISTS' | 'USER'>('ALL');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [category, setCategory] = useState<'system' | 'listener' | 'artist'>('system');
  const [notifType, setNotifType] = useState<string>('announcement');
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter & Search State
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'SYSTEM' | 'LISTENER' | 'ARTIST'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Handle Publish
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Notification title is required', 'error');
      return;
    }
    if (!body.trim()) {
      showToast('Notification body message is required', 'error');
      return;
    }

    let recipientId = 'ALL';
    if (targetAudience === 'ARTISTS') {
      recipientId = 'ARTISTS';
    } else if (targetAudience === 'USER') {
      if (!targetUserId.trim()) {
        showToast('Please specify target user UID', 'error');
        return;
      }
      recipientId = targetUserId.trim();
    }

    setIsSubmitting(true);
    try {
      await publishNotificationToFirestore({
        title: title.trim(),
        body: body.trim(),
        category,
        type: notifType,
        link: link.trim() || undefined,
        userId: recipientId,
      });

      showToast('Notification successfully published to database!', 'success');
      setTitle('');
      setBody('');
      setLink('');
      setTargetUserId('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish notification';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, notifTitle: string) => {
    if (!window.confirm(`Permanently delete notification "${notifTitle}"?`)) return;
    try {
      await deleteNotificationFromFirestore(id);
      showToast('Notification deleted from database.', 'info');
    } catch {
      showToast('Could not delete notification', 'error');
    }
  };

  // Handle Mark Read
  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationReadInFirestore(id);
      showToast('Notification marked as read.', 'success');
    } catch {
      showToast('Could not update status', 'error');
    }
  };

  // Metrics
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const systemCount = notifications.filter((n) => n.category === 'system').length;
  const listenerCount = notifications.filter((n) => n.category === 'listener').length;
  const artistCount = notifications.filter((n) => n.category === 'artist').length;

  // Filtered List
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'UNREAD' && n.read) return false;
    if (activeFilter === 'SYSTEM' && n.category !== 'system') return false;
    if (activeFilter === 'LISTENER' && n.category !== 'listener') return false;
    if (activeFilter === 'ARTIST' && n.category !== 'artist') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title?.toLowerCase().includes(q);
      const matchBody = n.body?.toLowerCase().includes(q);
      const matchUser = n.userId?.toLowerCase().includes(q);
      return matchTitle || matchBody || matchUser;
    }
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'release':
        return <Music className="w-4 h-4 text-blue-400" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-purple-400" />;
      case 'subscription':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'payout':
      case 'royalty':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'milestone':
        return <Award className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white font-['Syne',sans-serif] flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-400" />
            <span>In-App Notification Dispatch & Real-Time Center</span>
          </h3>
          <p className="text-xs text-slate-400">
            Send real-time alerts directly into user notification inboxes across phones, tablets, and desktop.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Alerts</span>
          <span className="text-xl font-black text-white">{totalCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-amber-400 uppercase font-semibold block">Unread By Users</span>
          <span className="text-xl font-black text-amber-400">{unreadCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-blue-400 uppercase font-semibold block">System Broadcasts</span>
          <span className="text-xl font-black text-blue-400">{systemCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Listener Releases</span>
          <span className="text-xl font-black text-emerald-400">{listenerCount}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] text-purple-400 uppercase font-semibold block">Artist & Payout Alerts</span>
          <span className="text-xl font-black text-purple-400">{artistCount}</span>
        </div>
      </div>

      {/* Broadcast Form */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Send className="w-4 h-4 text-rose-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Broadcast New In-App Notification
          </h4>
        </div>

        <form onSubmit={handlePublish} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Target Audience */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Target Audience *
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="ALL">🌐 Broadcast to All Listeners & Users</option>
                <option value="ARTISTS">🎨 All Registered Artists</option>
                <option value="USER">👤 Specific User UID</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="system">System / Announcement</option>
                <option value="listener">Listener (Music, Releases, Perks)</option>
                <option value="artist">Artist (Submissions, Royalties, Payouts)</option>
              </select>
            </div>

            {/* Notification Type */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Notification Type *
              </label>
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="announcement">Announcement</option>
                <option value="release">New Release</option>
                <option value="payment">Payment & Purchase</option>
                <option value="subscription">Subscription</option>
                <option value="payout">Artist Payout</option>
                <option value="royalty">Royalty Statement</option>
                <option value="milestone">Artist Milestone</option>
                <option value="account">Account Notice</option>
              </select>
            </div>
          </div>

          {targetAudience === 'USER' && (
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Recipient User UID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. user-uid-123456"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Notification Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 🎉 New Anthems Dropped on Projects Mandatory!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Action Route / Link (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. /music or /pricing or /artist-studio"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Message Body *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Write the clear notification message for listeners or artists..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-950/40 disabled:opacity-50 transition active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Broadcasting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Notification to Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {[
            { id: 'ALL', label: `All (${totalCount})` },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'SYSTEM', label: `System (${systemCount})` },
            { id: 'LISTENER', label: `Listener (${listenerCount})` },
            { id: 'ARTIST', label: `Artist (${artistCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeFilter === tab.id
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="p-10 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
          <Bell className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">No notifications match this filter</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Use the form above to publish system alerts, releases, and payment confirmations to users.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                !notif.read
                  ? 'bg-slate-900 border-slate-700 shadow-md'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2.5 rounded-xl bg-slate-800 shrink-0 mt-0.5">
                  {getTypeIcon(notif.type)}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="text-xs font-bold text-white truncate max-w-md">
                      {notif.title}
                    </h5>

                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                      {notif.category}
                    </span>

                    <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400">
                      Target: {notif.userId === 'ALL' ? '🌐 All Users' : notif.userId === 'ARTISTS' ? '🎨 All Artists' : `👤 ${notif.userId}`}
                    </span>

                    {!notif.read && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold">
                        UNREAD
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {notif.body}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-0.5">
                    <span>{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Recent'}</span>
                    {notif.link && (
                      <span className="text-blue-400 font-mono flex items-center gap-1">
                        Link: {notif.link}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {!notif.read && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                    title="Mark as read"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Read</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(notif.id, notif.title)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
                  title="Delete notification"
                  aria-label="Delete notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
