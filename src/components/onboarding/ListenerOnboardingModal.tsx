import React, { useState } from 'react';
import {
  Sparkles,
  Music2,
  Users,
  Check,
  ArrowRight,
  X,
  Volume2,
  ShieldCheck,
  Radio,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useDataSaver } from '../../context/DataSaverContext';

interface ListenerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (genres: string[], followedArtists: string[]) => void;
}

const AVAILABLE_GENRES = [
  { id: 'Afrobeats', name: 'Afrobeats', emoji: '🔥' },
  { id: 'Amapiano', name: 'Amapiano', emoji: '🎹' },
  { id: 'Hip-Hop', name: 'Hip-Hop / Rap', emoji: '🎤' },
  { id: 'R&B', name: 'R&B / Soul', emoji: '✨' },
  { id: 'Dancehall', name: 'Dancehall', emoji: '⚡' },
  { id: 'Afro-Pop', name: 'Afro-Pop', emoji: '🌟' },
  { id: 'Gospel', name: 'Gospel & Praise', emoji: '🙌' },
  { id: 'Reggae', name: 'Reggae & Roots', emoji: '🌿' },
  { id: 'Trap', name: 'Trap / Drill', emoji: '💣' },
  { id: 'House', name: 'Deep House / Afro-House', emoji: '🔊' },
  { id: 'Lo-Fi', name: 'Chill & Lo-Fi', emoji: '🌙' },
  { id: 'Pop', name: 'Global Pop', emoji: '🎧' },
];

const SUGGESTED_ARTISTS = [
  {
    id: 'artist_1',
    name: 'Eli Njuchi',
    genre: 'Afrobeats / Dancehall',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'artist_2',
    name: 'Driemo MW',
    genre: 'Afro-Pop / R&B',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'artist_3',
    name: 'Tay Grin',
    genre: 'Hip-Hop / Nyau King',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'artist_4',
    name: 'Gwamba',
    genre: 'Gospel Hip-Hop',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'artist_5',
    name: 'Faith Mussa',
    genre: 'Acoustic / Traditional',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop',
  },
];

