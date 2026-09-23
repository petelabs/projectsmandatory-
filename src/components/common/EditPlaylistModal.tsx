import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Globe, Lock } from 'lucide-react';
import { Playlist } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { useTheme } from '../../context/ThemeContext';

interface EditPlaylistModalProps {
  playlist: Playlist | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export const EditPlaylistModal: React.FC<EditPlaylistModalProps> = ({
  playlist,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const { editPlaylist, deletePlaylist } = useLibrary();
  const { isDark } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (playlist) {
      setTitle(playlist.title);
      setDescription(playlist.description || '');
      setCoverImage(playlist.coverImage || '');
      setIsPublic(!playlist.isEditorial);
    }
  }, [playlist]);

  if (!isOpen || !playlist) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    editPlaylist(playlist.id, {
      title,
      description,
      coverImage,
      isPublic,
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${playlist.title}"?`)) {
      deletePlaylist(playlist.id);
      if (onDeleted) onDeleted();
      onClose();
    }
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
          <h3 className="text-lg font-extrabold tracking-tight">Edit Playlist Details</h3>
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
              Playlist Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none border transition ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white focus:border-[#1455D9]'
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
              className={`w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white focus:border-[#1455D9]'
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#1455D9]'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Cover Image URL
            </label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl text-xs outline-none border transition ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white focus:border-[#1455D9]'
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
                  {isPublic ? 'Visible to anyone with link' : 'Private to your account'}
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

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="py-3 px-4 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 py-3 rounded-xl text-xs font-bold bg-[#1455D9] text-white hover:bg-blue-600 disabled:opacity-50 transition shadow-md flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
