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
  PlaySquare,
} from 'lucide-react';
import { Song } from '../types';
import { usePlayback } from '../context/PlaybackContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { SongActionMenuModal } from '../components/common/SongActionMenuModal';

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
    playNext,
    addToQueue,
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
  const [selectedActionSong, setSelectedActionSong] = useState<Song | null>(null);

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

  return (
    <>
      <div className="space-y-4 pb-6 text-left">
        {/* Title */}
        <div className="pt-1">
          <h1
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-[#111827]'
            }`}
          >
            Discover Music
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Stream popular hits, new releases, and authentic Malawian sounds
          </p>
        </div>

        {/* Search Bar Input */}
        <div
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition ${
            isDark
              ? 'bg-[#11151F] border-slate-800 text-white focus-within:border-[#1455D9]'
              : 'bg-white border-[#E5E7EB] text-[#111827] focus-within:border-[#1455D9] shadow-sm'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search tracks, artists, or genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm focus:outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Tab & Genre Filters */}
        <div className="space-y-2">
          {/* Main Segmented Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('new')}
              className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
                activeTab === 'new'
                  ? 'bg-[#1455D9] text-white shadow-sm'
                  : isDark
                  ? 'bg-[#11151F] text-slate-400 border border-slate-800'
                  : 'bg-white text-slate-600 border border-[#E5E7EB]'
              }`}
            >
              New Releases
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`min-h-[36px] px-4 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
                activeTab === 'all'
                  ? 'bg-[#1455D9] text-white shadow-sm'
                  : isDark
                  ? 'bg-[#11151F] text-slate-400 border border-slate-800'
                  : 'bg-white text-slate-600 border border-[#E5E7EB]'
              }`}
            >
              Top Charts
            </button>
          </div>

          {/* Genre Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {genres.map((g) => {
              const isSelected = selectedGenre === g;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`min-h-[32px] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-bold'
                      : isDark
                      ? 'bg-[#11151F] text-slate-400 border border-slate-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Track Count Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Showing {filteredSongs.length} tracks</span>
        </div>

        {/* Song List */}
        <div className="space-y-1.5">
          {filteredSongs.length === 0 ? (
            <div
              className={`p-10 rounded-2xl text-center border ${
                isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
              }`}
            >
              <Disc className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-40" />
              <h3 className="text-base font-bold">No songs found</h3>
              <p className="text-xs text-slate-400 mt-1">
                Try searching with another keyword or selecting All Genres.
              </p>
            </div>
          ) : (
            filteredSongs.map((song) => {
              const isThisPlaying = currentSong?.id === song.id && isPlaying;

              return (
                <div
                  key={song.id}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedActionSong(song);
                    }}
                  >
                    <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                      {song.duration || '3:30'}
                    </span>
                    <button
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition active:scale-95 ${
                        isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
                      }`}
                      aria-label={`More options for ${song.title}`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Reusable Song Action Menu Modal */}
      <SongActionMenuModal
        song={selectedActionSong}
        isOpen={!!selectedActionSong}
        onClose={() => setSelectedActionSong(null)}
        onNavigate={onNavigate}
      />
    </>
  );
};
