import React, { useState } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  Share2,
  Heart,
  Disc,
  Clock,
  MoreVertical,
  CheckCircle,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Album, Song } from '../types';
import { usePlayback } from '../context/PlaybackContext';
import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { SongActionMenuModal } from '../components/common/SongActionMenuModal';
import { shareAlbum } from '../lib/share';

interface AlbumDetailPageProps {
  album: Album;
  songs: Song[];
  onBack: () => void;
  onNavigate: (path: string) => void;
  onBuySong?: (song: Song) => void;
}

export const AlbumDetailPage: React.FC<AlbumDetailPageProps> = ({
  album,
  songs,
  onBack,
  onNavigate,
  onBuySong,
}) => {
  const { currentSong, isPlaying, playSong, playNext, addToQueue } = usePlayback();
  const { isAlbumSaved, toggleSaveAlbum, downloadAlbum } = useLibrary();
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [selectedActionSong, setSelectedActionSong] = useState<Song | null>(null);

  const isSaved = isAlbumSaved(album.id);

  // Get matching songs for this album
  const albumSongs = songs.filter(
    (s) => (album.songIds && album.songIds.includes(s.id)) || s.albumId === album.id
  );

  const displaySongs = albumSongs.length > 0 ? albumSongs : songs.slice(0, 4);

  const isAlbumCurrentlyPlaying =
    isPlaying && currentSong && displaySongs.some((s) => s.id === currentSong.id);

  const handlePlayAlbum = () => {
    if (displaySongs.length === 0) return;
    playSong(displaySongs[0], displaySongs);
    showToast(`Streaming "${album.title}"`, 'success');
  };

  const handleToggleSave = () => {
    toggleSaveAlbum(album.id);
    showToast(isSaved ? 'Removed album from library' : 'Saved album to your library', 'success');
  };

  const handleShare = async () => {
    await shareAlbum(album, () => {
      showToast('Album link copied to clipboard!', 'success');
    });
  };

  const handleDownloadAll = async () => {
    if (displaySongs.length === 0) return;
    await downloadAlbum(album, displaySongs);
  };

  return (
    <>
      <div className="space-y-6 pb-12 text-left animate-in fade-in">
        {/* Top Navigation */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onBack}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-full transition active:scale-95 ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-black'
            }`}
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2px]" />
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleSave}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition active:scale-95 ${
                isSaved ? 'text-rose-500' : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-black'
              }`}
              aria-label={isSaved ? 'Remove album from library' : 'Save album to library'}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition active:scale-95 ${
                isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-black'
              }`}
              aria-label="Share album"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Album Header & Artwork */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          {/* Cover Art */}
          <div className="sm:col-span-5 flex justify-center">
            <div className="relative aspect-square w-48 sm:w-60 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-700/80">
              <img
                src={album.coverImage}
                alt={album.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-[#1455D9] text-white text-[10px] font-bold uppercase tracking-wider shadow">
                {album.type || 'ALBUM'}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="sm:col-span-7 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1455D9]">
                  {album.artist}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-xs text-slate-400 font-mono">
                  {album.releaseDate ? album.releaseDate.split('-')[0] : '2026'}
                </span>
              </div>
              <h1
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 ${
                  isDark ? 'text-white' : 'text-[#111827]'
                }`}
              >
                {album.title}
              </h1>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              {album.description ||
                `Complete studio recording and master releases by ${album.artist}.`}
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
              <span>{displaySongs.length} {displaySongs.length === 1 ? 'track' : 'tracks'}</span>
              <span>•</span>
              <span>{album.genre || 'Afrobeats'}</span>
              <span>•</span>
              <span className="font-mono text-emerald-400 font-bold">
                MK {album.priceMWK?.toLocaleString() || '4,500'} Full Album
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2.5 flex-wrap">
              <button
                onClick={handlePlayAlbum}
                className="min-h-[44px] px-6 py-2.5 rounded-full bg-[#1455D9] hover:bg-[#0f44b3] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition active:scale-95 shadow-md"
              >
                {isAlbumCurrentlyPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>Play Album</span>
                  </>
                )}
              </button>

              <button
                onClick={handleToggleSave}
                className={`min-h-[44px] px-4 py-2.5 rounded-full border font-bold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                  isSaved
                    ? 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                    : isDark
                    ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current text-rose-500' : ''}`} />
                <span>{isSaved ? 'Saved to Library' : 'Save Album'}</span>
              </button>

              <button
                onClick={handleDownloadAll}
                className={`min-h-[44px] px-4 py-2.5 rounded-full border font-bold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                  isDark
                    ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Download All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tracklist */}
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2
              className={`text-lg font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-[#111827]'
              }`}
            >
              Album Tracks ({displaySongs.length})
            </h2>
            <span className="text-xs text-slate-400">
              {album.totalDuration || '32 mins'} total
            </span>
          </div>

          <div className="space-y-1.5">
            {displaySongs.map((song, index) => {
              const isThisPlaying = currentSong?.id === song.id && isPlaying;

              return (
                <div
                  key={song.id}
                  onClick={() => playSong(song, displaySongs)}
                  className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition select-none active:scale-[0.99] border ${
                    isThisPlaying
                      ? isDark
                        ? 'bg-slate-800/80 border-[#1455D9]/50'
                        : 'bg-blue-50/70 border-[#1455D9]/40'
                      : isDark
                      ? 'bg-[#11151F] border-slate-800/80 hover:bg-slate-800/40'
                      : 'bg-white border-[#E5E7EB] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-5 text-center font-mono font-bold text-xs text-slate-400 flex-shrink-0">
                      {index + 1}
                    </span>

                    <img
                      src={song.coverImage}
                      alt={song.title}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="min-w-0 flex-1 text-left">
                      <h4
                        className={`text-sm font-bold truncate leading-tight ${
                          isThisPlaying
                            ? 'text-[#1455D9]'
                            : isDark
                            ? 'text-white'
                            : 'text-[#111827]'
                        }`}
                      >
                        {song.title}
                      </h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedActionSong(song);
                    }}
                  >
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                      {song.duration || '3:30'}
                    </span>
                    <button
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white transition rounded-full"
                      aria-label={`Options for ${song.title}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Song Action Menu Modal */}
      <SongActionMenuModal
        song={selectedActionSong}
        isOpen={!!selectedActionSong}
        onClose={() => setSelectedActionSong(null)}
        onNavigate={onNavigate}
        onBuy={onBuySong}
      />
    </>
  );
};
