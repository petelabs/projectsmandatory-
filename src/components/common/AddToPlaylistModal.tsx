import React, { useState } from 'react';
import { X, Plus, Check, ListMusic, Music } from 'lucide-react';
import { Song, Playlist } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';
import { CreatePlaylistModal } from './CreatePlaylistModal';

interface AddToPlaylistModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  song,
  isOpen,
  onClose,
}) => {
  const { playlists, addSongToPlaylist } = useLibrary();
  const { isDark } = useTheme();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (!isOpen || !song) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
        <div
          className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 border text-left shadow-2xl max-h-[85vh] flex flex-col ${
            isDark ? 'bg-[#11151F] border-slate-800 text-white' : 'bg-white border-slate-200 text-[#111827]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/40 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#1455D9]/20 flex items-center justify-center text-[#1455D9]">
                <ListMusic className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">Add to Playlist</h3>
            </div>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selected Song Preview */}
          <div
            className={`p-2.5 rounded-2xl flex items-center gap-3 border flex-shrink-0 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <img
              src={song.coverImage}
              alt={song.title}
              className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold truncate">{song.title}</h4>
              <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>
            </div>
          </div>

          {/* Quick Create Playlist Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full p-3 rounded-2xl border border-dashed border-[#1455D9]/50 bg-[#1455D9]/10 text-[#1455D9] flex items-center justify-center gap-2 text-xs font-bold transition hover:bg-[#1455D9]/20 flex-shrink-0 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Create New Playlist
          </button>

          {/* Playlists List */}
          <div className="overflow-y-auto space-y-2 pr-1 flex-1">
            {playlists.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No playlists created yet. Click above to create one.
              </div>
            ) : (
              playlists.map((pl) => {
                const isAlreadyIn = pl.songIds.includes(song.id);
                return (
                  <div
                    key={pl.id}
                    onClick={() => {
                      addSongToPlaylist(pl.id, song.id);
                      onClose();
                    }}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer border transition select-none active:scale-[0.99] ${
                      isDark
                        ? 'bg-[#161B26] border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={pl.coverImage}
                        alt={pl.title}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0 bg-slate-800"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold truncate">{pl.title}</h4>
                        <p className="text-[11px] text-slate-400">
                          {pl.songIds.length} {pl.songIds.length === 1 ? 'track' : 'tracks'}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isAlreadyIn ? (
                        <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-[#1455D9]/20 text-[#1455D9] flex items-center justify-center">
                          <Plus className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Sub-Modal for Creating Playlist */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialSongId={song.id}
        onCreated={(playlistId) => {
          setIsCreateModalOpen(false);
          onClose();
        }}
      />
    </>
  );
};
