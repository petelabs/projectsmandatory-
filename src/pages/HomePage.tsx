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
} from 'lucide-react';
import { Song, ArtistSettings } from '../types';
import { usePlayback } from '../context/PlaybackContext';
import { useTheme } from '../context/ThemeContext';

interface HomePageProps {
  songs: Song[];
  artistInfo?: Partial<ArtistSettings>;
  onBuy?: (song: Song) => void;
  onSelectSong: (songId: string) => void;
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  songs,
  onSelectSong,
  onNavigate,
}) => {
  const { currentSong, isPlaying, playSong, history } = usePlayback();
  const { isDark } = useTheme();

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  }, []);

  // Filter chips state
  const [activeChip, setActiveChip] = useState<string>('Trending');
  const chips = ['Trending', 'New', 'Malawi', 'Afrobeats', 'Hip-Hop', 'Gospel'];

  // Trending songs (cards carousel)
  const trendingSongs = useMemo(() => {
    const featured = songs.filter((s) => s.isFeatured || s.isPopular);
    return featured.length > 0 ? featured : songs.slice(0, 5);
  }, [songs]);

  // New releases (compact vertical list)
  const newReleases = useMemo(() => {
    return [...songs].reverse().slice(0, 6);
  }, [songs]);

  // Featured Artists
  const featuredArtists = [
    {
      id: 'artist-bwalya',
      name: 'Bwalya Musik',
      listeners: '128K listeners',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop',
    },
    {
      id: 'artist-kizzo',
      name: 'Kizzo',
      listeners: '94K listeners',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
    },
    {
      id: 'artist-lulu',
      name: 'Lulu',
      listeners: '210K listeners',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop',
    },
    {
      id: 'artist-amani',
      name: 'Amani',
      listeners: '67K listeners',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=300&auto=format&fit=crop',
    },
    {
      id: 'artist-bflow',
      name: 'B Flow',
      listeners: '145K listeners',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=300&auto=format&fit=crop',
    },
  ];

  const handleSongPlay = (song: Song, queueList?: Song[]) => {
    playSong(song, queueList || songs);
  };

  return (
    <div className="space-y-6 pb-6 text-left">
      
      {/* ===================================================
          GREETING & SEARCH BAR
          =================================================== */}
      <div className="space-y-3 pt-1">
        <div>
          <span className="text-sm font-semibold text-[#1455D9] block">
            {greeting}
          </span>
          <h1
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-[#111827]'
            }`}
          >
            What do you want to hear?
          </h1>
        </div>

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
          aria-label="Search songs, artists or albums"
        >
          <Search className="w-5 h-5 flex-shrink-0 text-slate-400" />
          <span className="text-sm font-normal">Search songs, artists or albums</span>
        </div>

        {/* Compact Discovery Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {chips.map((chip) => {
            const isActive = activeChip === chip;
            return (
              <button
                key={chip}
                onClick={() => {
                  setActiveChip(chip);
                  if (chip === 'Malawi' || chip === 'Afrobeats' || chip === 'Hip-Hop') {
                    onNavigate(`/music?genre=${encodeURIComponent(chip)}`);
                  }
                }}
                className={`min-h-[38px] px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
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
          TRENDING NOW (HORIZONTAL ALBUM/SONG CARDS)
          =================================================== */}
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

        {/* Horizontal Carousel */}
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
                {/* Artwork Container */}
                <div className="relative aspect-square w-full overflow-hidden bg-slate-800">
                  <img
                    src={song.coverImage}
                    alt={song.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />

                  {/* Accent Orange "Trending" Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#F59E0B] text-black text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                    <Flame className="w-3 h-3 fill-current" />
                    <span>Trending</span>
                  </div>

                  {/* Small Circular Play Control */}
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

                {/* Card Content */}
                <div className="p-3 text-left">
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
              </div>
            );
          })}
        </div>
      </section>

      {/* ===================================================
          NEW RELEASES (COMPACT VERTICAL LIST)
          =================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            className={`text-lg sm:text-xl font-bold tracking-tight ${
              isDark ? 'text-white' : 'text-[#111827]'
            }`}
          >
            New Releases
          </h2>
          <button
            onClick={() => onNavigate('/music?sort=latest')}
            className="text-xs font-semibold text-[#1455D9] hover:underline"
          >
            See all
          </button>
        </div>

        <div className="space-y-1.5">
          {newReleases.map((song) => {
            const isThisPlaying = currentSong?.id === song.id && isPlaying;

            return (
              <div
                key={song.id}
                onClick={() => handleSongPlay(song, newReleases)}
                className={`p-2 sm:p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition select-none active:scale-[0.99] border ${
                  isDark
                    ? 'bg-[#11151F] border-slate-800/80 hover:bg-slate-850'
                    : 'bg-white border-[#E5E7EB] hover:bg-slate-50'
                }`}
              >
                {/* Left: Thumbnail & Titles */}
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

                {/* Right: Duration / More Button */}
                <div
                  className="flex items-center gap-2 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    {song.duration || '3:30'}
                  </span>
                  <button
                    onClick={() => onSelectSong(song.id)}
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition ${
                      isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
                    }`}
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

      {/* ===================================================
          ARTISTS YOU MAY LIKE (CIRCULAR ARTIST AVATARS)
          =================================================== */}
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

      {/* ===================================================
          CONTINUE LISTENING (ONLY WHEN HISTORY EXISTS)
          =================================================== */}
      {history.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2
              className={`text-lg sm:text-xl font-bold tracking-tight ${
                isDark ? 'text-white' : 'text-[#111827]'
              }`}
            >
              Continue Listening
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {history.slice(0, 4).map((song) => (
              <div
                key={`hist-${song.id}`}
                onClick={() => handleSongPlay(song, history)}
                className={`p-2.5 rounded-2xl flex items-center gap-2.5 cursor-pointer border transition active:scale-95 ${
                  isDark
                    ? 'bg-[#11151F] border-slate-800 hover:border-slate-700'
                    : 'bg-white border-[#E5E7EB] hover:border-slate-300'
                }`}
              >
                <img
                  src={song.coverImage}
                  alt={song.title}
                  className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1 text-left">
                  <h4 className="text-xs font-bold truncate leading-tight">
                    {song.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {song.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
