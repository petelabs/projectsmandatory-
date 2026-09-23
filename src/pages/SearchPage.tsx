import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Play,
  Pause,
  Disc,
  User,
  Flame,
  Clock,
  MoreVertical,
  ListMusic,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Song, Album, Playlist } from '../types';
import { usePlayback } from '../context/PlaybackContext';
import { useTheme } from '../context/ThemeContext';
import { SongActionMenuModal } from '../components/common/SongActionMenuModal';
import {
  fuzzyMatches,
  extractArtistsFromSongs,
  getMadeForYouSongs,
} from '../lib/recommendations';
import { INITIAL_ALBUMS, INITIAL_PLAYLISTS } from '../data/initialData';

interface SearchPageProps {
  songs: Song[];
  albums?: Album[];
  playlists?: Playlist[];
  onSelectSong: (songId: string) => void;
  onNavigate: (path: string) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  songs,
  albums = INITIAL_ALBUMS,
  playlists = INITIAL_PLAYLISTS,
  onNavigate,
}) => {
  const { currentSong, isPlaying, playSong, history, likedSongIds } = usePlayback();
  const { isDark } = useTheme();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SONGS' | 'ARTISTS' | 'ALBUMS' | 'PLAYLISTS'>('ALL');
  const [selectedActionSong, setSelectedActionSong] = useState<Song | null>(null);

  // Debounce input to keep UI buttery smooth
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  // Recent searches managed in localStorage
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
      const updated = [text.trim(), ...filtered].slice(0, 8);
      try {
        localStorage.setItem('pm_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentSearch = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s.toLowerCase() !== text.toLowerCase());
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

  // Unique artists from catalog
  const allArtists = useMemo(() => {
    return extractArtistsFromSongs(songs);
  }, [songs]);

  // Autocomplete Suggestions (instant, computed from live query)
  const autocompleteSuggestions = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return [];
    const q = query.toLowerCase();

    const songMatches = songs
      .filter((s) => s.title.toLowerCase().startsWith(q) || fuzzyMatches(s.title, q))
      .slice(0, 3)
      .map((s) => ({ text: s.title, type: 'Song', icon: Disc, id: s.id, entity: s }));

    const artistMatches = allArtists
      .filter((a) => a.name.toLowerCase().startsWith(q) || fuzzyMatches(a.name, q))
      .slice(0, 2)
      .map((a) => ({ text: a.name, type: 'Artist', icon: User, id: a.id, entity: a }));

    const albumMatches = albums
      .filter((al) => al.title.toLowerCase().startsWith(q) || fuzzyMatches(al.title, q))
      .slice(0, 2)
      .map((al) => ({ text: al.title, type: 'Album', icon: Layers, id: al.id, entity: al }));

    return [...songMatches, ...artistMatches, ...albumMatches].slice(0, 5);
  }, [query, songs, allArtists, albums]);

  // Grouped search results with Typo Tolerance
  const searchResults = useMemo(() => {
    if (!debouncedQuery) return { songs: [], artists: [], albums: [], playlists: [], totalCount: 0 };

    const matchingSongs = songs.filter(
      (s) =>
        fuzzyMatches(s.title, debouncedQuery) ||
        fuzzyMatches(s.artist, debouncedQuery) ||
        fuzzyMatches(s.genre, debouncedQuery) ||
        (s.tags && s.tags.some((t) => fuzzyMatches(t, debouncedQuery)))
    );

    const matchingArtists = allArtists.filter(
      (a) => fuzzyMatches(a.name, debouncedQuery) || a.genres.some((g) => fuzzyMatches(g, debouncedQuery))
    );

    const matchingAlbums = albums.filter(
      (al) => fuzzyMatches(al.title, debouncedQuery) || fuzzyMatches(al.artist, debouncedQuery) || fuzzyMatches(al.genre, debouncedQuery)
    );

    const matchingPlaylists = playlists.filter(
      (pl) =>
        fuzzyMatches(pl.title, debouncedQuery) ||
        fuzzyMatches(pl.description, debouncedQuery) ||
        (pl.genre && fuzzyMatches(pl.genre, debouncedQuery)) ||
        (pl.mood && fuzzyMatches(pl.mood, debouncedQuery))
    );

    const totalCount =
      matchingSongs.length + matchingArtists.length + matchingAlbums.length + matchingPlaylists.length;

    return {
      songs: matchingSongs,
      artists: matchingArtists,
      albums: matchingAlbums,
      playlists: matchingPlaylists,
      totalCount,
    };
  }, [debouncedQuery, songs, allArtists, albums, playlists]);

  // Recommended fallback tracks for empty-results state
  const fallbackRecommendations = useMemo(() => {
    return getMadeForYouSongs(songs, history, likedSongIds, [], 4);
  }, [songs, history, likedSongIds]);

  const handleExecuteSearch = (text: string) => {
    setQuery(text);
    setDebouncedQuery(text);
    saveRecentSearch(text);
  };

  return (
    <>
      <div className="space-y-4 pb-8 text-left">
        {/* Header Title */}
        <div className="pt-1">
          <h1
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-[#111827]'
            }`}
          >
            Search
          </h1>
        </div>

        {/* Global Search Input */}
        <div className="relative">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition ${
              isDark
                ? 'bg-[#11151F] border-slate-800 text-white focus-within:border-[#1455D9]'
                : 'bg-white border-[#E5E7EB] text-[#111827] focus-within:border-[#1455D9] shadow-sm'
            }`}
          >
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search songs, artists, albums, or playlists..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveRecentSearch(query);
              }}
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
              autoFocus
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setDebouncedQuery('');
                }}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown suggestions (shown while typing) */}
          {query.trim().length >= 2 && autocompleteSuggestions.length > 0 && (
            <div
              className={`absolute top-full left-0 right-0 mt-1.5 rounded-2xl border p-1.5 shadow-2xl z-30 ${
                isDark ? 'bg-[#11151F] border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'
              }`}
            >
              {autocompleteSuggestions.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={`${item.type}-${item.id}-${idx}`}
                    onClick={() => {
                      saveRecentSearch(item.text);
                      if (item.type === 'Song') {
                        playSong(item.entity as Song);
                      } else if (item.type === 'Artist') {
                        onNavigate(`/artist/${item.id}`);
                      } else if (item.type === 'Album') {
                        onNavigate(`/album/${item.id}`);
                      }
                    }}
                    className={`px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition text-xs ${
                      isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-semibold truncate">{item.text}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-[#1455D9] bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-800/30">
                      {item.type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Filter Chips (Visible when searching) */}
        {debouncedQuery && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {(['ALL', 'SONGS', 'ARTISTS', 'ALBUMS', 'PLAYLISTS'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`min-h-[32px] px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                  filterType === type
                    ? 'bg-[#1455D9] text-white shadow-sm'
                    : isDark
                    ? 'bg-[#11151F] text-slate-400 border border-slate-800'
                    : 'bg-white text-slate-600 border border-[#E5E7EB]'
                }`}
              >
                {type === 'ALL'
                  ? `All (${searchResults.totalCount})`
                  : type === 'SONGS'
                  ? `Songs (${searchResults.songs.length})`
                  : type === 'ARTISTS'
                  ? `Artists (${searchResults.artists.length})`
                  : type === 'ALBUMS'
                  ? `Albums (${searchResults.albums.length})`
                  : `Playlists (${searchResults.playlists.length})`}
              </button>
            ))}
          </div>
        )}

        {/* ===================================================
            DEFAULT VIEW (NO QUERY ENTERED)
            =================================================== */}
        {!debouncedQuery ? (
          <div className="space-y-6 pt-2">
            {/* Recent Searches with individual removal & Clear All */}
            {recentSearches.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Recent Searches
                  </h2>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-[#1455D9] font-bold hover:underline"
                  >
                    Clear all
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      onClick={() => handleExecuteSearch(term)}
                      className={`flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs cursor-pointer transition active:scale-95 border ${
                        isDark
                          ? 'bg-[#11151F] border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-white border-[#E5E7EB] text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{term}</span>
                      <button
                        onClick={(e) => removeRecentSearch(term, e)}
                        className="p-0.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white ml-0.5"
                        aria-label={`Remove ${term}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div className="space-y-2.5">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Trending Searches
              </h2>
              <div className="flex flex-wrap gap-2">
                {['Tiyende', 'Bwalya Musik', 'Sikono', 'Driemo', 'Malawi Folk', 'Amapiano'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleExecuteSearch(tag)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition active:scale-95 border ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-100 text-slate-700 border-transparent hover:border-slate-300'
                    }`}
                  >
                    <Flame className="w-3 h-3 text-[#F59E0B]" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Browse Categories & Genres */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Browse Genres & Moods
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Afrobeats', color: 'from-blue-600 to-indigo-700' },
                  { name: 'Malawi Hits', color: 'from-emerald-600 to-teal-700' },
                  { name: 'Gospel & Praise', color: 'from-amber-600 to-rose-700' },
                  { name: 'Hip-Hop', color: 'from-purple-600 to-pink-700' },
                  { name: 'Chill Vibes', color: 'from-teal-600 to-cyan-700' },
                  { name: 'Workout Energy', color: 'from-red-600 to-orange-700' },
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
              SEARCH RESULTS VIEW (GROUPED BY CATEGORY)
              =================================================== */
          <div className="space-y-6 pt-1">
            {searchResults.totalCount === 0 ? (
              /* NO RESULTS FOUND STATE WITH RICH SUGGESTIONS */
              <div className="space-y-6">
                <div
                  className={`p-8 rounded-2xl text-center border ${
                    isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
                  }`}
                >
                  <Search className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                  <h3 className="text-base font-bold">No results found for "{debouncedQuery}"</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Try checking the spelling, searching another artist, or explore recommended tracks below.
                  </p>
                </div>

                {/* Suggested Alternatives */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Recommended For You
                  </h3>
                  <div className="space-y-1.5">
                    {fallbackRecommendations.map((song) => (
                      <div
                        key={`fallback-${song.id}`}
                        onClick={() => playSong(song, fallbackRecommendations)}
                        className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer border transition active:scale-[0.99] ${
                          isDark ? 'bg-[#11151F] border-slate-800 hover:border-slate-700' : 'bg-white border-[#E5E7EB] hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={song.coverImage}
                            alt={song.title}
                            className="w-11 h-11 rounded-xl object-cover"
                          />
                          <div className="min-w-0 flex-1 text-left">
                            <h4 className="text-xs sm:text-sm font-bold truncate">{song.title}</h4>
                            <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
                          </div>
                        </div>
                        <Play className="w-4 h-4 text-[#1455D9]" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 1. ARTISTS SECTION */}
                {(filterType === 'ALL' || filterType === 'ARTISTS') &&
                  searchResults.artists.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Artists ({searchResults.artists.length})
                      </span>
                      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                        {searchResults.artists.map((artist) => (
                          <div
                            key={artist.id}
                            onClick={() => {
                              saveRecentSearch(artist.name);
                              onNavigate(`/artist/${artist.id}`);
                            }}
                            className={`flex items-center gap-3 p-2.5 pr-4 rounded-2xl cursor-pointer border transition active:scale-95 flex-shrink-0 ${
                              isDark
                                ? 'bg-[#11151F] border-slate-800 hover:border-slate-700'
                                : 'bg-white border-[#E5E7EB] hover:border-slate-300 shadow-sm'
                            }`}
                          >
                            <img
                              src={artist.image}
                              alt={artist.name}
                              className="w-11 h-11 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="text-left">
                              <h4 className="text-xs font-bold">{artist.name}</h4>
                              <span className="text-[10px] text-slate-400">
                                {artist.songCount} {artist.songCount === 1 ? 'song' : 'songs'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 2. SONGS SECTION */}
                {(filterType === 'ALL' || filterType === 'SONGS') &&
                  searchResults.songs.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-1">
                        Songs ({searchResults.songs.length})
                      </span>
                      {searchResults.songs.map((song) => {
                        const isThisPlaying = currentSong?.id === song.id && isPlaying;

                        return (
                          <div
                            key={song.id}
                            onClick={() => {
                              saveRecentSearch(song.title);
                              playSong(song, searchResults.songs);
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

                            <div
                              className="flex items-center gap-1.5 flex-shrink-0"
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
                                aria-label="Options"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                {/* 3. ALBUMS & EPS SECTION */}
                {(filterType === 'ALL' || filterType === 'ALBUMS') &&
                  searchResults.albums.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                        Albums & EPs ({searchResults.albums.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {searchResults.albums.map((album) => (
                          <div
                            key={album.id}
                            onClick={() => {
                              saveRecentSearch(album.title);
                              onNavigate(`/album/${album.id}`);
                            }}
                            className={`p-3 rounded-2xl cursor-pointer border transition active:scale-95 group text-left ${
                              isDark
                                ? 'bg-[#11151F] border-slate-800 hover:border-slate-700'
                                : 'bg-white border-[#E5E7EB] hover:border-slate-300 shadow-sm'
                            }`}
                          >
                            <img
                              src={album.coverImage}
                              alt={album.title}
                              className="w-full aspect-square rounded-xl object-cover mb-2 group-hover:scale-105 transition"
                            />
                            <h4 className="text-xs font-bold truncate">{album.title}</h4>
                            <p className="text-[11px] text-slate-400 truncate">{album.artist}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 4. PLAYLISTS SECTION */}
                {(filterType === 'ALL' || filterType === 'PLAYLISTS') &&
                  searchResults.playlists.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                        Playlists ({searchResults.playlists.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {searchResults.playlists.map((pl) => (
                          <div
                            key={pl.id}
                            onClick={() => {
                              saveRecentSearch(pl.title);
                              onNavigate(`/playlist/${pl.id}`);
                            }}
                            className={`p-3 rounded-2xl cursor-pointer border transition active:scale-95 group text-left ${
                              isDark
                                ? 'bg-[#11151F] border-slate-800 hover:border-slate-700'
                                : 'bg-white border-[#E5E7EB] hover:border-slate-300 shadow-sm'
                            }`}
                          >
                            <img
                              src={pl.coverImage}
                              alt={pl.title}
                              className="w-full aspect-square rounded-xl object-cover mb-2 group-hover:scale-105 transition"
                            />
                            <h4 className="text-xs font-bold truncate">{pl.title}</h4>
                            <p className="text-[10px] text-slate-400 truncate">{pl.curator}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Song Action Menu Modal */}
      <SongActionMenuModal
        song={selectedActionSong}
        isOpen={!!selectedActionSong}
        onClose={() => setSelectedActionSong(null)}
        onNavigate={onNavigate}
      />
    </>
  );
};
