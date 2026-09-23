import React, { useState } from 'react';
import {
  ChevronDown,
  MoreVertical,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListPlus,
  ListMusic,
  Download,
  Share2,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Trash2,
  ArrowUp,
  ArrowDown,
  Disc3,
  Volume2,
  RefreshCw,
  AlertCircle,
  FolderPlus,
} from 'lucide-react';
import { usePlayback } from '../../context/PlaybackContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useLibrary } from '../../context/LibraryContext';
import { useToast } from '../../context/ToastContext';
import { SongActionMenuModal } from '../common/SongActionMenuModal';
import { Song } from '../../types';
import { shareSong } from '../../lib/share';

interface NowPlayingModalProps {
  onNavigate: (path: string) => void;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({ onNavigate }) => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    queue,
    queueIndex,
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
    repeatMode,
    toggleRepeat,
    isAutoplayEnabled,
    toggleAutoplay,
    isLiked,
    toggleLikeSong,
    playSong,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    setQueueIndexDirectly,
    audioError,
    retryPlayback,
  } = usePlayback();

  const {
    openAddToPlaylist,
    startDownload,
    downloads,
    saveQueueAsPlaylist,
  } = useLibrary();

  const { canDownloadOffline } = useSubscription();
  const { showToast } = useToast();
  const [activeView, setActiveView] = useState<'track' | 'queue'>('track');
  const [selectedMenuSong, setSelectedMenuSong] = useState<Song | null>(null);
  const [isSavingQueuePlaylist, setIsSavingQueuePlaylist] = useState(false);
  const [queuePlaylistName, setQueuePlaylistName] = useState('');

  if (!isNowPlayingOpen || !currentSong) return null;

  const isCurrentDownloaded = downloads.some(
    (d) => d.songId === currentSong.id && d.status === 'completed'
  );
  const isSongLiked = isLiked(currentSong.id);
  const upcomingQueue = queue.slice(queueIndex + 1);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownload = async () => {
    await startDownload(currentSong);
  };

  const handleShare = async () => {
    await shareSong(currentSong, () => {
      showToast('Track link copied to clipboard!', 'success');
    });
  };

  const handleGoToArtist = () => {
    closeNowPlaying();
    const artistPath = currentSong.artistId ? `/artist/${currentSong.artistId}` : `/artists`;
    onNavigate(artistPath);
  };

  const handleClearQueue = () => {
    clearQueue();
    showToast('Up Next queue cleared', 'info');
  };

  const handleSaveQueueAsPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queuePlaylistName.trim()) {
      showToast('Please enter a playlist name', 'info');
      return;
    }
    const created = saveQueueAsPlaylist(queuePlaylistName.trim(), queue);
    showToast(`Saved ${queue.length} queue tracks into "${created.title}"`, 'success');
    setIsSavingQueuePlaylist(false);
    setQueuePlaylistName('');
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Now Playing: ${currentSong.title}`}
        className="fixed inset-0 z-50 overflow-y-auto bg-[#080B12] text-white flex flex-col justify-between animate-in slide-in-from-bottom duration-300"
      >
        {/* Dynamic atmospheric background glow based on album art */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25 blur-3xl scale-125"
          style={{
            backgroundImage: `url(${currentSong.coverImage})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#080B12]/80 via-[#080B12]/95 to-[#080B12]" />

        <div className="relative z-10 max-w-md sm:max-w-xl mx-auto w-full h-full min-h-screen px-5 py-4 flex flex-col justify-between text-left">
          
          {/* ===================================================
              TOP BAR: MINIMIZE BUTTON, VIEW SWITCHER & ACTIONS
              =================================================== */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={closeNowPlaying}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95"
              aria-label="Collapse player"
            >
              <ChevronDown className="w-7 h-7 stroke-[2.2px]" />
            </button>

            {/* Segmented View Switcher: Track / Queue */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-full p-0.5 shadow-inner">
              <button
                onClick={() => setActiveView('track')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeView === 'track'
                    ? 'bg-[#1455D9] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Now Playing
              </button>
              <button
                onClick={() => setActiveView('queue')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeView === 'queue'
                    ? 'bg-[#1455D9] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>Up Next</span>
                {upcomingQueue.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-mono">
                    {upcomingQueue.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => setSelectedMenuSong(currentSong)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95"
              aria-label="Song options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* ===================================================
              VIEW 1: TRACK COVER & PRIMARY DETAILS
              =================================================== */}
          {activeView === 'track' ? (
            <div className="my-auto py-3 space-y-5">
              
              {/* Album Art Container */}
              <div className="relative aspect-square w-full max-w-[320px] sm:max-w-[360px] mx-auto rounded-3xl overflow-hidden bg-slate-900 shadow-2xl ring-1 ring-white/10">
                <img
                  src={
                    currentSong.coverImage ||
                    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop'
                  }
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Free Tier Sponsor Overlay */}
                {isAdPlaying && (
                  <div className="absolute inset-0 bg-[#080B12]/95 backdrop-blur-md p-6 flex flex-col justify-between text-center animate-in fade-in">
                    <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-[#F59E0B] uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Sponsor Message • {adCountdown}s</span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xl font-extrabold text-white">
                        {currentAd?.brandName || 'Projects Mandatory'}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                        {currentAd?.tagline || 'Experience high-fidelity lossless sound and unlock unlimited offline downloads.'}
                      </p>
                    </div>

                    <div>
                      <button
                        onClick={() => {
                          closeNowPlaying();
                          onNavigate('/pricing');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#1455D9] to-blue-700 text-white text-xs font-bold shadow-lg uppercase tracking-wider"
                      >
                        {currentAd?.ctaText || 'Get Ad-Free Premium (MK 1,000)'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Title, Artist, & Like Button */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white truncate tracking-tight leading-tight">
                    {currentSong.title}
                  </h2>
                  <p
                    onClick={handleGoToArtist}
                    className="text-sm font-medium text-slate-400 hover:text-white cursor-pointer transition truncate mt-0.5"
                  >
                    {currentSong.artist}
                    {currentSong.featuredArtists && (
                      <span className="text-slate-500"> ft. {currentSong.featuredArtists}</span>
                    )}
                  </p>
                </div>

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

              {/* Stream Verified Banner / Error Banner */}
              {audioError ? (
                <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/40 flex items-center justify-between text-xs text-rose-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>Audio preview unavailable</span>
                  </div>
                  <button
                    onClick={retryPlayback}
                    className="px-2 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 font-bold flex items-center gap-1 text-[11px]"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry
                  </button>
                </div>
              ) : streamQualifiedNotice ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-[#18A558]/40 flex items-center gap-2 text-xs text-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-[#18A558] flex-shrink-0" />
                  <span className="truncate">{streamQualifiedNotice}</span>
                </div>
              ) : null}

              {/* Progress Scrubber */}
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

            </div>
          ) : (
            /* ===================================================
               VIEW 2: UP NEXT / QUEUE MANAGEMENT LIST
               =================================================== */
            <div className="my-auto py-2 flex-1 flex flex-col justify-between max-h-[60vh] overflow-y-auto pr-1 no-scrollbar space-y-4">
              
              {/* Currently Playing Card */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Now Playing
                </span>
                <div className="p-3 rounded-2xl bg-slate-900 border border-[#1455D9]/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                      <img
                        src={currentSong.coverImage}
                        alt={currentSong.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="flex items-end gap-[2px] h-3">
                            <span className="w-[2px] h-full bg-white animate-pulse" />
                            <span className="w-[2px] h-2/3 bg-white animate-bounce" />
                            <span className="w-[2px] h-4/5 bg-white animate-pulse" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{currentSong.title}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{currentSong.artist}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{currentSong.duration || '3:30'}</span>
                </div>
              </div>

              {/* Up Next Header with Save as Playlist & Clear Queue Buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Up Next ({upcomingQueue.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {queue.length > 0 && (
                      <button
                        onClick={() => setIsSavingQueuePlaylist(true)}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                        title="Save entire queue as a playlist"
                      >
                        <FolderPlus className="w-3 h-3" />
                        <span>Save as Playlist</span>
                      </button>
                    )}
                    {upcomingQueue.length > 0 && (
                      <button
                        onClick={handleClearQueue}
                        className="text-[11px] font-semibold text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Save Queue as Playlist form */}
                {isSavingQueuePlaylist && (
                  <form
                    onSubmit={handleSaveQueueAsPlaylist}
                    className="p-3 rounded-2xl bg-blue-950/40 border border-blue-800/80 space-y-2 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white flex items-center gap-1">
                        <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
                        Save Queue ({queue.length} songs)
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSavingQueuePlaylist(false)}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Playlist Name (e.g. My Roadtrip Mix)"
                        value={queuePlaylistName}
                        onChange={(e) => setQueuePlaylistName(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#1455D9]"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-[#1455D9] text-white text-xs font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                )}

                {/* Queue List Items */}
                {upcomingQueue.length === 0 ? (
                  <div className="py-6 px-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center space-y-2">
                    <ListMusic className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">
                      No songs left in queue.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {isAutoplayEnabled
                        ? 'Autoplay is on — similar songs will continue playing automatically.'
                        : 'Turn on Autoplay or add songs to queue from catalog.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-0.5 no-scrollbar">
                    {upcomingQueue.map((song, idx) => {
                      const absoluteIndex = queueIndex + 1 + idx;
                      return (
                        <div
                          key={`queue-${song.id}-${absoluteIndex}`}
                          onClick={() => setQueueIndexDirectly(absoluteIndex)}
                          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-2.5 cursor-pointer group transition active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-[10px] font-mono text-slate-500 w-3 text-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <img
                              src={song.coverImage}
                              alt={song.title}
                              className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-slate-800"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0 flex-1 text-left">
                              <h5 className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                                {song.title}
                              </h5>
                              <p className="text-[10px] text-slate-400 truncate">{song.artist}</p>
                            </div>
                          </div>

                          {/* Reorder / Remove Controls */}
                          <div
                            className="flex items-center gap-1 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {idx > 0 && (
                              <button
                                onClick={() => reorderQueue(absoluteIndex, absoluteIndex - 1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                title="Move Up"
                                aria-label="Move track up in queue"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {idx < upcomingQueue.length - 1 && (
                              <button
                                onClick={() => reorderQueue(absoluteIndex, absoluteIndex + 1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                title="Move Down"
                                aria-label="Move track down in queue"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => removeFromQueue(absoluteIndex)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                              title="Remove from queue"
                              aria-label="Remove track from queue"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Autoplay Switcher Card */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isAutoplayEnabled ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Autoplay Similar Music</span>
                    <span className="text-[10px] text-slate-400 block">Seamlessly continue when queue finishes</span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAutoplayEnabled}
                    onChange={toggleAutoplay}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1455D9]"></div>
                </label>
              </div>

            </div>
          )}

          {/* ===================================================
              PRIMARY PLAYBACK CONTROLS
              =================================================== */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between px-3">
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

              {/* MAIN PLAY / PAUSE BUTTON */}
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

              {/* Repeat Mode Cycle: OFF -> ALL -> ONE -> OFF */}
              <button
                onClick={toggleRepeat}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition active:scale-95 relative ${
                  repeatMode !== 'OFF' ? 'text-[#18A558]' : 'text-slate-400 hover:text-white'
                }`}
                aria-label={`Repeat mode: ${repeatMode}`}
              >
                {repeatMode === 'ONE' ? (
                  <Repeat1 className="w-5 h-5 stroke-[2.2px]" />
                ) : (
                  <Repeat className="w-5 h-5 stroke-[2.2px]" />
                )}
              </button>
            </div>

            {/* Bottom Actions Row: Like, Add to Playlist, Queue, Download, Share */}
            <div className="flex items-center justify-around py-2 border-t border-slate-800/80">
              <button
                onClick={() => toggleLikeSong(currentSong.id)}
                className="flex flex-col items-center gap-1 min-h-[44px] text-slate-400 hover:text-white transition"
                aria-label="Like song"
              >
                <Heart className={`w-5 h-5 ${isSongLiked ? 'text-[#E53935] fill-current' : ''}`} />
                <span className="text-[10px]">Like</span>
              </button>

              <button
                onClick={() => openAddToPlaylist(currentSong)}
                className="flex flex-col items-center gap-1 min-h-[44px] text-slate-400 hover:text-white transition"
                aria-label="Add to Playlist"
              >
                <FolderPlus className="w-5 h-5" />
                <span className="text-[10px]">Playlist</span>
              </button>

              <button
                onClick={() => setActiveView(activeView === 'track' ? 'queue' : 'track')}
                className={`flex flex-col items-center gap-1 min-h-[44px] transition ${
                  activeView === 'queue' ? 'text-[#1455D9]' : 'text-slate-400 hover:text-white'
                }`}
                aria-label="View Up Next Queue"
              >
                <ListMusic className="w-5 h-5" />
                <span className="text-[10px]">Queue</span>
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
                <span className="text-[10px]">{isCurrentDownloaded ? 'Saved' : 'Download'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1 min-h-[44px] text-slate-400 hover:text-white transition"
                aria-label="Share song"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-[10px]">Share</span>
              </button>
            </div>

            {/* About the Artist Card */}
            <div
              onClick={handleGoToArtist}
              className="p-3 rounded-2xl bg-[#11151F] border border-slate-800/80 hover:border-slate-700 cursor-pointer transition active:scale-[0.99] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 ring-2 ring-[#1455D9]/40 flex-shrink-0">
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
                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Artist
                  </span>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {currentSong.artist}
                  </h4>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

          </div>

        </div>
      </div>

      {/* Song Action Menu Modal */}
      <SongActionMenuModal
        song={selectedMenuSong}
        isOpen={!!selectedMenuSong}
        onClose={() => setSelectedMenuSong(null)}
        onNavigate={onNavigate}
      />
    </>
  );
};
