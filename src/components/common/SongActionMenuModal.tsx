import React, { useState } from 'react';
import {
  Play,
  ListPlus,
  PlaySquare,
  Heart,
  User,
  Share2,
  Download,
  X,
  ListMusic,
} from 'lucide-react';
import { Song } from '../../types';
import { usePlayback } from '../../context/PlaybackContext';
import { useToast } from '../../context/ToastContext';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { ShareModal } from './ShareModal';

interface SongActionMenuModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
  onBuy?: (song: Song) => void;
}

export const SongActionMenuModal: React.FC<SongActionMenuModalProps> = ({
  song,
  isOpen,
  onClose,
  onNavigate,
  onBuy,
}) => {
  const { playSong, playNext, addToQueue, isLiked, toggleLikeSong } = usePlayback();
  const { showToast } = useToast();

  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  if (!isOpen || !song) return null;

  const isSongLiked = isLiked(song.id);

  const handlePlayNow = () => {
    playSong(song);
    showToast(`Playing "${song.title}"`, 'success');
    onClose();
  };

  const handlePlayNext = () => {
    playNext(song);
    showToast(`"${song.title}" will play next`, 'success');
    onClose();
  };

  const handleAddToQueue = () => {
    addToQueue(song);
    showToast(`Added "${song.title}" to queue`, 'success');
    onClose();
  };

  const handleToggleLike = () => {
    toggleLikeSong(song.id);
    showToast(
      isSongLiked ? `Removed from Liked Songs` : `Added "${song.title}" to Liked Songs`,
      'success'
    );
    onClose();
  };

  const handleGoToArtist = () => {
    onClose();
    if (onNavigate) {
      const path = song.artistId ? `/artist/${song.artistId}` : `/artists`;
      onNavigate(path);
    }
  };

  const handleOpenAddToPlaylist = () => {
    setIsAddToPlaylistOpen(true);
  };

  const handleOpenShare = () => {
    setIsShareModalOpen(true);
  };

  const handleBuy = () => {
    onClose();
    if (onBuy) {
      onBuy(song);
    } else if (onNavigate) {
      onNavigate(`/song/${song.id}`);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Options for ${song.title}`}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md bg-[#11151F] border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Track Summary */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                <img
                  src={song.coverImage}
                  alt={song.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white truncate">{song.title}</h3>
                <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                <span className="text-[10px] text-blue-400 font-mono mt-0.5 block">
                  {song.genre} • {song.duration || '3:30'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action List */}
          <div className="p-2 divide-y divide-slate-800/40">
            <div className="py-1 space-y-0.5">
              <button
                onClick={handlePlayNow}
                className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-white hover:bg-slate-800/70 transition text-xs font-semibold"
              >
                <div className="w-8 h-8 rounded-lg bg-[#1455D9]/20 text-[#1455D9] flex items-center justify-center">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
                <span>Play Now</span>
              </button>

              <button
                onClick={handlePlayNext}
                className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-white hover:bg-slate-800/70 transition text-xs font-semibold"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <PlaySquare className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block">Play Next</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Insert as the very next track in queue
                  </span>
                </div>
              </button>

              <button
                onClick={handleAddToQueue}
                className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-white hover:bg-slate-800/70 transition text-xs font-semibold"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <ListPlus className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block">Add to Queue</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Append to the end of Up Next
                  </span>
                </div>
              </button>
            </div>

            <div className="py-1 space-y-0.5">
              <button
                onClick={handleToggleLike}
                className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-white hover:bg-slate-800/70 transition text-xs font-semibold"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <Heart
                    className={`w-4 h-4 ${isSongLiked ? 'fill-current text-rose-500' : ''}`}
                  />
                </div>
                <span>{isSongLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}</span>
              </button>

              <button
                onClick={handleOpenAddToPlaylist}
                className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-white hover:bg-slate-800/70 transition text-xs font-semibold"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ListMusic className="w-4 h-4" />
                </div>
                <span>Add to Playlist</span>
              </button>

              <button
                onClick={handleGoToArtist}
                className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-white hover:bg-slate-800/70 transition text-xs font-semibold"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span>Go to Artist Profile</span>
              </button>

              <button
                onClick={handleOpenShare}
                className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-white hover:bg-slate-800/70 transition text-xs font-semibold"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <span>Share Song</span>
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={handleBuy}
                className="w-full px-3 py-2.5 rounded-xl flex items-center justify-between text-white bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 transition text-xs font-bold"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <span>Buy & Download Master</span>
                </div>
                <span className="font-mono text-emerald-400">
                  MK {song.priceMWK?.toLocaleString()}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add To Playlist Sub-Modal */}
      <AddToPlaylistModal
        song={song}
        isOpen={isAddToPlaylistOpen}
        onClose={() => setIsAddToPlaylistOpen(false)}
      />

      {/* Share Sub-Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={{
          type: 'SONG',
          id: song.id,
          title: song.title,
          subtitle: song.artist,
          coverImage: song.coverImage,
          rawItem: song,
        }}
      />
    </>
  );
};
