import React, { useState } from 'react';
import { Download, Sparkles, Disc3, Play, Pause, MoreVertical } from 'lucide-react';
import { Song } from '../../types';
import { Badge } from '../common/Badge';
import { usePlayback } from '../../context/PlaybackContext';
import { SongActionMenuModal } from '../common/SongActionMenuModal';

interface SongCardProps {
  song: Song;
  onBuy: (song: Song) => void;
  onSelectSong: (songId: string) => void;
  compact?: boolean;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  onBuy,
  onSelectSong,
  compact = false,
}) => {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayback();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isCurrent = currentSong?.id === song.id;
  const isThisPlaying = isCurrent && isPlaying;

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  return (
    <>
      <div className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 p-4 transition-all duration-200 hover:shadow-xl hover:shadow-black/40 overflow-hidden text-left">
        
        {/* Top Artwork & Metadata */}
        <div>
          {/* Cover Artwork with Hover Play Button */}
          <div
            onClick={() => onSelectSong(song.id)}
            className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-800 cursor-pointer mb-3.5 group/cover"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectSong(song.id);
              }
            }}
            aria-label={`View details for ${song.title}`}
          >
            <img
              src={song.coverImage}
              alt={`${song.title} artwork`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover/cover:scale-105"
              loading="lazy"
              referrerPolicy="no-referrer"
            />

            {/* Quick Play/Stream Overlay Button */}
            <button
              onClick={handlePlayToggle}
              aria-label={isThisPlaying ? `Pause ${song.title}` : `Play stream of ${song.title}`}
              className={`absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl z-20 ${
                isThisPlaying
                  ? 'bg-rose-600 text-white scale-100'
                  : 'bg-black/70 hover:bg-rose-600 text-white opacity-0 group-hover/cover:opacity-100 hover:scale-110'
              }`}
            >
              {isThisPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Badges Overlay */}
            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10 pointer-events-none">
              {song.isLatest && (
                <Badge variant="accent" size="sm">
                  <Sparkles className="w-2.5 h-2.5" />
                  NEW RELEASE
                </Badge>
              )}
              {song.isPopular && (
                <Badge variant="primary" size="sm">
                  POPULAR
                </Badge>
              )}
            </div>

            {/* Quality Indicator Pill */}
            <div className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-slate-300 font-semibold border border-white/10 flex items-center gap-1">
              <Disc3 className="w-3 h-3 text-rose-400" />
              <span>HQ 320k</span>
            </div>
          </div>

          {/* Title, Artist, Genre, Options */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <button
                onClick={() => onSelectSong(song.id)}
                className="text-left font-bold text-sm sm:text-base text-slate-100 hover:text-rose-400 transition-colors line-clamp-1 leading-snug flex-1"
              >
                {song.title}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(true);
                }}
                className="min-h-[28px] min-w-[28px] flex items-center justify-center text-slate-400 hover:text-white transition rounded-md hover:bg-slate-800"
                aria-label="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 line-clamp-1 font-medium">
              {song.artist} {song.featuredArtists && <span className="text-slate-500">{song.featuredArtists}</span>}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-blue-400/90 font-medium">
                {song.genre}
              </span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {song.releaseDate ? song.releaseDate.split('-')[0] : '2025'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Price & Purchase CTA */}
        <div className="pt-3.5 mt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Price
            </span>
            <span className="font-extrabold text-base sm:text-lg text-white font-mono leading-none">
              MK {song.priceMWK.toLocaleString()}
            </span>
          </div>

          {/* Primary CTA for BUY & DOWNLOAD */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBuy(song);
            }}
            className="min-h-[44px] px-3.5 sm:px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-rose-950/40 border border-rose-500/40 flex items-center justify-center gap-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            aria-label={`Buy and download ${song.title} for MK ${song.priceMWK.toLocaleString()}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>BUY</span>
          </button>
        </div>
      </div>

      {/* Song Action Menu Modal */}
      <SongActionMenuModal
        song={song}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onBuy={onBuy}
      />
    </>
  );
};
