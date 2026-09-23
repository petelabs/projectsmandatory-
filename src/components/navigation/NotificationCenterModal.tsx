import React, { useState } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Music,
  Download,
  CreditCard,
  Crown,
  Award,
  DollarSign,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useNotifications, NotificationCategory, AppNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    preferences,
    updatePreferences,
  } = useNotifications();

  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'listener' | 'artist'>('all');
  const [showPreferences, setShowPreferences] = useState(false);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'listener') return n.category === 'listener';
    if (activeTab === 'artist') return n.category === 'artist';
    return true;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'release':
        return <Music className="w-4 h-4 text-blue-400" />;
      case 'download':
        return <Download className="w-4 h-4 text-emerald-400" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-purple-400" />;
      case 'subscription':
        return <Crown className="w-4 h-4 text-amber-400" />;
      case 'milestone':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'royalty':
      case 'payout':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    if (notif.link) {
      onNavigate(notif.link);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div
        className={`w-full max-w-md h-[88vh] max-h-[600px] rounded-3xl flex flex-col shadow-2xl border overflow-hidden relative ${
          isDark ? 'bg-[#0B0F19] border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
              <Bell className="w-5 h-5 stroke-[2px]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Notifications</h2>
              <p className="text-[11px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className={`p-2 rounded-full transition ${
                showPreferences
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100'
              }`}
              title="Notification Settings"
              aria-label="Notification Preferences"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-black hover:bg-slate-100'
              }`}
              aria-label="Close notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preferences Toggle Overlay View */}
        {showPreferences ? (
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1455D9]">Notification Preferences</h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-xs text-slate-400 hover:text-white font-semibold"
              >
                Done
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Customize which notification alerts you receive on your device.
            </p>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <div>
                  <span className="text-xs font-bold block">New Music Releases</span>
                  <span className="text-[10px] text-slate-400">Alerts when artists you follow drop new music</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.newReleases}
                  onChange={(e) => updatePreferences({ newReleases: e.target.checked })}
                  className="w-4 h-4 accent-[#1455D9] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <div>
                  <span className="text-xs font-bold block">Offline Download Confirmation</span>
                  <span className="text-[10px] text-slate-400">Alerts when offline track saving finishes</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.downloads}
                  onChange={(e) => updatePreferences({ downloads: e.target.checked })}
                  className="w-4 h-4 accent-[#1455D9] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <div>
                  <span className="text-xs font-bold block">Payments & Subscriptions</span>
                  <span className="text-[10px] text-slate-400">Receipts and subscription renewal notices</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.payments}
                  onChange={(e) => updatePreferences({ payments: e.target.checked })}
                  className="w-4 h-4 accent-[#1455D9] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <div>
                  <span className="text-xs font-bold block">Artist Milestones & Stats</span>
                  <span className="text-[10px] text-slate-400">Stream benchmarks and follower milestones</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.artistMilestones}
                  onChange={(e) => updatePreferences({ artistMilestones: e.target.checked })}
                  className="w-4 h-4 accent-[#1455D9] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 cursor-pointer">
                <div>
                  <span className="text-xs font-bold block">Royalty Statements & Payouts</span>
                  <span className="text-[10px] text-slate-400">Earnings summaries and distribution reports</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.royalties}
                  onChange={(e) => updatePreferences({ royalties: e.target.checked })}
                  className="w-4 h-4 accent-[#1455D9] rounded"
                />
              </label>
            </div>
          </div>
        ) : (
          <>
            {/* Filter Tabs & Quick Actions */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800/80 shrink-0 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1">
                {(['all', 'unread', 'listener', 'artist'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition ${
                      activeTab === tab
                        ? 'bg-[#1455D9] text-white'
                        : isDark
                        ? 'bg-slate-800/60 text-slate-400 hover:text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-black'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-[#1455D9] hover:underline shrink-0 flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 text-left">
              {filteredNotifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                  <div className="p-4 rounded-full bg-slate-800/40 text-slate-500">
                    <Bell className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="text-sm font-semibold">No notifications in this view</p>
                  <p className="text-xs text-slate-500 max-w-xs">
                    You're all caught up! New music drops, download confirmations, and payouts will appear here.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`group relative p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none active:scale-[0.99] ${
                      !n.read
                        ? isDark
                          ? 'bg-[#1455D9]/10 border-[#1455D9]/30 hover:bg-[#1455D9]/15'
                          : 'bg-blue-50 border-blue-200 hover:bg-blue-100/60'
                        : isDark
                        ? 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-slate-800/80 shrink-0 mt-0.5">
                      {getNotifIcon(n.type)}
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-bold truncate ${!n.read ? 'text-white' : 'text-slate-300'}`}>
                          {n.title}
                        </p>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-700/30">
                        <span className="text-[10px] text-slate-500 font-medium">{n.timestamp}</span>
                        {n.link && (
                          <span className="text-[10px] text-[#1455D9] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            View <ChevronRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread Badge Indicator */}
                    {!n.read && (
                      <span className="absolute top-3.5 right-3 w-2 h-2 rounded-full bg-[#1455D9]" />
                    )}

                    {/* Delete action button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
                <button
                  onClick={clearAll}
                  className="text-xs text-rose-400 hover:underline font-semibold"
                >
                  Clear all
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
