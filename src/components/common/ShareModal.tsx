import React from 'react';
import { X, Share2, Copy, Check, MessageSquare } from 'lucide-react';
import { Song, Album, Playlist } from '../../types';
import { shareSong, shareAlbum, sharePlaylist, shareArtist, getShareUrl } from '../../lib/share';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';

export type ShareItemType = 'SONG' | 'ALBUM' | 'PLAYLIST' | 'ARTIST';

export interface ShareItemData {
  type: ShareItemType;
  id: string;
  title: string;
  subtitle: string;
  coverImage: string;
  rawItem?: Song | Album | Playlist | { id: string; name: string };
}

interface ShareModalProps {
  data: ShareItemData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ data, isOpen, onClose }) => {
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !data) return null;

  const path =
    data.type === 'SONG'
      ? `/song/${data.id}`
      : data.type === 'ALBUM'
      ? `/album/${data.id}`
      : data.type === 'PLAYLIST'
      ? `/playlist/${data.id}`
      : `/artist/${data.id}`;

  const shareUrl = getShareUrl(path);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (data.type === 'SONG' && data.rawItem) {
      await shareSong(data.rawItem as Song, () => showToast('Link copied!', 'success'));
    } else if (data.type === 'ALBUM' && data.rawItem) {
      await shareAlbum(data.rawItem as Album, () => showToast('Link copied!', 'success'));
    } else if (data.type === 'PLAYLIST' && data.rawItem) {
      await sharePlaylist(data.rawItem as Playlist, () => showToast('Link copied!', 'success'));
    } else {
      await shareArtist({ id: data.id, name: data.title }, () => showToast('Link copied!', 'success'));
    }
    onClose();
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`🎵 Check out "${data.title}" by ${data.subtitle} on PROJECTS MANDATORY: ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    onClose();
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
    onClose();
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(`Listen to "${data.title}" on PROJECTS MANDATORY digital music platform!`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
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
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold tracking-tight">Share Music</h3>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Card Preview */}
        <div
          className={`p-3 rounded-2xl flex items-center gap-3 border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <img
            src={data.coverImage}
            alt={data.title}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-slate-800"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#1455D9]">
              {data.type}
            </span>
            <h4 className="text-sm font-bold truncate leading-tight">{data.title}</h4>
            <p className="text-xs text-slate-400 truncate">{data.subtitle}</p>
          </div>
        </div>

        {/* Share Buttons Grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <button
            onClick={handleWhatsApp}
            className="p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 flex flex-col items-center gap-1.5 transition active:scale-95"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-[10px] font-bold">WhatsApp</span>
          </button>

          <button
            onClick={handleFacebook}
            className="p-3 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 flex flex-col items-center gap-1.5 transition active:scale-95"
          >
            <Share2 className="w-6 h-6" />
            <span className="text-[10px] font-bold">Facebook</span>
          </button>

          <button
            onClick={handleTwitter}
            className="p-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 flex flex-col items-center gap-1.5 transition active:scale-95"
          >
            <Share2 className="w-6 h-6" />
            <span className="text-[10px] font-bold">Twitter/X</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="p-3 rounded-2xl bg-[#1455D9]/10 hover:bg-[#1455D9]/20 text-[#1455D9] flex flex-col items-center gap-1.5 transition active:scale-95"
          >
            <Share2 className="w-6 h-6" />
            <span className="text-[10px] font-bold">More</span>
          </button>
        </div>

        {/* Link Copy Bar */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Shareable Link
          </label>
          <div
            className={`p-2 pl-3 rounded-xl border flex items-center justify-between gap-2 ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent border-none outline-none text-xs text-slate-400 min-w-0 flex-1 truncate"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-[#1455D9] text-white text-xs font-bold flex items-center gap-1 hover:bg-blue-600 transition flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
