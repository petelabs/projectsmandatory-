import React from 'react';
import { Play, Pause, SkipForward, Volume2, Sparkles } from 'lucide-react';
import { usePlayback } from '../../context/PlaybackContext';
import { useTheme } from '../../context/ThemeContext';

export const MiniPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    isAdPlaying,
    currentAd,
    adCountdown,
    togglePlay,
    nextSong,
    openNowPlaying,
  } = usePlayback();

  const { isDark } = useTheme();

  if (!currentSong && !isAdPlaying) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={openNowPlaying}
      className={`fixed bottom-16 left-0 right-0 z-30 cursor-pointer select-none transition-all ${
        isDark
          ? 'bg-[#11151F] text-white border-t border-slate-800/90 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]'
          : 'bg-white text-[#111827] border-t border-[#E5E7EB] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]'
      }`}
      role="button"
      tabIndex={0}
      aria-label="Now Playing Mini Player. Tap to open full player."
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          openNowPlaying();
        }
      }}
    >
      {/* Real-time slim progress bar */}
      <div className="w-full h-1 bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-[#1455D9] via-[#E53935] to-[#F59E0B] transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto px-3 py-2 flex items-center justify-between gap-3">
        {/* Left: Artwork + Title + Artist */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 shadow-md">
            <img
              src={
                currentSong?.coverImage ||
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop'
              }
              alt={currentSong?.title || 'Song artwork'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {isPlaying && !isAdPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="flex items-end gap-[2px] h-3">
                  <span className="w-[2px] h-full bg-white animate-pulse" />
                  <span className="w-[2px] h-2/3 bg-white animate-bounce" />
                  <span className="w-[2px] h-4/5 bg-white animate-pulse" />
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-left">
            {isAdPlaying ? (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#F59E0B]">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Sponsor Break ({adCountdown}s)</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentAd?.brandName || 'Projects Mandatory Audio'}
                </p>
              </div>
            ) : (
              <div>
                <h4 className="text-xs sm:text-sm font-bold truncate leading-tight">
                  {currentSong?.title}
                </h4>
                <p
                  className={`text-[11px] truncate leading-normal ${
                    isDark ? 'text-[#9CA3AF]' : 'text-[#667085]'
                  }`}
                >
                  {currentSong?.artist}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div
          className="flex items-center gap-2 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sound / Equalizer status */}
          <div className="hidden sm:flex items-center text-slate-400 pr-1">
            <Volume2 className="w-4 h-4" />
          </div>

          {/* Play / Pause button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            disabled={isAdPlaying}
            className={`min-h-[44px] min-w-[44px] w-10 h-10 rounded-full flex items-center justify-center transition active:scale-90 shadow-md ${
              isAdPlaying
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] hover:scale-105'
            }`}
            aria-label={isPlaying ? 'Pause song' : 'Play song'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Next Track button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSong();
            }}
            disabled={isAdPlaying}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition active:scale-95 ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-black'
            }`}
            aria-label="Skip to next song"
          >
            <SkipForward className="w-4 h-4 stroke-[2.2px]" />
          </button>
        </div>
      </div>
    </div>
  );
};
