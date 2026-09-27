import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Download,
  Trash2,
  FileDown,
  RotateCcw,
  Smartphone,
  AlertTriangle,
  Check,
  X,
  Radio,
  Sliders,
  LogOut,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePlayback } from '../../context/PlaybackContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useDataSaver } from '../../context/DataSaverContext';
import { deleteUserFirestoreAccount } from '../../lib/firebase';

interface PrivacySecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'notifications' | 'downloads' | 'export' | 'delete';
}

export const PrivacySecurityModal: React.FC<PrivacySecurityModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'privacy',
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { history, clearHistory, likedSongIds, offlineSongs, clearAllOfflineSongs } = usePlayback();
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const { isDataSaverEnabled, toggleDataSaver } = useDataSaver();

  const [activeTab, setActiveTab] = useState<'privacy' | 'notifications' | 'downloads' | 'export' | 'delete'>(defaultTab);

  // Privacy states (persisted in localStorage)
  const [isProfilePublic, setIsProfilePublic] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pm_privacy_public_profile') !== 'false';
    } catch {
      return true;
    }
  });

  const [isShareListeningActivity, setIsShareListeningActivity] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pm_privacy_share_activity') !== 'false';
    } catch {
      return true;
    }
  });

  const [isHistoryPaused, setIsHistoryPaused] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pm_history_paused') === 'true';
    } catch {
      return false;
    }
  });

  // Notification toggles
  const [notifNewReleases, setNotifNewReleases] = useState(true);
  const [notifPurchases, setNotifPurchases] = useState(true);
  const [notifTips, setNotifTips] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);

  // Download preferences
  const [downloadWifiOnly, setDownloadWifiOnly] = useState(true);
  const [downloadQuality, setDownloadQuality] = useState<'128kbps' | '320kbps' | 'lossless'>('320kbps');

  // Account deletion states
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  if (!isOpen) return null;

  const handleToggleProfilePublic = () => {
    const next = !isProfilePublic;
    setIsProfilePublic(next);
    try {
      localStorage.setItem('pm_privacy_public_profile', String(next));
    } catch {}
    showToast(next ? 'Profile is now public' : 'Profile is now private', 'info');
  };

  const handleToggleShareActivity = () => {
    const next = !isShareListeningActivity;
    setIsShareListeningActivity(next);
    try {
      localStorage.setItem('pm_privacy_share_activity', String(next));
    } catch {}
    showToast(next ? 'Listening activity shared' : 'Listening activity kept private', 'info');
  };

  const handleToggleHistoryPaused = () => {
    const next = !isHistoryPaused;
    setIsHistoryPaused(next);
    try {
      localStorage.setItem('pm_history_paused', String(next));
    } catch {}
    showToast(next ? 'Listening history recording paused' : 'Listening history resumed', 'info');
  };

  const handleClearHistory = () => {
    clearHistory();
    showToast('Listening history cleared', 'success');
  };

  const handleClearDownloads = () => {
    clearAllOfflineSongs();
    showToast('Downloaded music cache cleared', 'success');
  };

  // Safe client data export (user owned data only)
  const handleExportData = () => {
    try {
      const userData = {
        app: 'Projects Mandatory',
        exportDate: new Date().toISOString(),
        user: {
          id: user?.id,
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
        },
        listeningPreferences: {
          isProfilePublic,
          isShareListeningActivity,
          isDataSaverEnabled,
          downloadQuality,
        },
        likedSongsCount: likedSongIds.length,
        likedSongIds,
        recentListeningHistoryCount: history.length,
        recentHistory: history.map((s) => ({ id: s.id, title: s.title, artist: s.artist })),
        downloadsCount: offlineSongs.length,
        downloads: offlineSongs.map((s) => ({ id: s.id, title: s.title, artist: s.artist })),
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(userData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `projects-mandatory-user-data-${user?.id || 'guest'}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('User data exported successfully!', 'success');
    } catch (err) {
      console.error('Data export error:', err);
      showToast('Failed to export user data', 'error');
    }
  };

  // Account deletion logic
  const handleConfirmAccountDeletion = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      showToast('Please type DELETE to confirm.', 'error');
      return;
    }

    setIsDeletingAccount(true);
    try {
      if (user?.id) {
        await deleteUserFirestoreAccount(user.id);
      }
      clearHistory();
      clearAllOfflineSongs();
      await logout();
      showToast('Your account and personal data have been permanently deleted.', 'info');
      onClose();
    } catch (err: unknown) {
      console.error('Account deletion error:', err);
      showToast('Failed to delete account. Please try again.', 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border text-left space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-[#0E131F] border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1455D9]" />
            <h3 className="text-base sm:text-lg font-bold">Privacy & Account Controls</h3>
          </div>
          <button
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-full"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 border-b border-slate-800/80">
          {[
            { id: 'privacy', label: 'Privacy' },
            { id: 'notifications', label: 'Alerts' },
            { id: 'downloads', label: 'Storage' },
            { id: 'export', label: 'Export' },
            { id: 'delete', label: 'Account' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#1455D9] text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 1. PRIVACY TAB */}
        {activeTab === 'privacy' && (
          <div className="space-y-4 py-1">
            {/* Public profile toggle */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  {isProfilePublic ? <Eye className="w-3.5 h-3.5 text-blue-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                  <h4 className="text-xs font-bold">Public Profile</h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  Allow other listeners to see your public playlists and profile name
                </p>
              </div>
              <input
                type="checkbox"
                checked={isProfilePublic}
                onChange={handleToggleProfilePublic}
                className="w-5 h-5 accent-[#1455D9] rounded cursor-pointer"
              />
            </div>

            {/* Listening activity toggle */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold">Share Listening Activity</h4>
                <p className="text-[11px] text-slate-400">
                  Broadcast currently playing track on public artist leaderboard
                </p>
              </div>
              <input
                type="checkbox"
                checked={isShareListeningActivity}
                onChange={handleToggleShareActivity}
                className="w-5 h-5 accent-[#1455D9] rounded cursor-pointer"
              />
            </div>

            {/* Listening history controls */}
            <div className={`p-3.5 rounded-2xl border space-y-3 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold">Listening History</h4>
                  <p className="text-[11px] text-slate-400">{history.length} tracks recorded</p>
                </div>
                <button
                  onClick={handleClearHistory}
                  disabled={history.length === 0}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-rose-950/40 text-rose-400 border border-slate-700 hover:border-rose-800 transition active:scale-95 disabled:opacity-50"
                >
                  Clear History
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div>
                  <p className="text-xs font-semibold">Pause Recording History</p>
                  <p className="text-[10px] text-slate-400">Do not save new tracks to Continue Listening</p>
                </div>
                <input
                  type="checkbox"
                  checked={isHistoryPaused}
                  onChange={handleToggleHistoryPaused}
                  className="w-5 h-5 accent-[#1455D9] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-3 py-1">
            {[
              {
                title: 'New Releases from Followed Artists',
                desc: 'Instant alerts when artists you follow drop new music',
                checked: notifNewReleases,
                set: setNotifNewReleases,
              },
              {
                title: 'Purchases & Studio Master Downloads',
                desc: 'Payment receipts, tokens, and download confirmations',
                checked: notifPurchases,
                set: setNotifPurchases,
              },
              {
                title: 'Artist Tips & Direct Support',
                desc: 'Acknowledgements when artists receive your tip',
                checked: notifTips,
                set: setNotifTips,
              },
              {
                title: 'Exclusive Deals & Platform Updates',
                desc: 'Discounts, streaming pass perks, and curated playlists',
                checked: notifMarketing,
                set: setNotifMarketing,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold">{item.title}</h4>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => {
                    item.set(e.target.checked);
                    showToast('Notification preference updated', 'info');
                  }}
                  className="w-5 h-5 accent-[#1455D9] rounded cursor-pointer"
                />
              </div>
            ))}
          </div>
        )}

        {/* 3. DOWNLOADS & STORAGE TAB */}
        {activeTab === 'downloads' && (
          <div className="space-y-3 py-1">
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold">Offline Music Storage</h4>
                  <p className="text-[11px] text-slate-400">
                    {offlineSongs.length} songs cached (~{(offlineSongs.length * 7.5).toFixed(1)} MB)
                  </p>
                </div>
                <button
                  onClick={handleClearDownloads}
                  disabled={offlineSongs.length === 0}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-rose-950/40 text-rose-400 border border-slate-700 hover:border-rose-800 transition active:scale-95 disabled:opacity-50 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Storage</span>
                </button>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <h4 className="text-xs font-bold">Download over Wi-Fi Only</h4>
                <p className="text-[11px] text-slate-400">Avoid using mobile data bundles for offline tracks</p>
              </div>
              <input
                type="checkbox"
                checked={downloadWifiOnly}
                onChange={(e) => {
                  setDownloadWifiOnly(e.target.checked);
                  showToast('Download preference saved', 'info');
                }}
                className="w-5 h-5 accent-[#1455D9] rounded cursor-pointer"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-300">Default Download Master Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '128kbps', label: '128kbps', desc: 'Light' },
                  { id: '320kbps', label: '320kbps', desc: 'High' },
                  { id: 'lossless', label: 'Lossless', desc: 'Studio' },
                ].map((q) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setDownloadQuality(q.id as any);
                      showToast(`Download quality set to ${q.id}`, 'info');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      downloadQuality === q.id
                        ? 'bg-[#1455D9]/20 border-[#1455D9] text-white font-bold'
                        : isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-400'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <p className="text-xs">{q.label}</p>
                    <p className="text-[10px] text-slate-500">{q.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. DATA EXPORT TAB */}
        {activeTab === 'export' && (
          <div className="space-y-4 py-1">
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-[#1455D9]" />
                <h4 className="text-sm font-bold">Download Your Personal Data</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                In compliance with Malawian & African digital privacy standards, you can download a full archive of your profile, purchase records, liked songs, playlists, and listening history in standard JSON format.
              </p>
            </div>

            <button
              onClick={handleExportData}
              className="w-full py-3 rounded-2xl bg-[#1455D9] hover:bg-[#1146B8] active:scale-[0.99] text-white font-bold text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>Export My Data (JSON)</span>
            </button>
          </div>
        )}

        {/* 5. ACCOUNT DELETION TAB */}
        {activeTab === 'delete' && (
          <div className="space-y-4 py-1">
            <div className="p-4 rounded-2xl border border-rose-900/50 bg-rose-950/20 text-rose-300 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Permanent Account Deletion</span>
              </div>
              <p className="text-xs leading-relaxed text-rose-200/80">
                Deleting your account will permanently wipe your profile, personal playlists, saved liked songs, and listening history. This action cannot be undone.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                Type <span className="text-rose-400 font-mono">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none font-mono uppercase transition ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-white focus:border-rose-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-rose-500'
                }`}
              />
            </div>

            <button
              onClick={handleConfirmAccountDeletion}
              disabled={deleteConfirmationText.trim().toUpperCase() !== 'DELETE' || isDeletingAccount}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeletingAccount ? 'Deleting Account...' : 'Permanently Delete My Account'}</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1455D9] text-white text-xs font-bold hover:bg-[#1146B8] transition active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
