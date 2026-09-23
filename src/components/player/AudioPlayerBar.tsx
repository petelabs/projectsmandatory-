import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Disc3,
  ExternalLink,
  Crown,
  Radio,
} from 'lucide-react';
import { usePlayback } from '../../context/PlaybackContext';
import { useSubscription } from '../../context/SubscriptionContext';

interface AudioPlayerBarProps {
  onOpenPricing?: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({ onOpenPricing }) => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isAdPlaying,
    currentAd,
    adCountdown,
    streamQualifiedNotice,
    togglePlay,
    seek,
    setVolumeLevel,
    toggleMute,
    nextSong,
    prevSong,
    dismissAd,
    offlineSongs,
    downloadForOffline,
  } = usePlayback();

  const { currentTier, canDownloadOffline, audioQuality } = useSubscription();

  if (!currentSong && !isAdPlaying) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isCurrentDownloaded = currentSong ? offlineSongs.includes(currentSong.id) : false;

  const handleDownloadClick = async () => {
    if (!currentSong) return;
    if (!canDownloadOffline) {
      if (onOpenPricing) onOpenPricing();
      return;
    }
    await downloadForOffline(currentSong);
  };

  return (
    <>
      {/* Stream verified toast notification */}
      {streamQualifiedNotice && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-semibold rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{streamQualifiedNotice}</span>
        </div>
      )}

      {/* Persistent Audio Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] pb-safe">
        {/* Progress Bar (interactive scrubber) */}
        {!isAdPlaying && (
          <div className="relative group/scrub w-full h-1.5 bg-slate-800 cursor-pointer">
            <div
              className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 relative transition-all"
              style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover/scrub:scale-100 transition-transform" />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Seek track position"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-4">
          
          {/* Ad Break View for Free Tier */}
          {isAdPlaying && currentAd ? (
            <div className="w-full flex items-center justify-between gap-4 py-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                      Sponsor Break
                    </span>
                    <span className="text-xs font-bold text-white">{currentAd.brandName}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{currentAd.tagline}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400">Ad: 0:0{adCountdown}</span>
                {onOpenPricing && (
                  <button
                    onClick={onOpenPricing}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-rose-900/40"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Skip with Premium</span>
                  </button>
                )}
                <button
                  onClick={dismissAd}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            /* Regular Track Player View */
            <>
              {/* Left: Track Info & Artwork */}
              <div className="flex items-center gap-3 min-w-0 max-w-[200px] sm:max-w-xs md:max-w-sm">
                {currentSong?.coverImage && (
                  <img
                    src={currentSong.coverImage}
                    alt={currentSong.title}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-white/10 shrink-0 shadow-md"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate leading-tight">
                    {currentSong?.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">
                    {currentSong?.artist}
                  </p>
                  
                  {/* Quality & Tier Badge */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold flex items-center gap-1 ${
                      currentTier === 'PREMIUM_PLUS'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : currentTier === 'PREMIUM'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      <Disc3 className="w-2.5 h-2.5" />
                      {currentTier === 'PREMIUM_PLUS' ? 'Master 24bit' : currentTier === 'PREMIUM' ? 'HQ 320k' : 'Standard 128k'}
                    </span>

                    {currentTier === 'FREE' && (
                      <span className="text-[10px] text-slate-500 hidden sm:inline">
                        • Ad-Supported
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Center: Controls & Play/Pause */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={prevSong}
                    aria-label="Previous track"
                    className="p-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pause track' : 'Play track'}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-950/60 active:scale-95 transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={nextSong}
                    aria-label="Next track"
                    className="p-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* Timers */}
                <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right: Offline Download, Tier Upgrade & Volume */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Offline Download Button */}
                <button
                  onClick={handleDownloadClick}
                  title={
                    canDownloadOffline
                      ? isCurrentDownloaded
                        ? 'Downloaded for offline listening'
                        : 'Save track offline (Premium Plus)'
                      : 'Upgrade to Premium Plus for offline downloads'
                  }
                  className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-semibold ${
                    isCurrentDownloaded
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : canDownloadOffline
                      ? 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-amber-400'
                  }`}
                >
                  {isCurrentDownloaded ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="hidden md:inline">Saved Offline</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span className="hidden md:inline">
                        {canDownloadOffline ? 'Save Offline' : 'Offline (Plus)'}
                      </span>
                    </>
                  )}
                </button>

                {/* Upgrade CTA for Free Users */}
                {currentTier === 'FREE' && onOpenPricing && (
                  <button
                    onClick={onOpenPricing}
                    className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold text-xs shadow-md shadow-rose-950/40 hover:brightness-110 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Go Ad-Free (MK 1,000)</span>
                  </button>
                )}

                {/* Volume Slider */}
                <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
                  <button
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolumeLevel(Number(e.target.value))}
                    aria-label="Volume level"
                    className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
};
