import React from 'react';
import { Download, ShieldCheck, Zap, Disc3, Sparkles, HelpCircle, ArrowRight, Music2, Award, FileAudio, Megaphone } from 'lucide-react';
import { Song, ArtistSettings } from '../types';
import { SongGrid } from '../components/music/SongGrid';
import { SongCard } from '../components/music/SongCard';
import { Badge } from '../components/common/Badge';

interface HomePageProps {
  songs: Song[];
  artistInfo: Partial<ArtistSettings>;
  onBuy: (song: Song) => void;
  onSelectSong: (songId: string) => void;
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  songs,
  artistInfo,
  onBuy,
  onSelectSong,
  onNavigate,
}) => {
  const featuredSongs = songs.filter((s) => s.isFeatured).slice(0, 3);
  const latestSong = songs.find((s) => s.isLatest) || songs[0];
  const popularSongs = [...songs].sort((a, b) => b.downloadCount - a.downloadCount).slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-24">
      
      {/* ===================================================
          HERO SECTION
          =================================================== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800/80 p-6 sm:p-10 lg:p-16">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Hero Left Copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Hapsin Music Store & Artist Hub</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-['Syne',sans-serif]">
              Music That <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300">
                Belongs To You.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed font-normal">
              Discover official releases from <strong className="text-white">Hapsin</strong> and featured African artists. Buy tracks and download original studio masters instantly with zero subscription lock-in.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                onClick={() => onNavigate('/music')}
                className="min-h-[50px] px-7 py-3.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-rose-950/60 border border-rose-500/40 flex items-center justify-center gap-2 transition"
              >
                <span>EXPLORE MUSIC</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('/promote')}
                className="min-h-[50px] px-6 py-3.5 bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 hover:text-amber-200 font-bold text-sm rounded-xl border border-amber-800/60 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>PROMOTE YOUR MUSIC</span>
              </button>
            </div>

            {/* Key Trust Signals */}
            <div className="pt-4 grid grid-cols-3 gap-2 border-t border-slate-800/80 text-left">
              <div>
                <span className="block text-xs font-bold text-white font-mono">100% DIRECT</span>
                <span className="text-[11px] text-slate-400">Direct Artist Support</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-emerald-400 font-mono">PAYCHANGU</span>
                <span className="text-[11px] text-slate-400">Airtel, Mpamba, Card</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-orange-400 font-mono">320K + WAV</span>
                <span className="text-[11px] text-slate-400">Studio Master Files</span>
              </div>
            </div>
          </div>

          {/* Hero Right Visual */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-900 group">
              <div className="aspect-[4/5] w-full overflow-hidden bg-slate-800">
                <img
                  src={artistInfo.profileImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop'}
                  alt="Hapsin official recording artist"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Overlay Artist Tag */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-5 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-rose-400 font-mono font-semibold uppercase tracking-wider block">
                      Recording Artist & Producer
                    </span>
                    <h3 className="text-xl font-bold text-white font-['Syne',sans-serif]">
                      Hapsin
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <Disc3 className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          ARTIST PROMOTION HIGHLIGHT BANNER
          =================================================== */}
      <section className="rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-rose-950/60 border border-amber-800/40 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-950 border border-amber-700/80 text-amber-300 text-[10px] font-extrabold uppercase">
                Calling All Artists
              </span>
              <span className="text-xs text-slate-400">Expand your listener base</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white font-['Syne',sans-serif]">
              Want To Promote Your Music On Hapsin?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Submit your tracks, cover art, and details. Our management team reviews all submissions to feature and sell your music to Malawian and African listeners.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/promote')}
          className="min-h-[48px] px-6 py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-950/50 flex items-center gap-2 transition shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>SUBMIT YOUR MUSIC</span>
        </button>
      </section>

      {/* ===================================================
          LATEST RELEASE SPOTLIGHT
          =================================================== */}
      {latestSong && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="accent" size="sm">
                  NEW DROP
                </Badge>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Fresh from the studio
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 font-['Syne',sans-serif]">
                Latest Release
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/music')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>View all releases</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 sm:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center">
            <div
              onClick={() => onSelectSong(latestSong.id)}
              className="relative aspect-square w-full md:w-64 md:h-64 rounded-2xl overflow-hidden bg-slate-800 shrink-0 cursor-pointer group"
            >
              <img
                src={latestSong.coverImage}
                alt={latestSong.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3">
                <Badge variant="accent">HOT RELEASE</Badge>
              </div>
            </div>

            <div className="flex-1 space-y-4 text-left w-full">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  {latestSong.genre} • Released {latestSong.releaseDate}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white font-['Syne',sans-serif]">
                  {latestSong.title}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {latestSong.artist} {latestSong.featuredArtists && <span className="text-slate-500">{latestSong.featuredArtists}</span>}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                {latestSong.description}
              </p>

              <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400 py-2 border-y border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <FileAudio className="w-4 h-4 text-rose-400" />
                  <span>{latestSong.fileFormat}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-400" />
                  <span>Size: {latestSong.fileSize}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Price
                  </span>
                  <span className="text-2xl font-black text-white font-mono">
                    MK {latestSong.priceMWK.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onSelectSong(latestSong.id)}
                    className="min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition text-center"
                  >
                    Track Details
                  </button>
                  <button
                    onClick={() => onBuy(latestSong)}
                    className="min-h-[44px] px-6 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>BUY & DOWNLOAD</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          FEATURED RELEASES
          =================================================== */}
      {featuredSongs.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Handpicked Masters
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5 font-['Syne',sans-serif]">
                Featured Releases
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/music')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>See all {songs.length} tracks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onBuy={onBuy}
                onSelectSong={onSelectSong}
              />
            ))}
          </div>
        </section>
      )}

      {/* Fresh Catalog Blank State if 0 Songs */}
      {songs.length === 0 && (
        <section className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <Music2 className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-white font-['Syne',sans-serif]">
              Studio Master Catalog Starting Fresh
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
              New official studio tracks are being prepared for release. Log in to the Admin Portal with your authorized Google account to upload and publish master recordings.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('/admin/login')}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition"
            >
              Admin Sign In
            </button>
            <button
              onClick={() => onNavigate('/about')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              About Hapsin
            </button>
          </div>
        </section>
      )}

      {/* ===================================================
          POPULAR DOWNLOADS
          =================================================== */}
      {popularSongs.length > 0 && (
        <section className="space-y-6">
          <div>
            <span className="text-xs font-mono text-orange-400 uppercase tracking-wider font-semibold">
              Fan Favorites
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5 font-['Syne',sans-serif]">
              Popular Downloads
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onBuy={onBuy}
                onSelectSong={onSelectSong}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {/* ===================================================
          WHY HAPSIN
          =================================================== */}
      <section className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 sm:p-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono text-rose-400 uppercase tracking-wider font-bold">
            The Studio Standard
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 font-['Syne',sans-serif]">
            Why Buy On Hapsin?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            No algorithms. No streaming rentals. You pay once, support the artist directly, and the music stays on your device forever.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">100% Direct Artist Support</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every Kwacha paid goes directly to Hapsin and featuring artists to fund new music, studio instrumentation, and independent production.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Disc3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Full Studio Master Quality</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Downloads include full bitrate 320kbps MP3s and uncompressed WAV master files. Hear the songs exactly as mixed in the studio.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Instant Malawi Mobile Money</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pay quickly with Airtel Money, TNM Mpamba, Visa card, or Bank Transfer via PayChangu. Downloads start automatically after verification.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================
          ABOUT ARTIST TEASER
          =================================================== */}
      <section className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 p-6 sm:p-10 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <Badge variant="primary">THE CREATIVE VISION</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Syne',sans-serif]">
              About Hapsin
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              {artistInfo.artistBio || 'Hapsin is a premier recording artist and producer pioneering modern Afro-fusion and authentic Malawian rhythms directly to the world.'}
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('/about')}
                className="min-h-[44px] px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 transition"
              >
                Read Full Artist Story
              </button>
            </div>
          </div>
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
              <img
                src={artistInfo.profileImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop'}
                alt="Hapsin Portrait"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          FAQ SECTION
          =================================================== */}
      <section className="space-y-6 text-left">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-mono text-blue-400 uppercase tracking-wider font-bold">
            Got Questions?
          </span>
          <h2 className="text-2xl font-bold text-white mt-1 font-['Syne',sans-serif]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>How can other artists promote their music on this website?</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Artists can click &quot;Promote Music&quot; in the navigation bar to submit their track title, cover artwork, audio master, genre, and contact info. Hapsin&apos;s management reviews and accepts submissions directly in the Admin Dashboard.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>What payment methods are supported in Malawi?</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We support Airtel Money, TNM Mpamba, Visa & Mastercard debit/credit cards, and direct bank transfers via our PayChangu integration.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
              <span>How do I get my download after paying?</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Once your payment is verified by our secure server, your file download begins automatically in your browser. You will also receive your download link and receipt for future access.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Do I need an account to buy music?</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              No, guest purchases are fully supported. However, signing in with Google allows you to easily view your purchase history and re-download your tracks anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
