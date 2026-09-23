import React, { useState } from 'react';
import { X, Plus, Music, Globe, Lock } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSongId?: string;
  onCreated?: (playlistId: string) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  initialSongId,
  onCreated,
}) => {
  const { createPlaylist } = useLibrary();
  const { isDark } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [coverImage, setCoverImage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPlaylist = createPlaylist({
      title,
      description,
      coverImage,
      isPublic,
      initialSongs: initialSongId ? [initialSongId] : [],
    });

    setTitle('');
    setDescription('');
    setCoverImage('');
    setIsPublic(true);

    if (onCreated) {
      onCreated(newPlaylist.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-5 border text-left shadow-2xl ${
          isDark ? 'bg-[#11151F] border-slate-800 text-white' : 'bg-white border-slate-200 text-[#111827]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1455D9]/20 flex items-center justify-center text-[#1455D9]">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold tracking-tight">Create Playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Playlist Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blantyre Vibes 2026"
              className={`w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none border transition ${
                isDark
                  ? 'bg-slate-900/90 border-slate-700 text-white focus:border-[#1455D9]'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#1455D9]'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add an optional description..."
              className={`w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition ${
                isDark
                  ? 'bg-slate-900/90 border-slate-700 text-white focus:border-[#1455D9]'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#1455D9]'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className={`w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition ${
                isDark
                  ? 'bg-slate-900/90 border-slate-700 text-white focus:border-[#1455D9]'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#1455D9]'
              }`}
            />
          </div>

          {/* Privacy Toggle */}
          <div
            onClick={() => setIsPublic(!isPublic)}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
              isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="w-5 h-5 text-[#1455D9]" />
              ) : (
                <Lock className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <h4 className="text-xs font-bold">{isPublic ? 'Public Playlist' : 'Private Playlist'}</h4>
                <p className="text-[11px] text-slate-400">
                  {isPublic ? 'Anyone can view & listen to this playlist' : 'Only you can view this playlist'}
                </p>
              </div>
            </div>
            <div
              className={`w-10 h-5 rounded-full flex items-center p-0.5 transition ${
                isPublic ? 'bg-[#1455D9]' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition transform ${
                  isPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl text-xs font-bold border transition ${
                isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-3 rounded-xl text-xs font-bold bg-[#1455D9] text-white hover:bg-blue-600 disabled:opacity-50 transition shadow-md"
            >
              Create Playlist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
