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
  Play,
  Pause,
  ListPlus,
  PlaySquare,
} from 'lucide-react';
import { Song } from '../types';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import { useArtist } from '../context/ArtistContext';
import { useAuth } from '../context/AuthContext';
import { usePlayback } from '../context/PlaybackContext';

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
  const { currentSong, isPlaying, playSong, togglePlay, playNext, addToQueue, isLiked, toggleLikeSong } = usePlayback();

  const isCurrent = currentSong?.id === song.id;
  const isThisPlaying = isCurrent && isPlaying;
  const isSongLiked = isLiked(song.id);

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

  const handlePlayToggle = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song);
      showToast(`Playing "${song.title}"`, 'success');
    }
  };

  const handlePlayNext = () => {
    playNext(song);
    showToast(`"${song.title}" will play next`, 'success');
  };

  const handleAddToQueue = () => {
    addToQueue(song);
    showToast(`Added "${song.title}" to queue`, 'success');
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
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/80 shadow-2xl group/cover">
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

              {/* Quick Play/Stream Overlay Button */}
              <button
                onClick={handlePlayToggle}
                aria-label={isThisPlaying ? `Pause ${song.title}` : `Play ${song.title}`}
                className={`absolute inset-0 m-auto w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl z-20 ${
                  isThisPlaying
                    ? 'bg-[#E53935] text-white scale-100'
                    : 'bg-black/75 hover:bg-[#E53935] text-white hover:scale-110'
                }`}
              >
                {isThisPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-1" />
                )}
              </button>

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

            {/* Streaming & Queue Quick Actions */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center gap-2.5">
              <button
                onClick={handlePlayToggle}
                className="px-4 py-2.5 rounded-xl bg-[#1455D9] hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-2 transition active:scale-95 shadow-md"
              >
                {isThisPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause Stream</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>Play Stream</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePlayNext}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <PlaySquare className="w-4 h-4 text-emerald-400" />
                <span>Play Next</span>
              </button>

              <button
                onClick={handleAddToQueue}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <ListPlus className="w-4 h-4 text-purple-400" />
                <span>Add to Queue</span>
              </button>

              <button
                onClick={() => toggleLikeSong(song.id)}
                className={`min-h-[38px] px-3 py-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition active:scale-95 ${
                  isSongLiked
                    ? 'border-rose-500/40 bg-rose-950/40 text-rose-400'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isSongLiked ? 'fill-current' : ''}`} />
                <span>{isSongLiked ? 'Liked' : 'Like'}</span>
              </button>
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
    </div>
  );
};
