import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  ShieldCheck,
  FileAudio,
  Calendar,
  Disc,
  CheckCircle,
  Sparkles,
  Tag,
  Layers,
  Share2,
  Copy,
  MessageCircle,
  Heart,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Song } from '../types';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import { useArtist } from '../context/ArtistContext';
import { useAuth } from '../context/AuthContext';

interface SongDetailPageProps {
  song: Song;
  onBack: () => void;
  onBuy: (song: Song) => void;
}

export const SongDetailPage: React.FC<SongDetailPageProps> = ({
  song,
  onBack,
  onBuy,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'lyrics' | 'license'>('details');
  const { showToast } = useToast();
  const { isArtist, artistProfile, createSongBoostLink } = useArtist();
  const { user } = useAuth();

  // Generate unique boost referral link
  const boostLink = isArtist && artistProfile
    ? createSongBoostLink(song.id)
    : `${window.location.origin}/song/${song.id}`;

  const handleCopyBoostLink = () => {
    navigator.clipboard.writeText(boostLink);
    showToast(isArtist ? 'Track Share & Boost referral link copied!' : 'Song link copied to clipboard!', 'success');
  };

  const handleShareToWhatsApp = () => {
    const text = isArtist
      ? `🔥 Listen to my official track "${song.title}" on Projects Mandatory! Buy the uncompressed studio master directly with Airtel Money or TNM Mpamba: ${boostLink}`
      : `🔥 Check out "${song.title}" by ${song.artist} on Projects Mandatory! Official studio master download: ${boostLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${song.title} by ${song.artist}`,
        text: `Buy and download "${song.title}" on Projects Mandatory`,
        url: boostLink,
      }).catch(() => {});
    } else {
      handleCopyBoostLink();
    }
  };

  const artistShareMWK = Math.round(song.priceMWK * 0.7);

  return (
    <div className="space-y-8 text-left animate-in fade-in pb-12">
      
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white py-2 px-3 rounded-lg hover:bg-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Music Catalog</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareToWhatsApp}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 py-2 px-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/50 transition"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white py-2 px-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Main Track Detail Hero Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Large Artwork */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 shadow-2xl">
              <img
                src={song.coverImage}
                alt={song.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {song.isLatest && <Badge variant="accent">NEW RELEASE</Badge>}
                {song.isPopular && <Badge variant="primary">POPULAR</Badge>}
              </div>
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-xs font-mono text-slate-200 border border-white/10">
                Official Master
              </div>
            </div>

            {/* Quality Summary Banner */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <FileAudio className="w-4 h-4 text-rose-400" />
                <span>{song.fileFormat}</span>
              </div>
              <span>{song.fileSize}</span>
            </div>
          </div>

          {/* Right Info & Purchase Actions */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="primary">{song.genre}</Badge>
                <span className="text-xs font-mono text-slate-400">
                  {song.releaseDate}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-['Syne',sans-serif]">
                {song.title}
              </h1>

              <p className="text-sm font-semibold text-slate-300">
                {song.artist} {song.featuredArtists && <span className="text-rose-400">{song.featuredArtists}</span>}
              </p>

              {song.producer && (
                <p className="text-xs text-slate-400">
                  Produced by <span className="text-slate-300 font-medium">{song.producer}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {song.description}
              </p>
            </div>

            {/* Audio Specification Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Format</span>
                <span className="font-semibold text-white">320kbps MP3</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">File Size</span>
                <span className="font-semibold text-white">{song.fileSize}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Key / BPM</span>
                <span className="font-semibold text-white">{song.key || 'Studio Master'} {song.bpm ? `(${song.bpm} BPM)` : ''}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">License</span>
                <span className="font-semibold text-emerald-400">Personal Own</span>
              </div>
            </div>

            {/* Pricing & Purchase Bar */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-950 to-slate-900 border border-rose-950/50 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Official Track Price
                  </span>
                  <span className="text-3xl font-black text-white font-mono leading-none">
                    MK {song.priceMWK.toLocaleString()}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Instant Direct Download</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    PayChangu (Airtel, Mpamba, Card)
                  </span>
                </div>
              </div>

              {/* 70% direct support callout */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>70% goes straight to the artist:</span>
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  MK {artistShareMWK.toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => onBuy(song)}
                className="w-full min-h-[52px] bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-rose-950/60 border border-rose-500/40 flex items-center justify-center gap-2.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <Download className="w-5 h-5" />
                <span>BUY & DOWNLOAD TRACK (MK {song.priceMWK.toLocaleString()})</span>
              </button>
            </div>

            {/* ARTIST BOOST PANEL (Shown for artists or creators) */}
            {isArtist && (
              <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Your Unique &apos;Share &amp; Boost&apos; Link
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800">
                    Growth Hub
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Share this unique link with your followers. Clicks and sales will be credited to your studio analytics.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={boostLink}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleCopyBoostLink}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Track Information Tabs (Liner Notes, Lyrics, Download Policy) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'details'
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Liner Notes & Credits
          </button>
          {song.lyrics && (
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'lyrics'
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40'
                : 'text-slate-400 hover:text-white'
              }`}
            >
              Lyrics
            </button>
          )}
          <button
            onClick={() => setActiveTab('license')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'license'
                ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Download & Usage Policy
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          {activeTab === 'details' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <h3 className="text-sm font-bold text-white">Recording & Production Credits</h3>
              <p>
                <strong>Title:</strong> {song.title} <br />
                <strong>Primary Artist:</strong> {song.artist} <br />
                {song.featuredArtists && <><strong>Featured Artists:</strong> {song.featuredArtists} <br /></>}
                <strong>Producer:</strong> {song.producer || 'Projects Mandatory Studios'} <br />
                <strong>Release Date:</strong> {song.releaseDate} <br />
                <strong>Copyright:</strong> © 2026 PROJECTS MANDATORY. Master recording rights reserved.
              </p>
              {song.tags && song.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {song.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'lyrics' && song.lyrics && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white mb-2">Official Track Lyrics</h3>
              <pre className="font-sans text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-normal bg-slate-950 p-4 rounded-xl border border-slate-800">
                {song.lyrics}
              </pre>
            </div>
          )}

          {activeTab === 'license' && (
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <h3 className="text-sm font-bold text-white">Personal Digital Ownership License</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li>Upon verified purchase, you receive a full DRM-free studio audio file to keep forever.</li>
                <li>Download is authorized for up to 5 attempts across your personal devices.</li>
                <li>Files can be imported into your phone music player, car stereo, computer, or personal audio devices.</li>
                <li>Commercial redistribution, resale, or unauthorized public rebroadcast is strictly prohibited under Malawi copyright law.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
