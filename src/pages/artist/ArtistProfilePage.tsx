import React, { useState, useEffect } from 'react';
import {
  Disc,
  Heart,
  Share2,
  Play,
  Pause,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { Song, ArtistProfile, ArtistSupportTip } from '../../types';
import {
  getArtistProfileFromFirestore,
  subscribeArtistTips,
} from '../../lib/firebase';
import { SupportArtistModal } from '../../components/artist/SupportArtistModal';
import { useToast } from '../../context/ToastContext';

interface ArtistProfilePageProps {
  artistId: string;
  songs: Song[];
  onBack: () => void;
  onBuy: (song: Song) => void;
  onSelectSong: (songId: string) => void;
}

export const ArtistProfilePage: React.FC<ArtistProfilePageProps> = ({
  artistId,
  songs,
  onBack,
  onBuy,
  onSelectSong,
}) => {
  const { showToast } = useToast();
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [tips, setTips] = useState<ArtistSupportTip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Fetch artist profile
  useEffect(() => {
    setIsLoading(true);
    getArtistProfileFromFirestore(artistId)
      .then((data) => {
        if (data) {
          setArtist(data);
        } else {
          // Fallback if Hapsin or not in DB yet
          setArtist({
            id: artistId,
            userId: artistId,
            artistName: 'Hapsin',
            email: 'hapsin@projectsmandatory.com',
            phone: '0984 67 96 91',
            bio: 'Featured recording artist and music visionary on Projects Mandatory. Stream, purchase studio master tracks, and support creative expression.',
            genres: ['Afro-fusion', 'Urban Pop'],
            avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
            bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop',
            payoutDetails: {
              accountType: 'AIRTEL_MONEY',
              accountNumber: '0984 67 96 91',
              accountName: 'Hapsin Music',
            },
            wallet: {
              totalEarnedMWK: 0,
              pendingPayoutMWK: 0,
              totalPaidOutMWK: 0,
              totalSongSalesCount: 0,
              totalTipsReceivedMWK: 0,
              totalSupportersCount: 0,
            },
            isVerified: true,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          });
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));

    const unsubscribeTips = subscribeArtistTips(artistId, (artistTips) => {
      setTips(artistTips);
    });

    return () => {
      unsubscribeTips();
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [artistId]);

  // Audio preview handler
  const handleTogglePlay = (song: Song) => {
    if (!song.audioFilePath) {
      showToast('Master audio not linked for this track yet', 'info');
      return;
    }

    if (playingSongId === song.id) {
      if (audioElement) audioElement.pause();
      setPlayingSongId(null);
    } else {
      if (audioElement) audioElement.pause();
      const audio = new Audio(song.audioFilePath);
      audio.play();
      audio.onended = () => setPlayingSongId(null);
      setAudioElement(audio);
      setPlayingSongId(song.id);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Check out ${artist?.artistName || 'this artist'} on Projects Mandatory! Stream, download master recordings, and support their music here: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Artist profile link copied to clipboard!', 'success');
  };

  // Filter songs belonging to this artist
  const artistSongs = songs.filter(
    (s) => (s.artistId === artistId) || (s.artist.toLowerCase().includes(artist?.artistName.toLowerCase() || ''))
  );

  if (isLoading && !artist) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading Artist Profile...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Artist Not Found</h2>
        <button onClick={onBack} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">
          Return to Storefront
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left animate-in fade-in pb-16">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white py-1 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Music Store</span>
      </button>

      {/* Hero Banner & Artist Header */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl relative">
        <div className="h-44 sm:h-56 bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 relative overflow-hidden">
          {artist.bannerUrl && (
            <img
              src={artist.bannerUrl}
              alt={artist.artistName}
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        </div>

        <div className="p-6 sm:p-8 pt-0 relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-slate-900 shadow-2xl bg-slate-800 shrink-0">
              <img
                src={artist.avatarUrl}
                alt={artist.artistName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Syne',sans-serif]">
                  {artist.artistName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
                  Verified Artist
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {artist.genres?.join(' • ') || 'Afro-fusion'} • Projects Mandatory Creator
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsSupportModalOpen(true)}
              className="flex-1 sm:flex-initial min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/60 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Support & Tip Artist</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              title="Share on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
              title="Copy Profile Link"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bio & Backing Summary */}
        <div className="p-6 sm:p-8 pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Artist Biography
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {artist.bio}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Direct Fan Monetization</span>
            </h4>
            <p className="text-xs text-slate-400">
              When you buy tracks or tip {artist.artistName}, <strong className="text-emerald-400">70%</strong> is credited directly to their creator wallet via Airtel Money & Mpamba.
            </p>
          </div>
        </div>
      </div>

      {/* Discography & Tracks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white font-['Syne',sans-serif]">
              Official Master Catalog ({artistSongs.length})
            </h2>
            <p className="text-xs text-slate-400">Purchase high-bitrate studio masters and support {artist.artistName}</p>
          </div>
        </div>

        {artistSongs.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <Disc className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No published tracks available yet for this artist.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {artistSongs.map((song) => {
              const isPlaying = playingSongId === song.id;
              return (
                <div
                  key={song.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0 group">
                      <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
                      {song.audioFilePath && (
                        <button
                          onClick={() => handleTogglePlay(song)}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                        </button>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => onSelectSong(song.id)}
                        className="text-sm font-bold text-white hover:text-rose-400 text-left line-clamp-1 transition"
                      >
                        {song.title}
                      </button>
                      <div className="text-xs text-slate-400">
                        {song.genre} • <span className="text-emerald-400 font-bold">MK {song.priceMWK.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onBuy(song)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-rose-950/50 flex items-center gap-1.5 shrink-0 transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Buy</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Supporter Feed */}
      {tips.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white font-['Syne',sans-serif] flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>Recent Backers & Fan Messages ({tips.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {tips.slice(0, 6).map((tip) => (
              <div key={tip.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">{tip.supporterName}</span>
                  <span className="font-bold text-emerald-400">MK {tip.amountMWK.toLocaleString()}</span>
                </div>
                {tip.message && (
                  <p className="text-xs text-slate-300 italic line-clamp-2">
                    &quot;{tip.message}&quot;
                  </p>
                )}
                <span className="text-[10px] text-slate-500 block">
                  {new Date(tip.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Support Artist Modal */}
      <SupportArtistModal
        artistId={artist.id}
        artistName={artist.artistName}
        artistAvatar={artist.avatarUrl}
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </div>
  );
};
