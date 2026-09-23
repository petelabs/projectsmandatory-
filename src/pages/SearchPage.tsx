import React, { useState, useMemo } from 'react';
import { Search, X, Play, Pause, Disc, User, Flame, Clock } from 'lucide-react';
import { Song } from '../types';
import { usePlayback } from '../context/PlaybackContext';
import { useTheme } from '../context/ThemeContext';

interface SearchPageProps {
  songs: Song[];
  onSelectSong: (songId: string) => void;
  onNavigate: (path: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  songs,
  onNavigate,
}) => {
  const { currentSong, isPlaying, playSong } = usePlayback();
  const { isDark } = useTheme();

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SONGS' | 'ARTISTS'>('ALL');
  
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pm_recent_searches');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['Tiyende', 'Bwalya Musik', 'Afrobeats', 'Lulu'];
  });

  const saveRecentSearch = (text: string) => {
    if (!text.trim()) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== text.toLowerCase());
      const updated = [text.trim(), ...filtered].slice(0, 6);
      try {
        localStorage.setItem('pm_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('pm_recent_searches');
  };

  // Unique artists extracted from catalog
  const allArtists = useMemo(() => {
    const map = new Map<string, { name: string; count: number; image: string; id: string }>();
    songs.forEach((s) => {
      if (!map.has(s.artist)) {
        map.set(s.artist, {
          name: s.artist,
          count: 1,
          image: s.coverImage,
          id: s.artistId || `artist-${s.artist.toLowerCase().replace(/\s+/g, '-')}`,
        });
      } else {
        const item = map.get(s.artist)!;
        item.count += 1;
      }
    });
    return Array.from(map.values());
  }, [songs]);

  // Results
  const matchingSongs = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.genre.toLowerCase().includes(q)
    );
  }, [songs, query]);

  const matchingArtists = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allArtists.filter((a) => a.name.toLowerCase().includes(q));
  }, [allArtists, query]);

  const handleExecuteSearch = (text: string) => {
    setQuery(text);
    saveRecentSearch(text);
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
          Search
        </h1>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveRecentSearch(query);
          }}
          placeholder="Songs, artists, or genres..."
          className={`w-full pl-11 pr-10 py-3 rounded-2xl text-sm outline-none border transition ${
            isDark
              ? 'bg-[#11151F] border-slate-800 text-white placeholder-slate-500 focus:border-[#1455D9]'
              : 'bg-white border-[#E5E7EB] text-[#111827] placeholder-slate-400 focus:border-[#1455D9] shadow-sm'
          }`}
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs if query is present */}
      {query.trim() && (
        <div className="flex gap-2">
          {(['ALL', 'SONGS', 'ARTISTS'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                filterType === type
                  ? 'bg-[#1455D9] text-white'
                  : isDark
                  ? 'bg-[#11151F] text-slate-400 border border-slate-800'
                  : 'bg-white text-slate-600 border border-[#E5E7EB]'
              }`}
            >
              {type === 'ALL' ? 'Top Results' : type === 'SONGS' ? 'Songs' : 'Artists'}
            </button>
          ))}
        </div>
      )}

      {/* ===================================================
          INITIAL STATE: RECENT SEARCHES & TRENDING GENRES
          =================================================== */}
      {!query.trim() ? (
        <div className="space-y-6 pt-2">
          {recentSearches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-[#1455D9] hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleExecuteSearch(item)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition active:scale-95 ${
                      isDark
                        ? 'bg-[#11151F] border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-white border-[#E5E7EB] text-slate-700 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Browse Categories */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Browse Categories
            </span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Afro-fusion', color: 'from-blue-600 to-indigo-700' },
                { name: 'Afrobeats', color: 'from-amber-500 to-rose-600' },
                { name: 'Malawi Hits', color: 'from-emerald-600 to-teal-700' },
                { name: 'Hip-Hop', color: 'from-purple-600 to-pink-700' },
              ].map((cat) => (
                <div
                  key={cat.name}
                  onClick={() => handleExecuteSearch(cat.name)}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${cat.color} text-white font-bold text-sm cursor-pointer shadow-md hover:opacity-95 transition active:scale-98 flex items-end h-20`}
                >
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ===================================================
            SEARCH RESULTS VIEW
            =================================================== */
        <div className="space-y-4 pt-1">
          {matchingSongs.length === 0 && matchingArtists.length === 0 ? (
            <div
              className={`p-10 rounded-2xl text-center border ${
                isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
              }`}
            >
              <Search className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <h3 className="text-base font-bold">No results found for "{query}"</h3>
              <p className="text-xs text-slate-400 mt-1">
                Please check the spelling or search for another artist or track.
              </p>
            </div>
          ) : (
            <>
              {/* Artists Section */}
              {(filterType === 'ALL' || filterType === 'ARTISTS') &&
                matchingArtists.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Artists
                    </span>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                      {matchingArtists.map((artist) => (
                        <div
                          key={artist.name}
                          onClick={() => {
                            saveRecentSearch(artist.name);
                            onNavigate(`/artist/${artist.id}`);
                          }}
                          className={`flex items-center gap-3 p-2 pr-4 rounded-2xl cursor-pointer border transition active:scale-95 ${
                            isDark
                              ? 'bg-[#11151F] border-slate-800 hover:border-slate-700'
                              : 'bg-white border-[#E5E7EB] hover:border-slate-300'
                          }`}
                        >
                          <img
                            src={artist.image}
                            alt={artist.name}
                            className="w-10 h-10 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <h4 className="text-xs font-bold">{artist.name}</h4>
                            <span className="text-[10px] text-slate-400">
                              {artist.count} {artist.count === 1 ? 'song' : 'songs'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Songs Section */}
              {(filterType === 'ALL' || filterType === 'SONGS') &&
                matchingSongs.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-1">
                      Songs
                    </span>
                    {matchingSongs.map((song) => {
                      const isThisPlaying = currentSong?.id === song.id && isPlaying;

                      return (
                        <div
                          key={song.id}
                          onClick={() => {
                            saveRecentSearch(song.title);
                            playSong(song, matchingSongs);
                          }}
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
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
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
                              <p className="text-xs text-slate-400 truncate">
                                {song.artist}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-slate-400 font-mono">
                              {song.duration || '3:30'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
