import React, { useState, useMemo } from 'react';
import {
  Search,
  Pause,
  RotateCcw,
  Music2,
  MoreVertical,
  Play,
} from 'lucide-react';
import { Song, ArtistSettings, Album, Playlist } from '../types';
import { usePlayback } from '../context/PlaybackContext';
import { useTheme } from '../context/ThemeContext';
import { SongActionMenuModal } from '../components/common/SongActionMenuModal';
import { getSongsByMood } from '../lib/recommendations';
import { INITIAL_ALBUMS, INITIAL_PLAYLISTS } from '../data/initialData';

interface HomePageProps {
  songs: Song[];
  artistInfo?: Partial<ArtistSettings>;
  albums?: Album[];
  playlists?: Playlist[];
  onBuy?: (song: Song) => void;
  onSelectSong: (songId: string) => void;
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  songs,
  onNavigate,
  onBuy,
}) => {
  const {
    currentSong,
    isPlaying,
    playSong,
    continueListening,
    history,
    playbackPositions,
  } = usePlayback();
  const { isDark } = useTheme();

  const [actionMenuSong, setActionMenuSong] = useState<Song | null>(null);
  const [activeChip, setActiveChip] = useState<string>('All');

  // Filter chips with all 16 core genres
  const chips = [
    'All',
    'Afrobeats',
    'Amapiano',
    'Hip-Hop',
    'R&B',
    'Dancehall',
    'Afro-Pop',
    'Reggae',
    'Gospel',
    'Trap',
    'Drill',
    'House',
    'Electronic',
    'Soul',
    'Jazz',
    'Pop',
    'Lo-Fi',
  ];

  // Filter songs if a chip is selected
  const activeFilteredSongs = useMemo(() => {
    if (activeChip === 'All') return [];
    if (['Chill', 'Workout', 'Party', 'Focus'].includes(activeChip)) {
      return getSongsByMood(songs, activeChip, 12);
    }
    return songs.filter(
      (s) =>
        s.genre.toLowerCase() === activeChip.toLowerCase() ||
        (s.tags && s.tags.some((t) => t.toLowerCase() === activeChip.toLowerCase()))
    );
  }, [songs, activeChip]);

  const handleSongPlay = (song: Song, queueList?: Song[]) => {
    playSong(song, queueList || songs);
  };

  return (
    <>
      <div className="space-y-7 pb-8 text-left">
        
        {/* ===================================================
            SEARCH BAR & GENRE CHIPS
            =================================================== */}
        <div className="space-y-3 pt-1">
          {/* Search Bar Input */}
          <div
            onClick={() => onNavigate('/search')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer border transition ${
              isDark
                ? 'bg-[#11151F] border-slate-800 text-slate-400 hover:border-slate-700'
                : 'bg-white border-[#E5E7EB] text-[#667085] hover:border-slate-300 shadow-sm'
            }`}
            role="button"
            tabIndex={0}
            aria-label="Search songs, artists, albums, or playlists"
          >
            <Search className="w-5 h-5 flex-shrink-0 text-slate-400" />
            <span className="text-sm font-normal">Search songs, artists, albums, or playlists</span>
          </div>

          {/* Compact Discovery Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {chips.map((chip) => {
              const isActive = activeChip === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setActiveChip(chip)}
                  className={`min-h-[36px] px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                    isActive
                      ? 'bg-[#1455D9] text-white shadow-sm'
                      : isDark
                      ? 'bg-[#11151F] text-slate-300 border border-slate-800 hover:border-slate-700'
                      : 'bg-white text-[#111827] border border-[#E5E7EB] hover:border-slate-300'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===================================================
            CHIP FILTERED VIEW (WHEN ACTIVE CHIP != 'All')
            =================================================== */}
        {activeChip !== 'All' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className={`text-lg sm:text-xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-[#111827]'
                  }`}
                >
                  {activeChip} Tracks
                </h2>
                <span className="text-xs text-slate-400">
                  {activeFilteredSongs.length} tracks found
                </span>
              </div>
              <button
                onClick={() => setActiveChip('All')}
                className="text-xs text-[#1455D9] font-bold hover:underline"
              >
                Reset Filter
              </button>
            </div>

            <div className="space-y-1.5">
              {activeFilteredSongs.length === 0 ? (
                <div
                  className={`p-8 rounded-2xl text-center border ${
                    isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
                  }`}
                >
                  <Music2 className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-400">
                    No songs currently tagged under {activeChip}.
                  </p>
                </div>
              ) : (
                activeFilteredSongs.map((song) => {
                  const isThisPlaying = currentSong?.id === song.id && isPlaying;
                  return (
                    <div
                      key={`filtered-${song.id}`}
                      onClick={() => handleSongPlay(song, activeFilteredSongs)}
                      className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition select-none active:scale-[0.99] border ${
                        isThisPlaying
                          ? isDark
                            ? 'bg-slate-800/80 border-[#1455D9]/50'
                            : 'bg-blue-50 border-[#1455D9]/30'
                          : isDark
                          ? 'bg-[#11151F] border-slate-800/80 hover:bg-slate-850'
                          : 'bg-white border-[#E5E7EB] hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                          <img
                            src={song.coverImage}
                            alt={song.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
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
                          <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-2 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuSong(song);
                        }}
                      >
                        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                          {song.duration || '3:30'}
                        </span>
                        <button
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white transition rounded-full"
                          aria-label="Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* ===================================================
            CONTINUE LISTENING (ONLY WHEN HISTORY EXISTS)
            =================================================== */}
        {activeChip === 'All' && history.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#1455D9]" />
                <h2
                  className={`text-lg sm:text-xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-[#111827]'
                  }`}
                >
                  Continue Listening
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Resume from where you left off</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {history.slice(0, 4).map((song) => {
                const pos = playbackPositions[song.id];
                const isThisCurrent = currentSong?.id === song.id;
                const isThisPlaying = isThisCurrent && isPlaying;
                const percent = pos && pos.duration > 0 ? (pos.position / pos.duration) * 100 : 0;

                return (
                  <div
                    key={`continue-${song.id}`}
                    onClick={() => continueListening(song)}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer border transition active:scale-[0.99] group ${
                      isDark
                        ? 'bg-[#11151F] border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                        : 'bg-white border-[#E5E7EB] hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                        <img
                          src={song.coverImage}
                          alt={song.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute inset-0 flex items-center justify-center transition ${
                          isThisPlaying ? 'bg-black/50 opacity-100' : 'bg-black/30 opacity-0 group-hover:opacity-100'
                        }`}>
                          {isThisPlaying ? (
                            <Pause className="w-5 h-5 text-white fill-current" />
                          ) : (
                            <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 text-left">
                        <h4 className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                          isThisPlaying ? 'text-[#1455D9]' : isDark ? 'text-white' : 'text-[#111827]'
                        }`}>
                          {song.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {song.artist}
                        </p>

                        {percent > 0 && (
                          <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
                            <div
                              className="bg-[#1455D9] h-full rounded-full"
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActionMenuSong(song);
                      }}
                    >
                      <button
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition"
                        aria-label={`Options for ${song.title}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>

      {/* Song Action Menu Modal */}
      <SongActionMenuModal
        song={actionMenuSong}
        isOpen={!!actionMenuSong}
        onClose={() => setActionMenuSong(null)}
        onNavigate={onNavigate}
        onBuy={onBuy}
      />
    </>
  );
};

