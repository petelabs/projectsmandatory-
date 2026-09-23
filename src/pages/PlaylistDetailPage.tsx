import React, { useState } from 'react';
import {
  Play,
  Pause,
  Share2,
  Edit3,
  Trash2,
  ListMusic,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Globe,
  Lock,
} from 'lucide-react';
import { Song, Playlist } from '../types';
import { usePlayback } from '../context/PlaybackContext';
import { useLibrary } from '../context/LibraryContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { EditPlaylistModal } from '../components/common/EditPlaylistModal';
import { ShareModal } from '../components/common/ShareModal';
import { SongActionMenuModal } from '../components/common/SongActionMenuModal';

interface PlaylistDetailPageProps {
  playlistId: string;
  songs: Song[];
  onNavigate: (path: string) => void;
}

export const PlaylistDetailPage: React.FC<PlaylistDetailPageProps> = ({
  playlistId,
  songs,
  onNavigate,
}) => {
  const { currentSong, isPlaying, playSong, pauseSong } = usePlayback();
  const { getPlaylistById, removeSongFromPlaylist, reorderPlaylistSongs } = useLibrary();
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedMenuSong, setSelectedMenuSong] = useState<Song | null>(null);

  const playlist = getPlaylistById(playlistId);

  if (!playlist) {
    return (
      <div className="p-8 text-center space-y-4">
        <ListMusic className="w-12 h-12 text-slate-500 mx-auto opacity-50" />
        <h2 className="text-xl font-bold">Playlist Not Found</h2>
        <p className="text-xs text-slate-400">
          The playlist you are looking for may have been deleted or is private.
        </p>
        <button
          onClick={() => onNavigate('/library')}
          className="px-4 py-2 bg-[#1455D9] text-white text-xs font-bold rounded-xl"
        >
          Back to Library
        </button>
      </div>
    );
  }

  // Resolve playlist songs
  const playlistSongs: Song[] = playlist.songIds
    .map((id) => songs.find((s) => s.id === id))
    .filter((s): s is Song => s !== undefined);

  const isPlaylistPlaying =
    isPlaying && playlistSongs.some((s) => s.id === currentSong?.id);

  const handlePlayAll = () => {
    if (playlistSongs.length === 0) {
      showToast('Playlist is empty', 'error');
      return;
    }
    if (isPlaylistPlaying) {
      pauseSong();
    } else {
      playSong(playlistSongs[0], playlistSongs);
    }
  };

  return (
    <>
      <div className="space-y-5 pb-8 text-left">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => onNavigate('/library')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Library</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 rounded-xl bg-slate-800/60 text-slate-300 hover:text-white transition"
              title="Share Playlist"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 rounded-xl bg-slate-800/60 text-slate-300 hover:text-white transition"
              title="Edit Playlist"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Playlist Hero Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
          <img
            src={playlist.coverImage}
            alt={playlist.title}
            className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl object-cover shadow-2xl flex-shrink-0 bg-slate-800"
          />
          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1455D9] bg-[#1455D9]/10 border border-[#1455D9]/30 px-2 py-0.5 rounded-md">
                PLAYLIST
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                {playlist.isEditorial ? <Globe className="w-3 h-3 text-[#1455D9]" /> : <Lock className="w-3 h-3 text-amber-500" />}
                {playlist.isEditorial ? 'Public' : 'Personal'}
              </span>
            </div>

            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-[#111827]'
              }`}
            >
              {playlist.title}
            </h1>

            {playlist.description && (
              <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                {playlist.description}
              </p>
            )}

            <p className="text-xs text-slate-400 font-medium">
              Curated by <span className="text-slate-200 font-bold">{playlist.curator}</span> • {playlistSongs.length} {playlistSongs.length === 1 ? 'track' : 'tracks'}
            </p>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-3">
              <button
                onClick={handlePlayAll}
                disabled={playlistSongs.length === 0}
                className="px-6 py-3 rounded-full bg-[#1455D9] text-white font-bold text-xs flex items-center gap-2 hover:bg-blue-600 disabled:opacity-50 transition shadow-lg active:scale-95"
              >
                {isPlaylistPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" /> Play All
                  </>
                )}
              </button>

              <button
                onClick={() => onNavigate('/music')}
                className={`px-4 py-3 rounded-full border text-xs font-bold transition flex items-center gap-1.5 ${
                  isDark
                    ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Plus className="w-4 h-4" /> Add Songs
              </button>
            </div>
          </div>
        </div>

        {/* Tracks List Section */}
        <div className="space-y-2 pt-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Playlist Tracks
          </h3>

          {playlistSongs.length === 0 ? (
            <div
              className={`p-10 rounded-2xl text-center border ${
                isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
              }`}
            >
              <ListMusic className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <h3 className="text-base font-bold">This playlist is empty</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Discover songs in the storefront and tap "Add to Playlist".
              </p>
              <button
                onClick={() => onNavigate('/music')}
                className="mt-4 px-4 py-2 rounded-xl bg-[#1455D9] text-white text-xs font-bold"
              >
                Discover Music
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {playlistSongs.map((song, index) => {
                const isThisPlaying = currentSong?.id === song.id && isPlaying;
                return (
                  <div
                    key={`${song.id}-${index}`}
                    onClick={() => playSong(song, playlistSongs)}
                    className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition select-none border ${
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
                      <span className="text-xs font-mono text-slate-400 w-5 text-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <img
                        src={song.coverImage}
                        alt={song.title}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`text-sm font-bold truncate leading-tight ${
                            isThisPlaying ? 'text-[#1455D9]' : isDark ? 'text-white' : 'text-[#111827]'
                          }`}
                        >
                          {song.title}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                      </div>
                    </div>

                    {/* Reorder & Menu Actions */}
                    <div
                      className="flex items-center gap-1 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Move Up */}
                      <button
                        disabled={index === 0}
                        onClick={() => reorderPlaylistSongs(playlist.id, index, index - 1)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>

                      {/* Move Down */}
                      <button
                        disabled={index === playlistSongs.length - 1}
                        onClick={() => reorderPlaylistSongs(playlist.id, index, index + 1)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {/* Remove from Playlist */}
                      <button
                        onClick={() => removeSongFromPlaylist(playlist.id, song.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition"
                        title="Remove track"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditPlaylistModal
        playlist={playlist}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onDeleted={() => onNavigate('/library')}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={{
          type: 'PLAYLIST',
          id: playlist.id,
          title: playlist.title,
          subtitle: `Curated by ${playlist.curator}`,
          coverImage: playlist.coverImage,
          rawItem: playlist,
        }}
      />
    </>
  );
};
