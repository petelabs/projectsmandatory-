import React, { useState } from 'react';
import {
  User,
  Settings,
  ShieldCheck,
  Crown,
  Download,
  Heart,
  ListMusic,
  CreditCard,
  Sparkles,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Lock,
  ExternalLink,
  Gift,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { usePlayback } from '../context/PlaybackContext';
import { useTheme } from '../context/ThemeContext';
import { useAdmin } from '../context/AdminContext';
import { useToast } from '../context/ToastContext';
import { GiftSubscriptionModal } from '../components/monetization/GiftSubscriptionModal';
import { ClaimGiftModal } from '../components/monetization/ClaimGiftModal';
import { FamilyPlanModal } from '../components/monetization/FamilyPlanModal';

interface AccountPageProps {
  onNavigate: (path: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, logout, loginWithGoogle, loginAsGuest } = useAuth();
  const { currentTier, subscription, canDownloadOffline } = useSubscription();
  const { likedSongIds, offlineSongs } = usePlayback();
  const { theme, toggleTheme, isDark } = useTheme();
  const { isAdminAuthenticated } = useAdmin();
  const { showToast } = useToast();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showClaimGiftModal, setShowClaimGiftModal] = useState(false);
  const [showFamilyModal, setShowFamilyModal] = useState(false);

  const displayName = user?.name || 'Chipo M.';
  const displayEmail = user?.email || 'chipo@example.com';
  const displayAvatar =
    user?.photoURL ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';

  const isPremiumPlus = currentTier === 'PREMIUM_PLUS';
  const isPremium = currentTier === 'PREMIUM';

  const menuRows = [
    {
      id: 'library',
      label: 'My Library',
      count: `${likedSongIds.length} items`,
      action: () => onNavigate('/library'),
      icon: ListMusic,
    },
    {
      id: 'downloads',
      label: 'Downloads',
      count: `${offlineSongs.length} songs`,
      action: () => onNavigate('/library'),
      icon: Download,
    },
    {
      id: 'liked',
      label: 'Liked Songs',
      count: `${likedSongIds.length} songs`,
      action: () => onNavigate('/library'),
      icon: Heart,
    },
    {
      id: 'plans',
      label: 'Subscription & Plans',
      count: currentTier === 'FREE' ? 'Free Pass' : currentTier.replace('_', ' '),
      action: () => onNavigate('/pricing'),
      icon: Crown,
    },
    {
      id: 'family',
      label: 'Family Plan Sharing',
      count: 'Up to 6 accounts',
      action: () => setShowFamilyModal(true),
      icon: Users,
    },
    {
      id: 'gift',
      label: 'Gift a Subscription',
      count: 'Send to a friend',
      action: () => setShowGiftModal(true),
      icon: Gift,
    },
    {
      id: 'purchases',
      label: 'Payment History & Purchases',
      count: '',
      action: () => onNavigate('/purchases'),
      icon: CreditCard,
    },
    {
      id: 'studio',
      label: 'Artist Studio & Verification',
      count: 'Creator Portal',
      action: () => onNavigate('/artist/studio'),
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-5 pb-8 text-left">
      
      {/* ===================================================
          PROFILE HEADER: AVATAR, NAME, EMAIL, SETTINGS GEAR
          =================================================== */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-800 ring-4 ring-[#1455D9]/30">
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="text-left">
            <h1
              className={`text-lg sm:text-xl font-extrabold tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-[#111827]'
              }`}
            >
              {displayName}
            </h1>
            <p className="text-xs text-slate-400">{displayEmail}</p>
          </div>
        </div>

        {/* Settings Gear */}
        <button
          onClick={() => setShowSettingsModal(true)}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition active:scale-95 ${
            isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-200'
          }`}
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 stroke-[2.2px]" />
        </button>
      </div>

      {/* ===================================================
          MEMBERSHIP STATUS CARD
          =================================================== */}
      <div
        className={`p-4 rounded-3xl border relative overflow-hidden transition ${
          isPremiumPlus
            ? 'bg-gradient-to-r from-amber-600/20 via-orange-600/10 to-[#11151F] border-amber-500/40'
            : isPremium
            ? 'bg-gradient-to-r from-[#1455D9]/20 to-[#11151F] border-[#1455D9]/40'
            : isDark
            ? 'bg-[#11151F] border-slate-800'
            : 'bg-white border-[#E5E7EB] shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B]">
                {isPremiumPlus
                  ? 'Premium Plus'
                  : isPremium
                  ? 'Premium'
                  : 'Free Pass'}
              </span>
              {(isPremiumPlus || isPremium) && (
                <ShieldCheck className="w-4 h-4 text-[#18A558]" />
              )}
            </div>

            <p className="text-sm font-bold">
              {isPremiumPlus
                ? 'Active until Apr 25, 2026'
                : isPremium
                ? 'Active Monthly Subscription'
                : 'Ad-Supported Free Plan'}
            </p>
            <p className="text-xs text-slate-400">
              {isPremiumPlus
                ? 'Offline downloads enabled • Highest studio quality'
                : isPremium
                ? 'Ad-free listening enabled'
                : 'Standard audio • Upgradable anytime'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowClaimGiftModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 hover:border-slate-600 text-slate-300 transition active:scale-95 flex items-center gap-1.5"
            >
              <Gift className="w-3.5 h-3.5 text-rose-400" />
              <span>Redeem Code</span>
            </button>
            <button
              onClick={() => onNavigate('/pricing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 shadow-md ${
                isPremiumPlus
                  ? 'bg-amber-500 text-black hover:bg-amber-400'
                  : 'bg-[#E53935] text-white hover:bg-[#d32f2f]'
              }`}
            >
              {isPremiumPlus ? 'Manage' : 'Upgrade'}
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================
          MENU ROWS (LIBRARY, DOWNLOADS, LIKED, SETTINGS)
          =================================================== */}
      <div
        className={`rounded-3xl border overflow-hidden divide-y ${
          isDark
            ? 'bg-[#11151F] border-slate-800 divide-slate-800/80 text-white'
            : 'bg-white border-[#E5E7EB] divide-slate-100 text-[#111827] shadow-sm'
        }`}
      >
        {menuRows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.id}
              onClick={row.action}
              className={`p-3.5 flex items-center justify-between cursor-pointer transition select-none active:scale-[0.99] ${
                isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2px]" />
                </div>
                <span className="text-sm font-semibold">{row.label}</span>
              </div>

              <div className="flex items-center gap-2">
                {row.count && (
                  <span className="text-xs text-slate-400 font-medium">
                    {row.count}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          );
        })}

        {/* Admin Dashboard if authenticated or accessible */}
        {isAdminAuthenticated && (
          <div
            onClick={() => onNavigate('/admin')}
            className={`p-3.5 flex items-center justify-between cursor-pointer transition select-none active:scale-[0.99] ${
              isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-950/40 text-purple-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-purple-400">
                Admin Console
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        )}

        {/* Theme Toggle Row */}
        <div
          onClick={toggleTheme}
          className={`p-3.5 flex items-center justify-between cursor-pointer transition select-none active:scale-[0.99] ${
            isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </div>
            <span className="text-sm font-semibold">Theme Mode</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1455D9]">
              {isDark ? 'Dark Theme' : 'Light Theme'}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* WhatsApp Help & Support */}
        <a
          href="https://wa.me/265999000000"
          target="_blank"
          rel="noopener noreferrer"
          className={`p-3.5 flex items-center justify-between cursor-pointer transition select-none active:scale-[0.99] ${
            isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-emerald-600'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold">Help & Support (WhatsApp)</span>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-400" />
        </a>
      </div>

      {/* ===================================================
          BIG ROUNDED RED ACTION BUTTON: "LOG OUT" (#E53935)
          =================================================== */}
      <button
        onClick={() => {
          logout();
          showToast('Logged out successfully', 'info');
        }}
        className="w-full py-3.5 rounded-2xl bg-[#E53935] hover:bg-[#d32f2f] active:scale-[0.99] text-white font-bold text-sm transition shadow-lg shadow-red-950/40 flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4 stroke-[2.2px]" />
        <span>Log Out</span>
      </button>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-left space-y-4 animate-in fade-in zoom-in-95 ${
              isDark ? 'bg-[#11151F] border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">App Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold">Streaming Quality</h4>
                  <p className="text-[11px] text-slate-400">
                    {isPremiumPlus ? 'Master High (320kbps)' : 'Standard (160kbps)'}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#1455D9]">
                  {isPremiumPlus ? 'Auto HD' : 'Standard'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold">Data Saver</h4>
                  <p className="text-[11px] text-slate-400">Reduces cellular data on mobile</p>
                </div>
                <input type="checkbox" defaultChecked className="toggle rounded accent-[#1455D9]" />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-2.5 rounded-xl bg-[#1455D9] text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gift Subscription Modal */}
      {showGiftModal && (
        <GiftSubscriptionModal
          isOpen={showGiftModal}
          onClose={() => setShowGiftModal(false)}
          onSuccess={(gift) => {
            showToast(`Gift code "${gift.claimCode}" generated! Share with your friend.`, 'success');
          }}
        />
      )}

      {/* Claim Gift Modal */}
      {showClaimGiftModal && (
        <ClaimGiftModal
          isOpen={showClaimGiftModal}
          onClose={() => setShowClaimGiftModal(false)}
          onSuccess={(gift) => {
            showToast(`Awesome! ${gift.durationMonths} months of ${gift.tier.replace('_', ' ')} activated!`, 'success');
          }}
        />
      )}

      {/* Family Plan Modal */}
      {showFamilyModal && (
        <FamilyPlanModal
          isOpen={showFamilyModal}
          onClose={() => setShowFamilyModal(false)}
        />
      )}

    </div>
  );
};
