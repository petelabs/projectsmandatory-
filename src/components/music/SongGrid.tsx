import React from 'react';
import { Song } from '../../types';
import { SongCard } from './SongCard';
import { EmptyState } from '../common/EmptyState';

interface SongGridProps {
  songs: Song[];
  onBuy: (song: Song) => void;
  onSelectSong: (songId: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export const SongGrid: React.FC<SongGridProps> = ({
  songs,
  onBuy,
  onSelectSong,
  emptyTitle = 'No songs found',
  emptyDescription = 'Try adjusting your filters or search query.',
}) => {
  if (songs.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {songs.map((song) => (
        <SongCard
          key={song.id}
          song={song}
          onBuy={onBuy}
          onSelectSong={onSelectSong}
        />
      ))}
    </div>
  );
};
