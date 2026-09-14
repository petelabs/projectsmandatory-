import React from 'react';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export type SortOption = 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'popular';

interface SongFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGenre: string;
  onGenreChange: (g: string) => void;
  genres: string[];
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
}

export const SongFilters: React.FC<SongFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  genres,
  sortBy,
  onSortChange,
}) => {
  return (
    <div className="space-y-4 mb-8 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800/80">
      
      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tracks by title, lyrics, or style..."
            className="w-full min-h-[44px] rounded-xl bg-slate-950 border border-slate-700/80 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white p-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-auto">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-full sm:w-auto min-h-[44px] rounded-xl bg-slate-950 border border-slate-700/80 pl-9 pr-8 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500 transition cursor-pointer appearance-none"
            >
              <option value="newest">Newest Releases</option>
              <option value="popular">Most Popular Downloads</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="oldest">Oldest Releases</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">
              ▼
            </div>
          </div>
        </div>
      </div>

      {/* Genre Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
        <button
          onClick={() => onGenreChange('ALL')}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            selectedGenre === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-950'
              : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          All Genres
        </button>
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => onGenreChange(genre)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              selectedGenre === genre
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-950'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
};
