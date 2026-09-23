import React from 'react';
import { Disc, Award, Music, Shield, Sparkles, MapPin, Radio, Heart, Users, TrendingUp } from 'lucide-react';
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
          <Badge variant="primary">EMPOWERING AFRICAN CREATORS</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Syne',sans-serif]">
            About Projects Mandatory
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The premier digital music marketplace connecting independent African artists with fans through authentic uncompressed master audio, 70% direct payouts, and viral Share & Boost tools.
          </p>
        </div>
      </div>

      {/* Main Mission & Visual */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Visual */}
        <div className="md:col-span-5 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop"
              alt="Projects Mandatory African Music Platform"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Lilongwe & Blantyre, Malawi</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Radio className="w-4 h-4 text-blue-400" />
              <span>Afro-fusion, Afro-Pop, Amapiano, Gospel & Hip-Hop</span>
            </div>
          </div>
        </div>

        {/* Right Story Copy */}
        <div className="md:col-span-7 space-y-6 text-sm text-slate-300 leading-relaxed">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white font-['Syne',sans-serif]">
              Built For Independent Artists
            </h3>
            <p>
              Projects Mandatory was conceived to solve the fundamental challenge African musicians face: streaming algorithms that pay fractions of a cent while withholding direct fan relationships.
            </p>
            <p>
              Here, every verified artist has direct storefront publishing access. Set track prices up to MK 5,000, keep 70% of every sale, and get paid directly to Airtel Money, TNM Mpamba, or bank account.
            </p>
            <p>
              When music fans purchase tracks on Projects Mandatory, they receive uncompressed studio masters (320kbps MP3 and lossless WAV audio) that remain theirs permanently on any device.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              <span>Share & Boost Referral Engine</span>
            </h4>
            <p className="text-xs text-slate-300">
              Our unique Share & Boost technology equips artists with custom tracked links for every track they release. Share across WhatsApp, TikTok, Instagram, and Facebook to monitor fan clicks and convert viral listeners into loyal paying supporters.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400">
            <span className="font-semibold text-slate-300 block mb-1">Project Ownership & Governance:</span>
            Projects Mandatory is an independent digital media platform founded and legally owned by Hapsin. All intellectual property, trademarks, and master catalog rights are administered under Malawian and international copyright statutes.
          </div>

          <div className="pt-2">
            <button
              onClick={onExploreMusic}
              className="min-h-[46px] px-6 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-950/40 transition"
            >
              Explore the Music Catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
