import React, { useState, useMemo } from 'react';
import {
  Search,
  Play,
  Pause,
  MoreVertical,
  Flame,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Disc,
  Clock,
  RotateCcw,
  Compass,
  Heart,
  Music2,
  Layers,
  Radio,
} from 'lucide-react';
import { Song, ArtistSettings, Album, Playlist } from '../types';
import { usePlayback } from '../context/PlaybackContext';
import { useTheme } from '../context/ThemeContext';
import { SongActionMenuModal } from '../components/common/SongActionMenuModal';
import {
  getMadeForYouSongs,
  getBecauseYouListenedTo,
  getMalawiTopSongs,
  getSongsByMood,
  extractArtistsFromSongs,
} from '../lib/recommendations';
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
  albums = INITIAL_ALBUMS,
  playlists = INITIAL_PLAYLISTS,
  onSelectSong,
  onNavigate,
  onBuy,
}) => {
  const {
    currentSong,
    isPlaying,
    playSong,
    continueListening,
    history,
    likedSongIds,
    playbackPositions,
  } = usePlayback();
  const { isDark } = useTheme();

  const [actionMenuSong, setActionMenuSong] = useState<Song | null>(null);
  const [activeChip, setActiveChip] = useState<string>('All');
  const [newReleasesTab, setNewReleasesTab] = useState<'songs' | 'albums'>('songs');

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
    if (activeChip === 'All') return songs;
    if (['Chill', 'Workout', 'Party', 'Focus'].includes(activeChip)) {
      return getSongsByMood(songs, activeChip, 12);
    }
    return songs.filter(
      (s) =>
        s.genre.toLowerCase() === activeChip.toLowerCase() ||
        (s.tags && s.tags.some((t) => t.toLowerCase() === activeChip.toLowerCase()))
    );
  }, [songs, activeChip]);

  // Personalized "Made For You"
  const madeForYou = useMemo(() => {
    return getMadeForYouSongs(songs, history, likedSongIds, [], 6);
  }, [songs, history, likedSongIds]);

  // Contextual "Because You Listened To"
  const becauseYouListened = useMemo(() => {
    return getBecauseYouListenedTo(songs, history);
  }, [songs, history]);

  // Trending songs
  const trendingSongs = useMemo(() => {
    const featured = songs.filter((s) => s.isFeatured || s.isPopular);
    return featured.length > 0 ? featured : songs.slice(0, 6);
  }, [songs]);

  // New releases
  const newReleaseSongs = useMemo(() => {
    return [...songs].reverse().slice(0, 6);
  }, [songs]);

  // Popular in Malawi
  const malawiSongs = useMemo(() => {
    return getMalawiTopSongs(songs, 6);
  }, [songs]);

  // Featured Artists
  const featuredArtists = useMemo(() => {
    return extractArtistsFromSongs(songs).slice(0, 6);
  }, [songs]);

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
                  {activeChip} Tracks & Vibes
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

        {/* ===================================================
            BECAUSE YOU LISTENED TO... (CONTEXTUAL BANNER)
            =================================================== */}
        {activeChip === 'All' && becauseYouListened && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#1455D9] uppercase tracking-wider">
                  Recommended For You
                </span>
                <h2
                  className={`text-lg sm:text-xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-[#111827]'
                  }`}
                >
                  Because you listened to {becauseYouListened.contextName}
                </h2>
              </div>
            </div>

            <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              {becauseYouListened.songs.map((song) => (
                <div
                  key={`rec-${song.id}`}
                  onClick={() => handleSongPlay(song, becauseYouListened.songs)}
                  className={`flex-shrink-0 w-36 sm:w-40 p-2.5 rounded-2xl cursor-pointer border transition active:scale-95 ${
                    isDark
                      ? 'bg-[#11151F] border-slate-800 hover:border-slate-700'
                      : 'bg-white border-[#E5E7EB] hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <img
                    src={song.coverImage}
                    alt={song.title}
                    className="w-full aspect-square rounded-xl object-cover mb-2"
                  />
                  <h4 className="text-xs font-bold truncate text-left">{song.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate text-left">{song.artist}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===================================================
            TRENDING NOW (HORIZONTAL CAROUSEL)
            =================================================== */}
        {activeChip === 'All' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2
                className={`text-lg sm:text-xl font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-[#111827]'
                }`}
              >
                Trending Now
              </h2>
              <button
                onClick={() => onNavigate('/music?sort=popular')}
                className="text-xs font-semibold text-[#1455D9] hover:underline"
              >
                See all
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              {trendingSongs.map((song) => {
                const isThisPlaying = currentSong?.id === song.id && isPlaying;

                return (
                  <div
                    key={song.id}
                    onClick={() => handleSongPlay(song, trendingSongs)}
                    className={`relative flex-shrink-0 w-44 sm:w-48 rounded-2xl overflow-hidden cursor-pointer group transition-transform active:scale-[0.98] border ${
                      isDark
                        ? 'bg-[#11151F] border-slate-800 hover:border-slate-700'
                        : 'bg-white border-[#E5E7EB] hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-800">
                      <img
                        src={song.coverImage}
                        alt={song.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />

                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#F59E0B] text-black text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                        <Flame className="w-3 h-3 fill-current" />
                        <span>Trending</span>
                      </div>

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSongPlay(song, trendingSongs);
                        }}
                        className={`absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition active:scale-90 ${
                          isThisPlaying
                            ? 'bg-[#E53935] text-white'
                            : 'bg-white text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {isThisPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </div>
                    </div>

                    <div className="p-3 text-left flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <h3
                          className={`text-sm font-bold truncate leading-snug ${
                            isDark ? 'text-white' : 'text-[#111827]'
                          }`}
                        >
                          {song.title}
                        </h3>
                        <p
                          className={`text-xs truncate ${
                            isDark ? 'text-slate-400' : 'text-[#667085]'
                          }`}
                        >
                          {song.artist}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuSong(song);
                        }}
                        className="p-1 text-slate-400 hover:text-white transition"
                        aria-label="Options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===================================================
            NEW RELEASES (SONGS & ALBUMS TOGGLE)
            =================================================== */}
        {activeChip === 'All' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2
                  className={`text-lg sm:text-xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-[#111827]'
                  }`}
                >
                  New Releases
                </h2>
                <div className="flex items-center gap-1 bg-slate-800/60 p-0.5 rounded-xl border border-slate-700/50">
                  <button
                    onClick={() => setNewReleasesTab('songs')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      newReleasesTab === 'songs'
                        ? 'bg-[#1455D9] text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Songs
                  </button>
                  <button
                    onClick={() => setNewReleasesTab('albums')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      newReleasesTab === 'albums'
                        ? 'bg-[#1455D9] text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Albums & EPs
                  </button>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/music?sort=latest')}
                className="text-xs font-semibold text-[#1455D9] hover:underline"
              >
                See all
              </button>
            </div>

            {newReleasesTab === 'songs' ? (
              <div className="space-y-1.5">
                {newReleaseSongs.map((song) => {
                  const isThisPlaying = currentSong?.id === song.id && isPlaying;

                  return (
                    <div
                      key={song.id}
                      onClick={() => handleSongPlay(song, newReleaseSongs)}
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

                      <div
                        className="flex items-center gap-1.5 flex-shrink-0"
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
                          aria-label={`Options for ${song.title}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* New Albums & EPs Grid */
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => onNavigate(`/album/${album.id}`)}
                    className={`p-3 rounded-2xl cursor-pointer border transition active:scale-95 group text-left ${
                      isDark
                        ? 'bg-[#11151F] border-slate-800 hover:border-slate-700'
                        : 'bg-white border-[#E5E7EB] hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-800 mb-2.5">
                      <img
                        src={album.coverImage}
                        alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#1455D9] text-white text-[9px] font-bold uppercase">
                        {album.type}
                      </div>
                    </div>
                    <h4 className="text-xs font-bold truncate leading-tight">{album.title}</h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{album.artist}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===================================================
            TOP TRENDING ANTHEMS
            =================================================== */}
        {activeChip === 'All' && malawiSongs.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className={`text-lg sm:text-xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-[#111827]'
                  }`}
                >
                  Top Trending Anthems 🔥
                </h2>
                <span className="text-xs text-slate-400">Authentic hits & trending sounds</span>
              </div>
              <button
                onClick={() => onNavigate('/music')}
                className="text-xs font-semibold text-[#1455D9] hover:underline"
              >
                See all
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {malawiSongs.map((song) => {
                const isThisPlaying = currentSong?.id === song.id && isPlaying;
                return (
                  <div
                    key={`malawi-${song.id}`}
                    onClick={() => handleSongPlay(song, malawiSongs)}
                    className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer border transition active:scale-[0.99] ${
                      isDark
                        ? 'bg-[#11151F] border-slate-800 hover:border-slate-700'
                        : 'bg-white border-[#E5E7EB] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={song.coverImage}
                        alt={song.title}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1 text-left">
                        <h4 className="text-xs sm:text-sm font-bold truncate leading-tight">
                          {song.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
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
                        aria-label="Options"
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

        {/* ===================================================
            CURATED PLAYLISTS & MOODS
            =================================================== */}
        {activeChip === 'All' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2
                className={`text-lg sm:text-xl font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-[#111827]'
                }`}
              >
                Curated Playlists & Moods
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => onNavigate(`/playlist/${pl.id}`)}
                  className={`p-3 rounded-2xl cursor-pointer border transition active:scale-95 group text-left ${
                    isDark
                      ? 'bg-[#11151F] border-slate-800 hover:border-slate-700'
                      : 'bg-white border-[#E5E7EB] hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-800 mb-2">
                    <img
                      src={pl.coverImage}
                      alt={pl.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <h4 className="text-xs font-bold truncate leading-tight">{pl.title}</h4>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{pl.curator}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===================================================
            RISING ARTISTS & ARTISTS YOU MAY LIKE
            =================================================== */}
        {activeChip === 'All' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2
                className={`text-lg sm:text-xl font-bold tracking-tight ${
                  isDark ? 'text-white' : 'text-[#111827]'
                }`}
              >
                Artists You May Like
              </h2>
              <button
                onClick={() => onNavigate('/artists')}
                className="text-xs font-semibold text-[#1455D9] hover:underline"
              >
                See all
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              {featuredArtists.map((artist) => (
                <div
                  key={artist.id}
                  onClick={() => onNavigate(`/artist/${artist.id}`)}
                  className="flex flex-col items-center text-center cursor-pointer group flex-shrink-0 w-24 active:scale-95 transition"
                >
                  <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-800 ring-2 ring-[#1455D9]/40 group-hover:ring-[#1455D9] transition">
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-full object-cover transition group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                  <span
                    className={`text-xs font-bold mt-2 truncate w-full ${
                      isDark ? 'text-white' : 'text-[#111827]'
                    }`}
                  >
                    {artist.name}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate w-full">
                    {artist.listeners}
                  </span>
                </div>
              ))}
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
