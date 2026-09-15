import React from 'react';
import { Disc, Award, Music, Shield, Sparkles, MapPin, Radio, Heart } from 'lucide-react';
import { ArtistSettings } from '../types';
import { Badge } from '../components/common/Badge';

interface AboutPageProps {
  artistInfo: Partial<ArtistSettings>;
  onExploreMusic: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  artistInfo,
  onExploreMusic,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 text-left animate-in fade-in">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <Badge variant="primary">THE ARTIST BEHIND THE SOUND</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Syne',sans-serif]">
            About Hapsin
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Pioneering modern Afro-fusion, authentic rhythms, and empowering fellow African artists with direct listener ownership.
          </p>
        </div>
      </div>

      {/* Main Artist Story & Portrait */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Artist Image */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-xl">
            <img
              src={artistInfo.profileImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop'}
              alt="Hapsin Artist Portrait"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Lilongwe / Blantyre, Malawi</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Radio className="w-4 h-4 text-blue-400" />
              <span>Afro-fusion, Afro-Pop, Amapiano, Conscious</span>
            </div>
          </div>
        </div>

        {/* Right Story Copy */}
        <div className="md:col-span-7 space-y-6 text-sm text-slate-300 leading-relaxed">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white font-['Syne',sans-serif]">
              The Music & The Vision
            </h3>
            <p>
              Hapsin represents a commitment to pure artistic expression and authentic sonic craft. Instead of relying on algorithmic streaming machines and fractional streaming royalties, this platform was built to re-establish the authentic connection between the music creator and the listener.
            </p>
            <p>
              Every track released on Hapsin is recorded, mixed, and mastered to studio specifications. When you buy a song here, you receive a full-fidelity master audio file that lives on your phone, flash drive, or audio library without needing recurring subscriptions or continuous internet data.
            </p>
            <p>
              Furthermore, Hapsin opens its platform to other upcoming and established artists who want to promote and monetize their master recordings directly to an engaged audience across Malawi and Africa.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Direct Music Distribution & Artist Promotion
            </h4>
            <p className="text-xs text-slate-300">
              Streaming services pay fractions of a cent per play while compressing audio quality. By owning master copies and buying directly via Airtel Money, TNM Mpamba, or card, listeners genuinely support the creative community.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onExploreMusic}
              className="min-h-[46px] px-6 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-950/40 transition"
            >
              Explore the Catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