export const ListenerOnboardingModal: React.FC<ListenerOnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { isDark } = useTheme();
  const { user, loginWithGoogle, loginWithEmail, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { isDataSaverEnabled, toggleDataSaver } = useDataSaver();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Afrobeats', 'Amapiano']);
  const [followedArtists, setFollowedArtists] = useState<string[]>(['artist_1', 'artist_2']);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [audioQuality, setAudioQuality] = useState<'standard' | 'high'>('high');

  if (!isOpen) return null;

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((g) => g !== genreId) : [...prev, genreId]
    );
  };

  const toggleFollowArtist = (artistId: string) => {
    setFollowedArtists((prev) =>
      prev.includes(artistId) ? prev.filter((id) => id !== artistId) : [...prev, artistId]
    );
  };

  const handleFinish = () => {
    try {
      localStorage.setItem('pm_onboarding_completed', 'true');
      localStorage.setItem('pm_listener_interests', JSON.stringify(selectedGenres));
      localStorage.setItem('pm_followed_artists', JSON.stringify(followedArtists));
      localStorage.setItem('pm_preferred_audio_quality', audioQuality);
    } catch {}

    onComplete(selectedGenres, followedArtists);
    showToast('Preferences saved! Enjoy streaming.', 'success');
    onClose();
  };

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestEmail.trim()) {
      loginWithEmail(guestEmail.trim(), guestName.trim() || undefined);
    }
    setStep(2);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border text-left space-y-5 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto ${
          isDark ? 'bg-[#0E131F] border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'
        }`}
      >
        {/* Header with Progress dots & Skip Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-6 bg-[#1455D9]'
                    : s < step
                    ? 'w-2 bg-[#1455D9]/50'
                    : isDark
                    ? 'w-2 bg-slate-800'
                    : 'w-2 bg-slate-200'
                }`}
              />
            ))}
            <span className="text-[11px] font-bold text-slate-400 ml-2">Step {step} of 4</span>
          </div>

          <button
            onClick={handleFinish}
            className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg transition hover:bg-slate-800/50"
          >
            Skip
          </button>
        </div>

        {/* STEP 1: WELCOME & ACCOUNT */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1455D9]/15 text-[#1455D9] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Welcome to Projects Mandatory</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Stream African music in studio quality
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Support independent Malawian and African artists with 70% direct payouts. Sign in to save playlists, likes, and sync across devices.
              </p>
            </div>

            {isAuthenticated ? (
              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="w-10 h-10 rounded-full bg-[#1455D9] text-white flex items-center justify-center font-bold">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                  <p className="text-sm font-bold truncate">{user?.name || user?.email}</p>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl bg-[#1455D9] text-white text-xs font-bold hover:bg-[#1146B8] transition active:scale-95 shadow-md flex items-center gap-1"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <button
                  onClick={async () => {
                    await loginWithGoogle();
                    setStep(2);
                  }}
                  className={`w-full py-3 rounded-2xl border font-bold text-xs sm:text-sm transition active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800'
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-slate-700/60 w-full" />
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-3 ${
                    isDark ? 'bg-[#0E131F] text-slate-500' : 'bg-white text-slate-400'
                  }`}>
                    or enter email
                  </span>
                  <div className="border-t border-slate-700/60 w-full" />
                </div>

                <form onSubmit={handleEmailContinue} className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Your Name (optional)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-[#1455D9]'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#1455D9]'
                    }`}
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-[#1455D9]'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#1455D9]'
                    }`}
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#1455D9] text-white font-bold text-xs hover:bg-[#1146B8] transition active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: GENRES & INTERESTS */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                What music do you vibe to?
              </h3>
              <p className="text-xs text-slate-400">
                Choose a few genres to personalize your discovery and top recommendations.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1 max-h-[48vh] overflow-y-auto no-scrollbar">
              {AVAILABLE_GENRES.map((g) => {
                const isSelected = selectedGenres.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    className={`p-3 rounded-2xl border text-left transition active:scale-95 flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#1455D9]/20 border-[#1455D9] text-white shadow-sm'
                        : isDark
                        ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{g.emoji}</span>
                      <span className="text-xs font-bold truncate">{g.name}</span>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#1455D9] flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl bg-[#1455D9] text-white font-bold text-xs hover:bg-[#1146B8] transition active:scale-95 shadow-md flex items-center gap-1.5"
              >
                <span>Next: Follow Artists</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FOLLOW ARTISTS */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                Follow your favorite artists
              </h3>
              <p className="text-xs text-slate-400">
                Get notified whenever they drop new studio singles, albums, or live events.
              </p>
            </div>

            <div className="space-y-2 max-h-[46vh] overflow-y-auto no-scrollbar py-1">
              {SUGGESTED_ARTISTS.map((artist) => {
                const isFollowed = followedArtists.includes(artist.id);
                return (
                  <div
                    key={artist.id}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1 text-left">
                        <h4 className="text-xs font-bold truncate leading-tight">{artist.name}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{artist.genre}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFollowArtist(artist.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                        isFollowed
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-[#1455D9] text-white hover:bg-[#1146B8] shadow-sm'
                      }`}
                    >
                      {isFollowed ? 'Following' : '+ Follow'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-5 py-2.5 rounded-xl bg-[#1455D9] text-white font-bold text-xs hover:bg-[#1146B8] transition active:scale-95 shadow-md flex items-center gap-1.5"
              >
                <span>Next: Audio Preferences</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: AUDIO QUALITY & DATA SAVER */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                Listening & Data Preferences
              </h3>
              <p className="text-xs text-slate-400">
                Tailor playback quality for Malawian data bundles and low-bandwidth connections.
              </p>
            </div>

            <div className="space-y-3 py-1">
              {/* Audio Quality selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Default Audio Quality</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAudioQuality('standard')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      audioQuality === 'standard'
                        ? 'bg-[#1455D9]/20 border-[#1455D9] text-white'
                        : isDark
                        ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold">Standard (128kbps)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Saves ~60% mobile data</p>
                  </button>

                  <button
                    onClick={() => setAudioQuality('high')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      audioQuality === 'high'
                        ? 'bg-[#1455D9]/20 border-[#1455D9] text-white'
                        : isDark
                        ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold">High (320kbps)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Crisp studio acoustics</p>
                  </button>
                </div>
              </div>

              {/* Data Saver Mode Toggle */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <h4 className="text-xs font-bold">Data Saver Mode</h4>
                  <p className="text-[11px] text-slate-400">
                    Reduces image resolutions and preloading on Airtel / TNM networks
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isDataSaverEnabled}
                  onChange={toggleDataSaver}
                  className="w-5 h-5 accent-[#1455D9] rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep(3)}
                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-xl"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                className="px-6 py-3 rounded-2xl bg-[#1455D9] text-white font-bold text-xs hover:bg-[#1146B8] transition active:scale-95 shadow-lg shadow-blue-900/30 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Listening Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
