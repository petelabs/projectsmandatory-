import React, { useState, useMemo } from 'react';
import { Song } from '../types';
import { SongFilters, SortOption } from '../components/music/SongFilters';
import { SongGrid } from '../components/music/SongGrid';
import { Badge } from '../components/common/Badge';
import { Disc, Music } from 'lucide-react';

interface MusicPageProps {
  songs: Song[];
  onBuy: (song: Song) => void;
  onSelectSong: (songId: string) => void;
  initialFilter?: string;
}

export const MusicPage: React.FC<MusicPageProps> = ({
  songs,
  onBuy,
  onSelectSong,
  initialFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    if (initialFilter === 'popular') return 'popular';
    if (initialFilter === 'latest') return 'newest';
    return 'newest';
  });

  // Extract unique genres
  const genres = useMemo(() => {
    const set = new Set<string>();
    songs.forEach((s) => {
      if (s.genre) set.add(s.genre);
    });
    return Array.from(set);
  }, [songs]);

  // Filter & Sort
  const filteredSongs = useMemo(() => {
    return songs
      .filter((song) => {
        const matchesSearch =
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (song.tags && song.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

        const matchesGenre = selectedGenre === 'ALL' || song.genre === selectedGenre;

        return matchesSearch && matchesGenre;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
        }
        if (sortBy === 'price-asc') {
          return a.priceMWK - b.priceMWK;
        }
        if (sortBy === 'price-desc') {
          return b.priceMWK - a.priceMWK;
        }
        if (sortBy === 'popular') {
          return b.downloadCount - a.downloadCount;
        }
        return 0;
      });
  }, [songs, searchQuery, selectedGenre, sortBy]);

  return (
    <div className="space-y-8 text-left">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">OFFICIAL CATALOG</Badge>
            <span className="text-xs font-mono text-slate-400">
              {songs.length} Available Tracks
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Syne',sans-serif]">
            Music & Master Recordings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Browse the official discography of PROJECTS MANDATORY. Select any track to view full credits, master file details, and buy for instant download.
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <SongFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        genres={genres}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-slate-400">
          Showing <span className="text-white font-bold">{filteredSongs.length}</span> {filteredSongs.length === 1 ? 'track' : 'tracks'}
        </p>
        <span className="text-[11px] text-slate-500 font-mono">
          Prices in Malawi Kwacha (MWK)
        </span>
      </div>

      {/* Songs Grid */}
      <SongGrid
        songs={filteredSongs}
        onBuy={onBuy}
        onSelectSong={onSelectSong}
        emptyTitle="No tracks found"
        emptyDescription="Try clearing your search filters or searching for another term."
      />
    </div>
  );
};
