import React, { useState, useEffect } from 'react';
import { Disc, Heart, Sparkles, User, ExternalLink, ArrowRight, ShieldCheck, Music } from 'lucide-react';
import { ArtistProfile } from '../../types';
import { subscribeAllArtists } from '../../lib/firebase';
import { SupportArtistModal } from '../../components/artist/SupportArtistModal';

interface ArtistsListPageProps {
  onSelectArtist: (artistId: string) => void;
  onJoinAsArtist: () => void;
}

export const ArtistsListPage: React.FC<ArtistsListPageProps> = ({
  onSelectArtist,
  onJoinAsArtist,
}) => {
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [selectedArtistForSupport, setSelectedArtistForSupport] = useState<ArtistProfile | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAllArtists((list) => {
      // If empty, ensure default verified creators are included
      if (list.length === 0) {
        setArtists([
          {
            id: 'jay-vibes',
            userId: 'jay-vibes',
            artistName: 'Jay Vibes',
            email: 'jayvibes@projectsmandatory.com',
            phone: '0984 67 96 91',
            bio: 'Independent recording artist on Projects Mandatory. African contemporary afro-fusion & urban hits.',
            genres: ['Afro-fusion', 'Urban Pop'],
            avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
            payoutDetails: {
              accountType: 'AIRTEL_MONEY',
              accountNumber: '0984 67 96 91',
              accountName: 'Jay Vibes Music',
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
          },
        ]);
      } else {
        setArtists(list);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8 text-left animate-in fade-in pb-16">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-xs font-bold text-indigo-300 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured Creators</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Syne',sans-serif]">
            Verified Artists & Producers
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
            Discover Malawian recording artists on Projects Mandatory. Stream studio singles, download uncompressed master files, and directly tip creators.
          </p>
        </div>

        <button
          onClick={onJoinAsArtist}
          className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/50 transition flex items-center gap-2 shrink-0 active:scale-95"
        >
          <Music className="w-4 h-4" />
          <span>Join as an Artist</span>
        </button>
      </div>

      {/* Artists Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {artists.map((artist) => (
          <div
            key={artist.id}
            className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-xl p-5 flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3.5">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 border-rose-500/40 shrink-0 group-hover:scale-105 transition">
                  <img
                    src={artist.avatarUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop'}
                    alt={artist.artistName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition">
                      {artist.artistName}
                    </h3>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-400">
                    {artist.genres?.join(', ') || 'Afro-fusion'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {artist.bio || 'Verified recording artist on Projects Mandatory.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
              <button
                onClick={() => onSelectArtist(artist.id)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>View Music</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setSelectedArtistForSupport(artist)}
                className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5"
                title="Support / Tip Artist"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Tip</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Support Modal if triggered */}
      {selectedArtistForSupport && (
        <SupportArtistModal
          artistId={selectedArtistForSupport.id}
          artistName={selectedArtistForSupport.artistName}
          artistAvatar={selectedArtistForSupport.avatarUrl}
          isOpen={!!selectedArtistForSupport}
          onClose={() => setSelectedArtistForSupport(null)}
        />
      )}
    </div>
  );
};
