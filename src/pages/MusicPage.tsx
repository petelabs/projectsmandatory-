import React, { useState, useMemo } from 'react';
import {
  Search,
  Play,
  Pause,
  MoreVertical,
  Heart,
  ListPlus,
  Download,
  Share2,
  User,
  Disc,
} from 'lucide-react';
import { Song } from '../types';
import { usePlayback } from '../context/PlaybackContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface MusicPageProps {
  songs: Song[];
  onSelectSong: (songId: string) => void;
  onNavigate: (path: string) => void;
}

export const MusicPage: React.FC<MusicPageProps> = ({
  songs,
  onSelectSong,
  onNavigate,
}) => {
  const {
    currentSong,
    isPlaying,
    playSong,
    isLiked,
    toggleLikeSong,
    offlineSongs,
    downloadForOffline,
  } = usePlayback();
  const { canDownloadOffline } = useSubscription();
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'new' | 'all'>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);

  // Genres list
  const genres = useMemo(() => {
    const list = ['ALL'];
    songs.forEach((s) => {
      if (s.genre && !list.includes(s.genre)) list.push(s.genre);
    });
    return list;
  }, [songs]);

  // Filtered and sorted songs
  const filteredSongs = useMemo(() => {
    let result = [...songs];

    // Tab filter
    if (activeTab === 'new') {
      result = result.sort(
        (a, b) => new Date(b.releaseDate || b.createdAt).getTime() - new Date(a.releaseDate || a.createdAt).getTime()
      );
    } else {
      result = result.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
    }

    // Genre filter
    if (selectedGenre !== 'ALL') {
      result = result.filter((s) => s.genre === selectedGenre);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          s.genre.toLowerCase().includes(q)
      );
    }

    return result;
  }, [songs, activeTab, selectedGenre, searchQuery]);

  const handleDownload = async (song: Song) => {
    if (!canDownloadOffline) {
      showToast('Offline downloads require Premium Plus plan', 'info');
      onNavigate('/pricing');
      return;
    }
    const success = await downloadForOffline(song);
    if (success) {
      showToast(`Downloaded "${song.title}" for offline playback`, 'success');
    }
  };

  const handleShare = async (song: Song) => {
    const shareUrl = `${window.location.origin}/song/${song.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: song.title,
          text: `Check out ${song.title} by ${song.artist} on Projects Mandatory`,
          url: shareUrl,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Song link copied to clipboard!', 'success');
    }
  };

  return (
    <div className="space-y-4 pb-6 text-left">
      
      {/* Title */}
      <div className="pt-1">
        <h1
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-[#111827]'
          }`}
        >
          Music
        </h1>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search music..."
          className={`w-full pl-11 pr-4 py-3 rounded-2xl text-sm outline-none border transition ${
            isDark
              ? 'bg-[#11151F] border-slate-800 text-white placeholder-slate-500 focus:border-[#1455D9]'
              : 'bg-white border-[#E5E7EB] text-[#111827] placeholder-slate-400 focus:border-[#1455D9] shadow-sm'
          }`}
        />
      </div>

      {/* Two Simple Controls: "New Releases" | "All Music" */}
      <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-1">
        <button
          onClick={() => setActiveTab('new')}
          className={`py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
            activeTab === 'new'
              ? 'bg-[#1455D9] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
          }`}
        >
          New Releases
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
            activeTab === 'all'
              ? 'bg-[#1455D9] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
          }`}
        >
          All Music
        </button>
      </div>

      {/* Genre Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGenre(g)}
            className={`min-h-[34px] px-3.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition ${
              selectedGenre === g
                ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] font-bold'
                : isDark
                ? 'bg-[#11151F] text-slate-400 border border-slate-800'
                : 'bg-white text-slate-600 border border-[#E5E7EB]'
            }`}
          >
            {g === 'ALL' ? 'All Genres' : g}
          </button>
        ))}
      </div>

      {/* Music List */}
      <div className="space-y-1.5 pt-1">
        {filteredSongs.length === 0 ? (
          <div
            className={`p-10 rounded-2xl text-center border ${
              isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
            }`}
          >
            <Disc className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <h3 className="text-base font-bold">No songs found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Try searching with another keyword or selecting All Genres.
            </p>
          </div>
        ) : (
          filteredSongs.map((song) => {
            const isThisPlaying = currentSong?.id === song.id && isPlaying;
            const isMenuOpen = activeMenuSongId === song.id;

            return (
              <div key={song.id} className="relative">
                <div
                  onClick={() => playSong(song, filteredSongs)}
                  className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition select-none active:scale-[0.99] border ${
                    isThisPlaying
                      ? isDark
                        ? 'bg-slate-800/80 border-[#1455D9]/50'
                        : 'bg-blue-50/70 border-[#1455D9]/40'
                      : isDark
                      ? 'bg-[#11151F] border-slate-800/80 hover:bg-slate-800/40'
                      : 'bg-white border-[#E5E7EB] hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  {/* Left: Thumbnail & Titles */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 shadow-sm">
                      <img
                        src={song.coverImage}
                        alt={song.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      {isThisPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Pause className="w-4 h-4 text-white fill-current" />
                        </div>
                      )}
                    </div>

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
                      <p
                        className={`text-xs truncate ${
                          isDark ? 'text-slate-400' : 'text-[#667085]'
                        }`}
                      >
                        {song.artist}
                      </p>
                    </div>
                  </div>

                  {/* Right: Duration & Three-Dot Menu */}
                  <div
                    className="flex items-center gap-2 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                      {song.duration || '3:30'}
                    </span>
                    <button
                      onClick={() =>
                        setActiveMenuSongId(isMenuOpen ? null : song.id)
                      }
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition active:scale-95 ${
                        isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
                      }`}
                      aria-label={`More options for ${song.title}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Popover Options Menu */}
                {isMenuOpen && (
                  <div
                    className={`absolute right-2 top-14 w-52 rounded-2xl p-1.5 shadow-2xl border z-30 text-left ${
                      isDark ? 'bg-[#11151F] border-slate-700 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveMenuSongId(null);
                        showToast(`Added "${song.title}" to playlist`, 'success');
                      }}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <ListPlus className="w-4 h-4 text-slate-400" />
                      <span>Add to playlist</span>
                    </button>

                    <button
                      onClick={() => {
                        toggleLikeSong(song.id);
                        setActiveMenuSongId(null);
                      }}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isLiked(song.id) ? 'text-[#E53935] fill-current' : 'text-slate-400'
                        }`}
                      />
                      <span>{isLiked(song.id) ? 'Liked' : 'Like'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveMenuSongId(null);
                        handleShare(song);
                      }}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4 text-slate-400" />
                      <span>Share</span>
                    </button>

                    {/* Only show Download to eligible users or upgrade prompt */}
                    <button
                      onClick={() => {
                        setActiveMenuSongId(null);
                        handleDownload(song);
                      }}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4 text-[#18A558]" />
                      <span>
                        {canDownloadOffline ? 'Download Offline' : 'Download (Plus)'}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveMenuSongId(null);
                        const artistId = song.artistId || 'artist-bwalya';
                        onNavigate(`/artist/${artistId}`);
                      }}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>View Artist</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
