import React, { useState } from 'react';
import { Bell, ArrowLeft, Moon, Sun, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationCenterModal } from './NotificationCenterModal';

interface TopAppBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  title?: string;
  showBack?: boolean;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  currentPath,
  onNavigate,
  title,
  showBack = false,
}) => {
  const { user } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { unreadCount } = useNotifications();
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  return (
    <header
      className={`sticky top-0 z-30 transition-colors backdrop-blur-md border-b ${
        isDark
          ? 'bg-[#080B12]/90 border-slate-800/80 text-white'
          : 'bg-[#F7F8FA]/90 border-[#E5E7EB] text-[#111827]'
      }`}
    >
      <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        
        {/* Left: Back Button OR Logo */}
        <div className="flex items-center gap-2.5">
          {showBack ? (
            <button
              onClick={() => window.history.back()}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-full transition active:scale-95 ${
                isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-black hover:bg-slate-200'
              }`}
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2px]" />
            </button>
          ) : (
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2 group text-left"
              aria-label="Projects Mandatory Home"
            >
              {/* Branded Triangular App Icon matching the mockup */}
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1455D9] via-[#E53935] to-[#F59E0B] p-[1.5px] shadow-sm">
                <div className="w-full h-full bg-[#080B12] rounded-[6px] flex items-center justify-center">
                  <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-[#F59E0B] ml-0.5" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight leading-tight uppercase font-['Inter',sans-serif]">
                  PROJECTS
                </span>
                <span className="text-[10px] font-bold tracking-widest leading-none text-[#1455D9] uppercase">
                  MANDATORY
                </span>
              </div>
            </button>
          )}

          {title && (
            <h1 className="text-base font-bold truncate max-w-[200px] sm:max-w-[300px]">
              {title}
            </h1>
          )}
        </div>

        {/* Right: Actions (Theme Toggle, Notifications, User Avatar) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full transition active:scale-95 ${
              isDark ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationCenter(true)}
              className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full relative transition active:scale-95 ${
                isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-200'
              }`}
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5 stroke-[1.8px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#E53935] text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-[#080B12]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Profile Shortcut Avatar */}
          <button
            onClick={() => onNavigate('/profile')}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full overflow-hidden ring-2 ring-[#1455D9]/40 hover:ring-[#1455D9] transition active:scale-95"
            aria-label="Go to Profile"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name || 'User avatar'}
                className="w-8 h-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1455D9] to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.name ? user.name.slice(0, 1).toUpperCase() : 'M'}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        onNavigate={onNavigate}
      />
    </header>
  );
};

