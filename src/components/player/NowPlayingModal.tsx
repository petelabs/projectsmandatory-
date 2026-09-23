import React, { useState } from 'react';
import {
  ChevronDown,
  MoreVertical,
  MoreHorizontal,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  ListPlus,
  Download,
  Share2,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  DollarSign,
  Crown,
} from 'lucide-react';
import { usePlayback } from '../../context/PlaybackContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useToast } from '../../context/ToastContext';

interface NowPlayingModalProps {
  onNavigate: (path: string) => void;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({ onNavigate }) => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    isAdPlaying,
    currentAd,
    adCountdown,
    streamQualifiedNotice,
    isNowPlayingOpen,
    closeNowPlaying,
    togglePlay,
    seek,
    nextSong,
    prevSong,
    isShuffle,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
    isLiked,
    toggleLikeSong,
    offlineSongs,
    downloadForOffline,
  } = usePlayback();

  const { canDownloadOffline } = useSubscription();
  const { showToast } = useToast();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  if (!isNowPlayingOpen || !currentSong) return null;

  const isCurrentDownloaded = offlineSongs.includes(currentSong.id);
  const isSongLiked = isLiked(currentSong.id);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownload = async () => {
    if (!canDownloadOffline) {
      showToast('Offline downloads require Premium Plus plan', 'info');
      closeNowPlaying();
      onNavigate('/pricing');
      return;
    }
    const success = await downloadForOffline(currentSong);
    if (success) {
      showToast(`Downloaded "${currentSong.title}" for offline playback`, 'success');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/song/${currentSong.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentSong.title} by ${currentSong.artist}`,
          text: `Listen to "${currentSong.title}" on Projects Mandatory`,
          url: shareUrl,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Track link copied to clipboard!', 'success');
    }
  };

  const handleGoToArtist = () => {
    closeNowPlaying();
    const artistPath = currentSong.artistId ? `/artist/${currentSong.artistId}` : `/artists`;
    onNavigate(artistPath);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Now Playing: ${currentSong.title}`}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#080B12] text-white flex flex-col justify-between animate-in slide-in-from-bottom duration-300"
    >
      {/* Dynamic atmospheric subtle glow based on album art */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 blur-3xl scale-125"
        style={{
          backgroundImage: `url(${currentSong.coverImage})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#080B12]/80 via-[#080B12]/95 to-[#080B12]" />

      <div className="relative z-10 max-w-md sm:max-w-xl mx-auto w-full h-full min-h-screen px-6 py-6 flex flex-col justify-between text-left">
        
        {/* ===================================================
            TOP BAR: MINIMIZE BUTTON & MORE MENU
            =================================================== */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={closeNowPlaying}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95"
            aria-label="Collapse player"
          >
            <ChevronDown className="w-7 h-7 stroke-[2.2px]" />
          </button>

          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Now Playing
          </span>

          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95"
              aria-label="Song options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-12 w-52 rounded-2xl bg-[#11151F] border border-slate-800 p-2 shadow-2xl z-50 text-left">
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleGoToArtist();
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded-xl transition text-left"
                >
                  View Artist Profile
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleShare();
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded-xl transition text-left"
                >
                  Share Track Link
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    closeNowPlaying();
                    onNavigate(`/checkout/${currentSong.id}`);
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-950/40 rounded-xl transition text-left"
                >
                  Buy Master Audio (MK {currentSong.priceMWK?.toLocaleString()})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================
            ALBUM ARTWORK: LARGE, SQUARE, ATMOSPHERIC
            =================================================== */}
        <div className="my-auto py-4">
          <div className="relative aspect-square w-full max-w-[340px] sm:max-w-[380px] mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-white/10">
            <img
              src={currentSong.coverImage}
              alt={currentSong.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />

            {/* Free Ad Banner Overlay */}
            {isAdPlaying && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                <Sparkles className="w-10 h-10 text-[#F59E0B] animate-spin mb-3" />
                <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
                  Audio Sponsor Break
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {currentAd?.brandName || 'Projects Mandatory'}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xs">
                  {currentAd?.tagline || 'Support local African music. Upgrade to enjoy uninterrupted ad-free playback.'}
                </p>
                <div className="mt-4 px-4 py-1.5 rounded-full bg-slate-800 text-xs text-slate-400 font-mono">
                  Music resumes in {adCountdown}s
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================
            SONG METADATA & TITLE
            =================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
                {currentSong.title}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-sm sm:text-base text-slate-400 truncate">
                  {currentSong.artist}
                </span>
                {/* Verified Artist Green Badge (#18A558) */}
                <div
                  className="flex items-center justify-center w-4 h-4 rounded-full bg-[#18A558] text-white"
                  title="Verified Artist"
                >
                  <ShieldCheck className="w-3 h-3 stroke-[2.5px]" />
                </div>
              </div>
            </div>

            {/* Quick Heart/Like */}
            <button
              onClick={() => toggleLikeSong(currentSong.id)}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition active:scale-90 ${
                isSongLiked ? 'text-[#E53935]' : 'text-slate-400 hover:text-white'
              }`}
              aria-label={isSongLiked ? 'Unlike song' : 'Like song'}
            >
              <Heart className={`w-6 h-6 ${isSongLiked ? 'fill-current' : 'stroke-[1.8px]'}`} />
            </button>
          </div>

          {/* Stream Verified Banner */}
          {streamQualifiedNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-[#18A558]/40 flex items-center gap-2 text-xs text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-[#18A558] flex-shrink-0" />
              <span className="truncate">{streamQualifiedNotice}</span>
            </div>
          )}

          {/* ===================================================
              PROGRESS SCRUBBER & DURATION
              =================================================== */}
          <div className="space-y-1.5">
            <div className="relative group/scrub w-full h-2 bg-slate-800 rounded-full cursor-pointer flex items-center">
              <div
                className="h-full bg-white rounded-full relative transition-all"
                style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg" />
              </div>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                aria-label="Track progress slider"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 font-mono tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* ===================================================
              PRIMARY PLAYBACK CONTROLS
              =================================================== */}
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition active:scale-95 ${
                isShuffle ? 'text-[#18A558]' : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Toggle shuffle"
            >
              <Shuffle className="w-5 h-5 stroke-[2.2px]" />
            </button>

            {/* Previous Track */}
            <button
              onClick={prevSong}
              className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full text-white hover:text-slate-300 transition active:scale-90"
              aria-label="Previous song"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>

            {/* MAIN PLAY / PAUSE BUTTON (PROMINENT ACTION RED #E53935) */}
            <button
              onClick={togglePlay}
              disabled={isAdPlaying}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition active:scale-95 shadow-xl shadow-red-950/60 ${
                isAdPlaying
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-[#E53935] hover:bg-[#d32f2f] text-white hover:scale-105'
              }`}
              aria-label={isPlaying ? 'Pause song' : 'Play song'}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={nextSong}
              className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full text-white hover:text-slate-300 transition active:scale-90"
              aria-label="Next song"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition active:scale-95 ${
                isRepeat ? 'text-[#18A558]' : 'text-slate-400 hover:text-white'
              }`}
              aria-label="Toggle repeat"
            >
              <Repeat className="w-5 h-5 stroke-[2.2px]" />
            </button>
          </div>

          {/* ===================================================
              SECONDARY CONTROLS: LIKE, ADD, DOWNLOAD, SHARE
              =================================================== */}
          <div className="flex items-center justify-around py-2 border-t border-slate-800/80">
            <button
              onClick={() => toggleLikeSong(currentSong.id)}
              className="flex flex-col items-center gap-1 min-h-[44px] text-slate-400 hover:text-white transition"
              aria-label="Like song"
            >
              <Heart className={`w-5 h-5 ${isSongLiked ? 'text-[#E53935] fill-current' : ''}`} />
              <span className="text-[11px]">Like</span>
            </button>

            <button
              onClick={() => showToast('Added to your library playlist', 'success')}
              className="flex flex-col items-center gap-1 min-h-[44px] text-slate-400 hover:text-white transition"
              aria-label="Add to playlist"
            >
              <ListPlus className="w-5 h-5" />
              <span className="text-[11px]">Add</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex flex-col items-center gap-1 min-h-[44px] text-slate-400 hover:text-white transition"
              aria-label="Download for offline"
            >
              {isCurrentDownloaded ? (
                <CheckCircle2 className="w-5 h-5 text-[#18A558]" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span className="text-[11px]">{isCurrentDownloaded ? 'Saved' : 'Download'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1 min-h-[44px] text-slate-400 hover:text-white transition"
              aria-label="Share song"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-[11px]">Share</span>
            </button>
          </div>

          {/* ===================================================
              "ABOUT THE ARTIST" CARD
              =================================================== */}
          <div
            onClick={handleGoToArtist}
            className="p-3.5 rounded-2xl bg-[#11151F] border border-slate-800/80 hover:border-slate-700 cursor-pointer transition active:scale-[0.99] flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-800 ring-2 ring-[#1455D9]/40 flex-shrink-0">
                <img
                  src={
                    currentSong.coverImage ||
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop'
                  }
                  alt={currentSong.artist}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  About the artist
                </span>
                <h4 className="text-sm font-bold text-white leading-tight">
                  {currentSong.artist}
                </h4>
                <p className="text-xs text-slate-400">128K monthly listeners</p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>

        </div>
      </div>
    </div>
  );
};
