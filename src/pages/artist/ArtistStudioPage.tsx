import React, { useState } from 'react';
import {
  Disc,
  Upload,
  Heart,
  DollarSign,
  Share2,
  CheckCircle2,
  Clock,
  XCircle,
  Play,
  Pause,
  Sparkles,
  Smartphone,
  ArrowRight,
  TrendingUp,
  User,
  Music,
  ExternalLink,
  Copy,
  MessageCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useArtist } from '../../context/ArtistContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { ArtistSongSubmission } from '../../types';

interface ArtistStudioPageProps {
  onNavigateStore: () => void;
  onNavigateArtistProfile: (artistId: string) => void;
}

type TabType = 'overview' | 'upload' | 'catalog' | 'tips' | 'growth' | 'payouts';

const GENRE_OPTIONS = [
  'Afro-fusion',
  'Afro-pop',
  'Amapiano',
  'Hip Hop / Rap',
  'Dancehall / Reggae',
  'Gospel / Praise',
  'R&B / Soul',
  'Traditional / Acoustic',
];

export const ArtistStudioPage: React.FC<ArtistStudioPageProps> = ({
  onNavigateStore,
  onNavigateArtistProfile,
}) => {
  const { user, isAuthenticated, loginWithGoogle } = useAuth();
  const {
    artistProfile,
    isArtist,
    isLoading,
    submissions,
    tips,
    payouts,
    registerArtistProfile,
    updateArtistProfile,
    submitSongUpload,
  } = useArtist();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Registration Form State (for new artists)
  const [regStageName, setRegStageName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regGenres, setRegGenres] = useState<string[]>(['Afro-fusion']);
  const [regPayoutType, setRegPayoutType] = useState<'AIRTEL_MONEY' | 'TNM_MPAMBA' | 'BANK'>('AIRTEL_MONEY');
  const [regPayoutNumber, setRegPayoutNumber] = useState('');
  const [regPayoutName, setRegPayoutName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFeatured, setUploadFeatured] = useState('');
  const [uploadGenre, setUploadGenre] = useState('Afro-fusion');
  const [uploadPrice, setUploadPrice] = useState<number>(1500);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadLyrics, setUploadLyrics] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmittingUpload, setIsSubmittingUpload] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [uploadProgressPercent, setUploadProgressPercent] = useState(0);

  // Audio Preview state
  const [playingSubmissionId, setPlayingSubmissionId] = useState<string | null>(null);
  const [activeAudioElement, setActiveAudioElement] = useState<HTMLAudioElement | null>(null);

  // Handle Song Audio Preview
  const handleTogglePlay = (submission: ArtistSongSubmission) => {
    if (!submission.audioFilePath) {
      showToast('No audio stream available for this track yet', 'info');
      return;
    }

    if (playingSubmissionId === submission.id) {
      if (activeAudioElement) {
        activeAudioElement.pause();
      }
      setPlayingSubmissionId(null);
    } else {
      if (activeAudioElement) {
        activeAudioElement.pause();
      }
      const audio = new Audio(submission.audioFilePath);
      audio.play();
      audio.onended = () => setPlayingSubmissionId(null);
      setActiveAudioElement(audio);
      setPlayingSubmissionId(submission.id);
    }
  };

  // Handle Cover Art selection
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // Submit Artist Account Creation
  const handleRegisterArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regStageName.trim()) {
      showToast('Please enter your Artist / Stage Name', 'error');
      return;
    }
    if (!regPhone.trim()) {
      showToast('Please enter your phone number', 'error');
      return;
    }
    if (!regPayoutNumber.trim()) {
      showToast('Please provide your Airtel Money or Mpamba number for payouts', 'error');
      return;
    }

    setIsRegistering(true);
    try {
      await registerArtistProfile({
        artistName: regStageName.trim(),
        phone: regPhone.trim(),
        whatsapp: regWhatsapp.trim() || regPhone.trim(),
        bio: regBio.trim() || `Artist on Projects Mandatory.`,
        genres: regGenres,
        payoutDetails: {
          accountType: regPayoutType,
          accountNumber: regPayoutNumber.trim(),
          accountName: regPayoutName.trim() || regStageName.trim(),
        },
      });
      setActiveTab('overview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      showToast(msg, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  // Submit Track Upload Request
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      showToast('Please provide a track title', 'error');
      return;
    }
    if (!audioFile) {
      showToast('Please attach the Master Audio recording (MP3/WAV)', 'error');
      return;
    }
    if (uploadPrice > 5000) {
      showToast('Maximum allowed track price is MK 5,000', 'error');
      return;
    }

    setIsSubmittingUpload(true);
    setUploadProgressPercent(5);
    setUploadProgressText('Preparing master audio file...');

    try {
      await submitSongUpload({
        title: uploadTitle.trim(),
        featuredArtists: uploadFeatured.trim(),
        genre: uploadGenre,
        releaseDate: new Date().toISOString().split('T')[0],
        priceMWK: Math.min(Math.max(0, uploadPrice), 5000),
        description: uploadDescription.trim() || `Official single by ${artistProfile?.artistName}`,
        lyrics: uploadLyrics.trim(),
        audioFile,
        coverFile: coverFile || undefined,
        onProgress: (step, percent) => {
          setUploadProgressText(step);
          setUploadProgressPercent(percent);
        },
      });

      // Reset form
      setUploadTitle('');
      setUploadFeatured('');
      setUploadPrice(1500);
      setUploadDescription('');
      setUploadLyrics('');
      setAudioFile(null);
      setCoverFile(null);
      setCoverPreview(null);
      setActiveTab('catalog');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Song upload request failed';
      showToast(msg, 'error');
    } finally {
      setIsSubmittingUpload(false);
      setUploadProgressPercent(0);
    }
  };

  // Copy artist share link
  const handleCopyInviteLink = () => {
    const profileUrl = `${window.location.origin}/?artist=${artistProfile?.id || ''}`;
    navigator.clipboard.writeText(profileUrl);
    showToast('Artist profile invite link copied to clipboard!', 'success');
  };

  // Share on WhatsApp
  const handleShareToWhatsApp = () => {
    const profileUrl = `${window.location.origin}/?artist=${artistProfile?.id || ''}`;
    const text = `Hey! Check out my official music on Projects Mandatory. Stream, download master recordings, and support my music journey directly here: ${profileUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // 1. IF NOT LOGGED IN
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-600 to-indigo-600 p-0.5 mx-auto shadow-xl shadow-rose-950/50 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
            <Disc className="w-8 h-8 text-rose-500 animate-[spin_10s_linear_infinite]" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-xs font-bold text-rose-300 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Projects Mandatory Artist Studio</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Syne',sans-serif]">
            Monetize & Share Your Music in Malawi
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Create your artist account, upload your studio tracks with custom pricing (up to MK 5,000), receive direct fan support, and keep <strong className="text-emerald-400">70% of all earnings</strong>.
          </p>
        </div>

        {/* Value Proposition Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left pt-2">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">70% Artist Share</h4>
            <p className="text-xs text-slate-400">Set your track price up to K5,000 and keep 70% paid out via Airtel Money / Mpamba.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <Heart className="w-5 h-5 text-rose-400" />
            <h4 className="text-sm font-bold text-white">Direct Fan Support</h4>
            <p className="text-xs text-slate-400">Invite your followers to back your music with direct tips and donations in the app.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">Scalable Growth Hub</h4>
            <p className="text-xs text-slate-400">Share customized WhatsApp invite links and build a loyal paying fanbase.</p>
          </div>
        </div>

        <div className="pt-4 max-w-md mx-auto space-y-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-rose-600 hover:bg-rose-500 font-bold"
            onClick={loginWithGoogle}
          >
            <User className="w-5 h-5" />
            <span>Sign In with Google to Create Artist Account</span>
          </Button>
          <p className="text-xs text-slate-500">
            Quick 1-click Google authentication. No complex setup required.
          </p>
        </div>
      </div>
    );
  }

  // 2. IF AUTHENTICATED BUT DOES NOT HAVE AN ARTIST PROFILE YET
  if (!isArtist) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 space-y-6 text-left animate-in fade-in">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
            <Music className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-white font-['Syne',sans-serif]">
            Set Up Your Artist Studio Profile
          </h2>
          <p className="text-xs text-slate-400">
            Welcome, <strong>{user?.name}</strong>. Complete your stage name and payout details to start uploading tracks.
          </p>
        </div>

        <form onSubmit={handleRegisterArtist} className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Stage Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Artist / Producer / Band Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Blantyre Boy, DJ Spark, Hapsin"
              value={regStageName}
              onChange={(e) => setRegStageName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Contact Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="09... / 08..."
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                WhatsApp Hotline Number
              </label>
              <input
                type="tel"
                placeholder="09... / 08..."
                value={regWhatsapp}
                onChange={(e) => setRegWhatsapp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Artist Bio / Tagline
            </label>
            <textarea
              rows={2}
              placeholder="Tell your fans about your music journey, style, and achievements."
              value={regBio}
              onChange={(e) => setRegBio(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          {/* Primary Genre */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Primary Music Genre
            </label>
            <select
              value={regGenres[0] || 'Afro-fusion'}
              onChange={(e) => setRegGenres([e.target.value])}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            >
              {GENRE_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* 70% Payout Account Configuration */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                70% Earnings Payout Account Details
              </h4>
            </div>
            <p className="text-[11px] text-slate-400">
              Where we disburse your 70% share from song sales and fan support.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Account Type</label>
                <select
                  value={regPayoutType}
                  onChange={(e) => setRegPayoutType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="TNM_MPAMBA">TNM Mpamba</option>
                  <option value="BANK">National Bank / Standard Bank</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Phone / Account No. *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 0999 123 456"
                  value={regPayoutNumber}
                  onChange={(e) => setRegPayoutNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Registered Account Name</label>
              <input
                type="text"
                placeholder="Name registered on Mobile Money SIM"
                value={regPayoutName}
                onChange={(e) => setRegPayoutName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isRegistering}
            className="w-full font-bold text-xs uppercase tracking-wider py-3.5 bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/50"
          >
            Activate Artist Account & Enter Studio
          </Button>
        </form>
      </div>
    );
  }

  // 3. ARTIST PORTAL / STUDIO
  const calculatedPriceArtistShare = Math.round(uploadPrice * 0.7);
  const calculatedPricePlatformShare = uploadPrice - calculatedPriceArtistShare;

  const totalEarnedMWK = artistProfile.wallet?.totalEarnedMWK || 0;
  const pendingPayoutMWK = artistProfile.wallet?.pendingPayoutMWK || 0;
  const totalTipsMWK = artistProfile.wallet?.totalTipsReceivedMWK || 0;
  const totalSalesCount = artistProfile.wallet?.totalSongSalesCount || 0;
  const totalSupporters = artistProfile.wallet?.totalSupportersCount || 0;

  return (
    <div className="space-y-6 text-left animate-in fade-in pb-16">
      
      {/* Studio Header Card */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/40 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-rose-500/50 shadow-lg bg-slate-800 shrink-0">
              <img
                src={artistProfile.avatarUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop'}
                alt={artistProfile.artistName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Syne',sans-serif]">
                  {artistProfile.artistName}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider">
                  Verified Artist
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {artistProfile.genres?.join(' • ') || 'Afro-fusion'} • Projects Mandatory Studio
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateArtistProfile(artistProfile.id)}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Profile</span>
            </button>
            <button
              onClick={handleShareToWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-950/50 transition flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Invite Followers on WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Revenue Model Callout */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              <strong>Fair 70/30 Revenue Split:</strong> You keep <strong>70%</strong> of every song sale and fan tip. Projects Mandatory takes 30% for hosting and mobile distribution.
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            Price Cap: Max MK 5,000 / track
          </span>
        </div>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Net Earned (70%)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-['Syne',sans-serif]">
            MK {totalEarnedMWK.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-400">Cumulative sales + tips</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Pending Balance</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-['Syne',sans-serif]">
            MK {pendingPayoutMWK.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">Ready for mobile payout</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Fan Tips & Backing</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-['Syne',sans-serif]">
            MK {totalTipsMWK.toLocaleString()}
          </div>
          <p className="text-[11px] text-rose-400">{totalSupporters} direct supporter{totalSupporters === 1 ? '' : 's'}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Tracks & Submissions</span>
            <Disc className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-['Syne',sans-serif]">
            {submissions.length}
          </div>
          <p className="text-[11px] text-indigo-400">{submissions.filter(s => s.status === 'APPROVED').length} live in catalog</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Dashboard', icon: TrendingUp },
          { id: 'upload', label: 'Upload Song Request', icon: Upload, highlight: true },
          { id: 'catalog', label: `My Music (${submissions.length})`, icon: Disc },
          { id: 'tips', label: `Fan Support (${tips.length})`, icon: Heart },
          { id: 'growth', label: 'Follower Growth Hub', icon: Share2 },
          { id: 'payouts', label: 'Payout Settings', icon: Smartphone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                  : tab.highlight
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/40'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW / DASHBOARD SUMMARY */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Upload CTA */}
            <div className="lg:col-span-2 rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white font-['Syne',sans-serif]">
                    Ready to Release a New Track?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Upload your master recording, set your price (up to MK 5,000), and our team will approve it to the live store.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition shrink-0"
                >
                  Upload Track
                </button>
              </div>

              {/* Status of Recent Submissions */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Recent Track Submissions
                </h4>
                {submissions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-500">
                    No track submissions yet. Click &quot;Upload Track&quot; above to submit your first master!
                  </div>
                ) : (
                  submissions.slice(0, 3).map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                          <img src={sub.coverImage} alt={sub.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{sub.title}</div>
                          <div className="text-[11px] text-slate-400">
                            Price: MK {sub.priceMWK.toLocaleString()} (Your 70% share: MK {sub.artistShareMWK.toLocaleString()})
                          </div>
                        </div>
                      </div>

                      <div>
                        {sub.status === 'APPROVED' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                            LIVE IN STORE
                          </span>
                        )}
                        {sub.status === 'PENDING' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-500/40 text-[10px] font-bold">
                            PENDING REVIEW
                          </span>
                        )}
                        {sub.status === 'REJECTED' && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-500/40 text-[10px] font-bold">
                            FEEDBACK GIVEN
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Growth & Invite Card */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-500/40 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Boost Your App Scalability</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Invite your social media and WhatsApp followers directly to your Projects Mandatory artist page. When fans support you, 70% goes straight to your wallet.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleShareToWhatsApp}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share to WhatsApp</span>
                </button>
                <button
                  onClick={handleCopyInviteLink}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Artist Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD SONG REQUEST */}
      {activeTab === 'upload' && (
        <form onSubmit={handleUploadSubmit} className="max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white font-['Syne',sans-serif]">
              Request Song Upload to Projects Mandatory
            </h3>
            <p className="text-xs text-slate-400">
              Submit your master recording. Our team verifies the audio quality and publishes it directly to the store.
            </p>
          </div>

          {/* Master Audio Upload */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-rose-500" />
              <span>1. Studio Audio Master Recording (MP3 / WAV / FLAC) *</span>
            </label>
            <input
              type="file"
              required
              accept="audio/*,.mp3,.wav,.flac"
              onChange={(e) => setAudioFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-600 file:text-white hover:file:bg-rose-500 file:cursor-pointer"
            />
            {audioFile && (
              <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Selected: {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
              </div>
            )}
          </div>

          {/* Cover Art Upload */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <Disc className="w-4 h-4 text-indigo-400" />
              <span>2. Single Cover Artwork (Square Image)</span>
            </label>
            <div className="flex items-center gap-4">
              {coverPreview && (
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                  <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer"
              />
            </div>
          </div>

          {/* Song Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Track Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Zikutentha, Moto, Alipo"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Featured Artists (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. feat. Eli Njuchi, Tay Grin"
                value={uploadFeatured}
                onChange={(e) => setUploadFeatured(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Genre
              </label>
              <select
                value={uploadGenre}
                onChange={(e) => setUploadGenre(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Custom Pricing with K5,000 Cap & 70/30 Split Calculator */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Track Price (MWK) *
                </label>
                <span className="text-[10px] text-amber-400 font-bold">
                  Max MK 5,000
                </span>
              </div>
              <input
                type="number"
                min="0"
                max="5000"
                step="100"
                required
                value={uploadPrice}
                onChange={(e) => setUploadPrice(Math.min(5000, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Real-time 70/30 Split Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span>Your Revenue Split for this Track:</span>
              <span className="text-emerald-400">70% Artist / 30% Platform</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">You Receive (70%):</span>
                <span className="text-sm font-extrabold text-emerald-400 font-['Syne',sans-serif]">
                  MK {calculatedPriceArtistShare.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Platform Fee (30%):</span>
                <span className="text-sm font-extrabold text-slate-300 font-['Syne',sans-serif]">
                  MK {calculatedPricePlatformShare.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Description & Lyrics */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Track Description / Release Notes
            </label>
            <textarea
              rows={2}
              placeholder="Tell listeners what inspired this track, production notes, etc."
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          {/* Progress Indicator */}
          {isSubmittingUpload && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-300 font-semibold">
                <span>{uploadProgressText}</span>
                <span>{Math.round(uploadProgressPercent)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgressPercent}%` }}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmittingUpload}
            className="w-full font-bold text-xs uppercase tracking-wider py-3.5 bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/50"
          >
            Submit Track for Storefront Approval
          </Button>
        </form>
      )}

      {/* TAB 3: MY CATALOG & SUBMISSIONS */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-['Syne',sans-serif]">
              Track Catalog & Approval Pipeline
            </h3>
            <button
              onClick={() => setActiveTab('upload')}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
            >
              + Upload New Track
            </button>
          </div>

          {submissions.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <Disc className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No tracks in your catalog yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Request your first song upload above to start selling and monetizing your music.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => {
                const isPlaying = playingSubmissionId === sub.id;
                return (
                  <div
                    key={sub.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-slate-700"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 group">
                        <img src={sub.coverImage} alt={sub.title} className="w-full h-full object-cover" />
                        {sub.audioFilePath && (
                          <button
                            onClick={() => handleTogglePlay(sub)}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{sub.title}</h4>
                          {sub.featuredArtists && (
                            <span className="text-xs text-slate-400">({sub.featuredArtists})</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                          <span>{sub.genre}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">Price: MK {sub.priceMWK.toLocaleString()}</span>
                          <span>•</span>
                          <span>Your Share (70%): MK {sub.artistShareMWK.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {sub.status === 'APPROVED' && (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>APPROVED & LIVE</span>
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">Available to all fans</p>
                        </div>
                      )}
                      {sub.status === 'PENDING' && (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-500/40 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>PENDING APPROVAL</span>
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1">Admin reviewing master</p>
                        </div>
                      )}
                      {sub.status === 'REJECTED' && (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-500/40 text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>NEEDS REVISION</span>
                          </span>
                          {sub.adminFeedback && (
                            <p className="text-[11px] text-rose-300 mt-1 max-w-xs">{sub.adminFeedback}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FAN SUPPORT & DIRECT TIPS */}
      {activeTab === 'tips' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-['Syne',sans-serif]">
              Direct Fan Contributions & Tips ({tips.length})
            </h3>
            <span className="text-xs font-bold text-emerald-400">
              Total Backing: MK {totalTipsMWK.toLocaleString()}
            </span>
          </div>

          {tips.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <Heart className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No fan tips received yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Share your artist invite link on WhatsApp to invite your followers to back your music journey!
              </p>
              <button
                onClick={handleShareToWhatsApp}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Share on WhatsApp
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {tips.map((tip) => (
                <div
                  key={tip.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{tip.supporterName}</span>
                    <span className="text-xs font-extrabold text-emerald-400">
                      +MK {tip.artistShareMWK.toLocaleString()} (70%)
                    </span>
                  </div>
                  {tip.message && (
                    <p className="text-xs text-slate-300 italic bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      &quot;{tip.message}&quot;
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>via {tip.paymentMethod.replace('_', ' ')}</span>
                    <span>{new Date(tip.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: GROW FANBASE & SCALABILITY HUB */}
      {activeTab === 'growth' && (
        <div className="max-w-3xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <Share2 className="w-3.5 h-3.5" />
              <span>Artist Scalability & Follower Toolkit</span>
            </div>
            <h3 className="text-xl font-bold text-white font-['Syne',sans-serif]">
              Invite Your Followers & Multiply Your Earnings
            </h3>
            <p className="text-xs text-slate-400">
              Your fans can stream your songs, purchase uncompressed master files, and tip you directly in the app.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Your Shareable Artist Link
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/?artist=${artistProfile.id}`}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono focus:outline-none"
              />
              <button
                onClick={handleCopyInviteLink}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-3">
              <MessageCircle className="w-6 h-6 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Share to WhatsApp Status & Groups</h4>
              <p className="text-xs text-slate-300">
                Launch a pre-written WhatsApp broadcast inviting fans to stream and buy your tracks.
              </p>
              <button
                onClick={handleShareToWhatsApp}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Launch WhatsApp Share</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 space-y-3">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              <h4 className="text-sm font-bold text-white">Live Public Artist Profile</h4>
              <p className="text-xs text-slate-300">
                Preview how fans experience your discography, bio, and direct tipping modal.
              </p>
              <button
                onClick={() => onNavigateArtistProfile(artistProfile.id)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Public Profile</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PAYOUT SETTINGS */}
      {activeTab === 'payouts' && (
        <div className="max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white font-['Syne',sans-serif]">
              Mobile Money Payout Account
            </h3>
            <p className="text-xs text-slate-400">
              Update where your 70% share from song sales and fan support is sent.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Current Payout Method:</span>
              <span className="font-bold text-white">{artistProfile.payoutDetails?.accountType || 'AIRTEL_MONEY'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Phone / Account Number:</span>
              <span className="font-bold text-emerald-400">{artistProfile.payoutDetails?.accountNumber || artistProfile.phone}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Registered Name:</span>
              <span className="font-bold text-white">{artistProfile.payoutDetails?.accountName || artistProfile.artistName}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Instant Payout Scheduling</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Admin processes accumulated balances every Friday via direct Airtel Money and TNM Mpamba transfers.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
