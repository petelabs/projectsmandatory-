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
  Bell,
  ShieldCheck,
  Check,
  X,
  Radio,
  FileCheck,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useArtist } from '../../context/ArtistContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { ArtistSongSubmission, ArtistNotification, Song } from '../../types';
import { ArtistRoyaltiesTab } from '../../components/artist/ArtistRoyaltiesTab';
import { ArtistProUpgradeModal } from '../../components/artist/ArtistProUpgradeModal';
import { PromotionCampaignManager } from '../../components/artist/PromotionCampaignManager';
import { ArtistFanMembershipManager } from '../../components/artist/ArtistFanMembershipManager';
import { ArtistTipsTab } from '../../components/artist/ArtistTipsTab';
import { ArtistMerchManager } from '../../components/artist/ArtistMerchManager';
import { ArtistEventManager } from '../../components/artist/ArtistEventManager';
import { api } from '../../lib/api';

interface ArtistStudioPageProps {
  onNavigateStore: () => void;
  onNavigateArtistProfile: (artistId: string) => void;
}

type TabType = 'overview' | 'campaigns' | 'memberships' | 'merch_events' | 'royalties' | 'upload' | 'catalog' | 'boost' | 'promotion' | 'tips' | 'payouts';


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
  const { user, isAuthenticated, loginWithGoogle, switchRole } = useAuth();
  const {
    artistProfile,
    isArtist,
    isLoading,
    submissions,
    tips,
    payouts,
    boostReferrals,
    registerArtistProfile,
    updateArtistProfile,
    submitSongUpload,
    requestVerification,
    markNotificationAsRead,
    createSongBoostLink,
  } = useArtist();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Artist Pro State
  const [isArtistPro, setIsArtistPro] = useState(false);
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);
  const [proExpiresAt, setProExpiresAt] = useState<string | undefined>(undefined);
  const [songsList, setSongsList] = useState<Song[]>([]);

  // Verification Form State
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifSocials, setVerifSocials] = useState('');
  const [verifPortfolio, setVerifPortfolio] = useState('');
  const [verifNotes, setVerifNotes] = useState('');
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  // Notification center
  const [showNotifications, setShowNotifications] = useState(false);

  // Boost tab state
  const [selectedBoostSongId, setSelectedBoostSongId] = useState<string>('');

  // Fetch Artist Pro status and songs
  React.useEffect(() => {
    if (artistProfile?.id) {
      api.getArtistProStatus(artistProfile.id).then((res) => {
        if (res.success) {
          setIsArtistPro(!!res.isPro);
          setProExpiresAt(res.expiresAt);
        }
      });
      api.getSongs().then((songs) => {
        if (Array.isArray(songs)) {
          setSongsList(songs);
        }
      });
    }
  }, [artistProfile?.id]);

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
        bio: regBio.trim() || `Independent artist on Projects Mandatory.`,
        genres: regGenres,
        payoutDetails: {
          accountType: regPayoutType,
          accountNumber: regPayoutNumber.trim(),
          accountName: regPayoutName.trim() || regStageName.trim(),
        },
      });
      // Switch active role to artist
      switchRole('artist');
      setActiveTab('promotion');
      showToast('Welcome to Projects Mandatory! View our detailed promotion blueprint below.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      showToast(msg, 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  // Submit Verification Request
  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistProfile) return;

    setIsSubmittingVerification(true);
    try {
      await requestVerification({
        requestedAt: new Date().toISOString(),
        socialLinks: verifSocials.trim(),
        portfolioCatalogUrl: verifPortfolio.trim(),
        notes: verifNotes.trim(),
      });
      setShowVerificationModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification request failed';
      showToast(msg, 'error');
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const isVerified = artistProfile?.verificationStatus === 'VERIFIED' || artistProfile?.isVerified === true;

  // Submit Track Upload (Direct or Review)
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
    setUploadProgressText(isVerified ? 'Uploading and publishing track directly to live store...' : 'Preparing master audio file for admin review...');

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
        publishDirectly: isVerified,
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
      const msg = err instanceof Error ? err.message : 'Song upload failed';
      showToast(msg, 'error');
    } finally {
      setIsSubmittingUpload(false);
      setUploadProgressPercent(0);
    }
  };

  // Copy general artist share link
  const handleCopyInviteLink = () => {
    const profileUrl = createSongBoostLink();
    navigator.clipboard.writeText(profileUrl);
    showToast('Artist invite link copied to clipboard!', 'success');
  };

  // Copy song boost link
  const handleCopySongBoostLink = (songId?: string) => {
    const link = createSongBoostLink(songId || selectedBoostSongId || undefined);
    navigator.clipboard.writeText(link);
    showToast('Unique Share & Boost referral link copied!', 'success');
  };

  // Share to WhatsApp
  const handleShareToWhatsApp = (songId?: string, songTitle?: string) => {
    const link = createSongBoostLink(songId || selectedBoostSongId || undefined);
    const titleText = songTitle ? `"${songTitle}"` : 'my official studio tracks';
    const text = `🔥 Support African music! Listen to ${titleText} by ${artistProfile?.artistName} on Projects Mandatory. Buy uncompressed master recordings directly with Airtel Money / TNM Mpamba: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Share to Facebook
  const handleShareToFacebook = (songId?: string) => {
    const link = createSongBoostLink(songId || selectedBoostSongId || undefined);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
  };

  // Share to Twitter/X
  const handleShareToTwitter = (songId?: string, songTitle?: string) => {
    const link = createSongBoostLink(songId || selectedBoostSongId || undefined);
    const text = `Listen and support my new release on Projects Mandatory!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`, '_blank');
  };

  // 1. IF NOT LOGGED IN
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600 via-indigo-600 to-blue-600 p-0.5 mx-auto shadow-xl shadow-rose-950/60">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-rose-500" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-xs font-bold text-rose-300 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Projects Mandatory Artist Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Syne',sans-serif]">
            Monetize & Share Your Music Across Africa
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Create an artist account with Google, request verification, publish master recordings directly, and keep <strong className="text-emerald-400">70% of all earnings</strong>.
          </p>
        </div>

        {/* Value Proposition Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left pt-2">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">70% Direct Payout</h4>
            <p className="text-xs text-slate-400">Set prices up to MK 5,000 and receive payouts straight to your Airtel Money or Mpamba.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <Share2 className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Share & Boost</h4>
            <p className="text-xs text-slate-400">Generate unique track referral links and track real-time fan invite clicks & sales.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <Zap className="w-5 h-5 text-indigo-400" />
            <h4 className="text-sm font-bold text-white">Direct Publishing</h4>
            <p className="text-xs text-slate-400">Verified artists post songs directly without review waiting times.</p>
          </div>
        </div>

        <div className="pt-4 max-w-md mx-auto space-y-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-rose-600 hover:bg-rose-500 font-bold shadow-xl shadow-rose-950/60"
            onClick={loginWithGoogle}
          >
            <User className="w-5 h-5" />
            <span>Sign In with Google to Join as Artist</span>
          </Button>
          <p className="text-xs text-slate-500">
            One account allows you to switch between Fan Mode and Artist Mode anytime.
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
            Welcome, <strong>{user?.name}</strong> ({user?.email}). Fill in your stage name and payout details to activate your creator account.
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
              placeholder="e.g. Blantyre Boy, DJ Spark, Jay Vibes"
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
              Artist Bio / Musical Journey
            </label>
            <textarea
              rows={2}
              placeholder="Tell listeners and fans about your sonic style..."
              value={regBio}
              onChange={(e) => setRegBio(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Genres */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Musical Genres
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {GENRE_OPTIONS.map((g) => {
                const isSelected = regGenres.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => {
                      if (isSelected) {
                        setRegGenres(regGenres.filter((item) => item !== g));
                      } else {
                        setRegGenres([...regGenres, g]);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      isSelected
                        ? 'bg-rose-600 text-white font-bold'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payout Details */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Direct Earnings Payout Wallet (70% Payouts)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Earnings are sent straight to your mobile wallet. You keep 70% of every track sold and tip received.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'AIRTEL_MONEY', label: 'Airtel Money' },
                { id: 'TNM_MPAMBA', label: 'TNM Mpamba' },
                { id: 'BANK', label: 'Bank Account' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setRegPayoutType(m.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition ${
                    regPayoutType === m.id
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/60'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Account / Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="099... / 088..."
                  value={regPayoutNumber}
                  onChange={(e) => setRegPayoutNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Registered Name on SIM *
                </label>
                <input
                  type="text"
                  placeholder="Full name on mobile money"
                  value={regPayoutName}
                  onChange={(e) => setRegPayoutName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>
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

  // Referral stats
  const referralClicks = artistProfile.referralStats?.totalReferralClicks || boostReferrals.length || 0;
  const referralPurchases = artistProfile.referralStats?.totalReferralPurchases || boostReferrals.filter(b => b.convertedToPurchase).length || 0;
  const referralRevenue = artistProfile.referralStats?.totalReferralRevenueMWK || 0;
  const conversionRate = referralClicks > 0 ? ((referralPurchases / referralClicks) * 100).toFixed(1) : '0';

  // Notifications
  const notifications: ArtistNotification[] = artistProfile.notifications || [];
  const unreadNotifCount = notifications.filter(n => !n.read).length;

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
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Syne',sans-serif]">
                  {artistProfile.artistName}
                </h1>
                
                {/* Verification Badge */}
                {isVerified ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Creator</span>
                  </span>
                ) : artistProfile.verificationStatus === 'PENDING_VERIFICATION' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Verification Under Review</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    Unverified Artist
                  </span>
                )}

                {/* Artist Pro Badge */}
                {isArtistPro ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Artist Pro</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setShowProUpgradeModal(true)}
                    className="px-2.5 py-0.5 rounded-full bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Upgrade to Pro</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {artistProfile.genres?.join(' • ') || 'Afro-fusion'} • Projects Mandatory Studio
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Upgrade to Pro Button if not pro */}
            {!isArtistPro && (
              <button
                onClick={() => setShowProUpgradeModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-950/40 transition flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Go Artist Pro</span>
              </button>
            )}
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="Artist Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-xs font-bold text-white">Notifications ({notifications.length})</span>
                    </div>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        No notifications yet. You will be notified here when admin reviews verification or tracks!
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 rounded-xl border text-xs space-y-1 transition ${
                            !notif.read
                              ? 'bg-rose-950/30 border-rose-800/50'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{notif.title}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">
                            {notif.message}
                          </p>
                          {!notif.read && (
                            <button
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="text-[10px] text-rose-400 hover:underline font-semibold block pt-1"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Public profile button */}
            <button
              onClick={() => onNavigateArtistProfile(artistProfile.id)}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Storefront</span>
            </button>

            {/* Share to WhatsApp */}
            <button
              onClick={() => handleShareToWhatsApp()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-950/50 transition flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Invite Followers</span>
            </button>
          </div>
        </div>

        {/* Verification Status Banner / Action */}
        {!isVerified && (
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            {artistProfile.verificationStatus === 'PENDING_VERIFICATION' ? (
              <div className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-800/70 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-200">
                    <strong>Verification Under Review:</strong> Your request has been forwarded to the Admin Dashboard. Once approved, you will receive an in-app notification and direct live posting will be unlocked!
                  </p>
                </div>
              </div>
            ) : artistProfile.verificationStatus === 'REJECTED' ? (
              <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <p className="text-xs text-rose-200">
                    <strong>Verification Feedback:</strong> {artistProfile.verificationFeedback || 'Please update your social links or catalog proof to re-apply.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowVerificationModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition shrink-0"
                >
                  Re-Apply for Verification
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                  <p className="text-xs text-indigo-200">
                    <strong>Unlock Direct Publishing:</strong> Request artist verification to post tracks directly to the live store without waiting for admin review, and unlock full audience analytics!
                  </p>
                </div>
                <button
                  onClick={() => setShowVerificationModal(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 shrink-0"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Request Verification</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Revenue Model Callout */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
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

      {/* Verification Request Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white font-['Syne',sans-serif]">
                  Request Artist Verification
                </h3>
              </div>
              <button
                onClick={() => setShowVerificationModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Verified artists unlock direct song publishing privileges, custom Share & Boost links, and official verified badges on the storefront.
            </p>

            <form onSubmit={handleSubmitVerification} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Social Media Handles / Links *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Instagram, TikTok, Facebook, or Twitter link"
                  value={verifSocials}
                  onChange={(e) => setVerifSocials(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Music Portfolio / Prior Catalog Link
                </label>
                <input
                  type="url"
                  placeholder="Audiomack, YouTube, Spotify, or Soundcloud URL"
                  value={verifPortfolio}
                  onChange={(e) => setVerifPortfolio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Experience / Catalog Summary Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly state your music background, studio experience, or upcoming releases..."
                  value={verifNotes}
                  onChange={(e) => setVerifNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmittingVerification}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs"
                >
                  Submit to Admin Dashboard
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            <span className="text-xs font-semibold">Share & Boost Clicks</span>
            <Share2 className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-['Syne',sans-serif]">
            {referralClicks}
          </div>
          <p className="text-[11px] text-rose-400">{referralPurchases} track sales converted</p>
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
          { id: 'campaigns', label: 'Campaigns & Wallet', icon: Zap, highlight: true },
          { id: 'memberships', label: 'VIP Fan Club', icon: User, highlight: true },
          { id: 'merch_events', label: 'Merch & Events', icon: Sparkles },
          { id: 'tips', label: `Fan Support & Tips (${tips.length})`, icon: Heart },
          { id: 'royalties', label: 'Royalty Pool & Statements', icon: DollarSign },
          { id: 'upload', label: isVerified ? 'Publish Track (Direct)' : 'Upload Track', icon: Upload },
          { id: 'boost', label: 'Share & Boost', icon: Share2 },
          { id: 'catalog', label: `My Music (${submissions.length})`, icon: Disc },
          { id: 'promotion', label: 'Promotion Blueprint', icon: Sparkles },
          { id: 'payouts', label: 'Payout Settings', icon: Smartphone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                  : tab.highlight
                  ? 'text-amber-300 bg-amber-950/40 border border-amber-800/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================
          TAB: PROMOTION CAMPAIGNS & WALLET
          =================================================== */}
      {activeTab === 'campaigns' && (
        <PromotionCampaignManager
          artistId={artistProfile.id || user?.id || 'artist-current'}
          artistName={artistProfile.artistName || 'Artist'}
          availableSongs={songsList}
        />
      )}

      {/* ===================================================
          TAB: ARTIST VIP FAN MEMBERSHIPS
          =================================================== */}
      {activeTab === 'memberships' && (
        <ArtistFanMembershipManager
          artistId={artistProfile.id || user?.id || 'artist-current'}
          artistName={artistProfile.artistName || 'Artist'}
        />
      )}

      {/* ===================================================
          TAB: MERCH & EVENTS
          =================================================== */}
      {activeTab === 'merch_events' && (
        <div className="space-y-8">
          <ArtistMerchManager
            artistId={artistProfile.id || user?.id || 'artist-current'}
            artistName={artistProfile.artistName || 'Artist'}
          />
          <ArtistEventManager
            artistId={artistProfile.id || user?.id || 'artist-current'}
            artistName={artistProfile.artistName || 'Artist'}
          />
        </div>
      )}

      {/* ===================================================
          TAB: ROYALTY POOL & IMMUTABLE STATEMENTS
          =================================================== */}
      {activeTab === 'royalties' && (
        <ArtistRoyaltiesTab
          artistId={artistProfile.id || user?.id || 'artist-current'}
          artistName={artistProfile.artistName || (artistProfile as any).stageName || user?.name || 'Artist'}
        />
      )}

      {/* ===================================================
          TAB 1: OVERVIEW & RECENT STATS
          =================================================== */}
      {activeTab === 'overview' && (

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Actions Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white font-['Syne',sans-serif]">
                Quick Studio Actions
              </h3>
              <div className="space-y-2.5">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-rose-950/40 transition"
                >
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>{isVerified ? 'Publish New Track Directly' : 'Upload Track for Review'}</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveTab('boost')}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 font-bold text-xs flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-amber-400" />
                    <span>Generate Share & Boost Link</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveTab('promotion')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-xs flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Read Promotion Blueprint</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Share & Boost Metric Spotlight */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-800/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white font-['Syne',sans-serif]">
                    Share & Boost Engine
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded-full uppercase">
                  Viral Engine
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Referral Clicks</span>
                  <span className="text-lg font-black text-white">{referralClicks}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Converted Sales</span>
                  <span className="text-lg font-black text-emerald-400">{referralPurchases}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('boost')}
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition"
              >
                Open Share & Boost Hub
              </button>
            </div>

            {/* Direct Fan Support Spotlight */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                    <Heart className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white font-['Syne',sans-serif]">
                    Direct Fan Backing
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  MK {totalTipsMWK.toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Fans can back your studio journey with voluntary tips and contributions via Airtel Money & TNM Mpamba.
              </p>

              <button
                onClick={() => setActiveTab('tips')}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                View Fan Support ({tips.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          TAB 2: UPLOAD SONG (DIRECT POST OR REVIEW)
          =================================================== */}
      {activeTab === 'upload' && (
        <div className="max-w-2xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isVerified
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-950 text-amber-400 border border-amber-500/40'
              }`}>
                {isVerified ? '🚀 Direct Store Publishing' : 'Standard Upload (Admin Review)'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white font-['Syne',sans-serif]">
              {isVerified ? 'Publish Track Directly To Store' : 'Submit Song For Store Review'}
            </h3>
            <p className="text-xs text-slate-400">
              {isVerified
                ? 'As a verified artist, your track will be published immediately to the live music store!'
                : 'Upload your studio track. Once submitted, our admin team reviews your file before publication.'}
            </p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* Song Title & Featured */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Song Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kuche Kuche"
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
                  placeholder="e.g. feat. Jay Vibes"
                  value={uploadFeatured}
                  onChange={(e) => setUploadFeatured(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Genre & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Genre *
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Track Price (MWK) *
                  </label>
                  <span className="text-[10px] text-amber-400 font-mono">Max K5,000</span>
                </div>
                <input
                  type="number"
                  required
                  min={0}
                  max={5000}
                  step={100}
                  value={uploadPrice}
                  onChange={(e) => setUploadPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Real-time 70/30 split calculator */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Your 70% Share:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  MK {calculatedPriceArtistShare.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Platform 30% Share:</span>
                <span className="text-slate-300 font-bold text-sm">
                  MK {calculatedPricePlatformShare.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Release Story / Description
              </label>
              <textarea
                rows={2}
                placeholder="Give fans context about this record..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Audio Master Upload */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Master Audio Recording File (MP3 / WAV) *
              </label>
              <input
                type="file"
                required
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-600 file:text-white hover:file:bg-rose-500 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Deliver the highest quality uncompressed studio master available (up to 320kbps).
              </span>
            </div>

            {/* Cover Art Upload */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Cover Artwork (Square, JPG / PNG)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800"
              />
              {coverPreview && (
                <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-slate-700">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Progress indicator */}
            {isSubmittingUpload && (
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>{uploadProgressText}</span>
                  <span className="font-mono">{uploadProgressPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-rose-600 h-2 rounded-full transition-all duration-300"
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
              className={`w-full font-bold text-xs uppercase tracking-wider py-3.5 shadow-lg ${
                isVerified
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
              }`}
            >
              {isVerified ? 'Publish Song Directly to Live Store' : 'Submit Song For Review'}
            </Button>
          </form>
        </div>
      )}

      {/* ===================================================
          TAB 3: SHARE & BOOST ENGINE
          =================================================== */}
      {activeTab === 'boost' && (
        <div className="max-w-3xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <Share2 className="w-3.5 h-3.5" />
              <span>Share & Boost Referral Engine</span>
            </div>
            <h3 className="text-xl font-bold text-white font-['Syne',sans-serif]">
              Generate Unique Track Referral Links & Track Reach
            </h3>
            <p className="text-xs text-slate-400">
              Invite your followers to stream and buy your tracks. Every click, visit, and purchase through your link is logged in real-time.
            </p>
          </div>

          {/* Real-time referral analytics bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase">Invite Clicks</span>
              <span className="text-2xl font-black text-white">{referralClicks}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase">Song Purchases</span>
              <span className="text-2xl font-black text-emerald-400">{referralPurchases}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase">Boost Revenue</span>
              <span className="text-xl font-black text-white font-mono">MK {referralRevenue.toLocaleString()}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 block uppercase">Conversion Rate</span>
              <span className="text-2xl font-black text-amber-400">{conversionRate}%</span>
            </div>
          </div>

          {/* Link Generator Tool */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Select Track To Generate Boost Link
            </h4>

            <div className="space-y-2">
              <select
                value={selectedBoostSongId}
                onChange={(e) => setSelectedBoostSongId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="">General Artist Profile & Discography Link</option>
                {submissions
                  .filter((s) => s.status === 'APPROVED')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      Track: {s.title} (MK {s.priceMWK.toLocaleString()})
                    </option>
                  ))}
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createSongBoostLink(selectedBoostSongId || undefined)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono focus:outline-none"
                />
                <button
                  onClick={() => handleCopySongBoostLink()}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-lg shadow-rose-950/40"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleShareToWhatsApp(selectedBoostSongId || undefined)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share to WhatsApp</span>
              </button>

              <button
                onClick={() => handleShareToFacebook(selectedBoostSongId || undefined)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <span>Facebook</span>
              </button>

              <button
                onClick={() => handleShareToTwitter(selectedBoostSongId || undefined)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <span>X / Twitter</span>
              </button>
            </div>
          </div>

          {/* Strategic Scalability Playbook */}
          <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-800/50 space-y-2 text-xs text-slate-300">
            <h5 className="font-bold text-amber-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>How To Boost App Scalability & Your Sales</span>
            </h5>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li>Add your unique Share & Boost link to your <strong>Instagram & TikTok bio</strong>.</li>
              <li>Post teaser clips on your <strong>WhatsApp Status</strong> with a &quot;Swipe up / click link to download master&quot;.</li>
              <li>Every fan who visits via your link is tracked to your artist account for 30 days.</li>
              <li>You receive 70% direct payouts to your Airtel Money or Mpamba number every Friday.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ===================================================
          TAB 4: MY MUSIC CATALOG
          =================================================== */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white font-['Syne',sans-serif]">
              My Uploaded Tracks & Submissions ({submissions.length})
            </h3>
            <button
              onClick={() => setActiveTab('upload')}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Track</span>
            </button>
          </div>

          {submissions.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <Disc className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No tracks uploaded yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Start uploading your audio masters to begin selling tracks to listeners in Malawi and worldwide.
              </p>
              <button
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Upload First Track
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                        {sub.coverArtUrl ? (
                          <img src={sub.coverArtUrl} alt={sub.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Disc className="w-6 h-6" />
                          </div>
                        )}
                        {sub.audioFilePath && (
                          <button
                            onClick={() => handleTogglePlay(sub)}
                            className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition"
                          >
                            {playingSubmissionId === sub.id ? (
                              <Pause className="w-5 h-5 text-rose-400" />
                            ) : (
                              <Play className="w-5 h-5 text-white" />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">{sub.title}</h4>
                        <p className="text-xs text-slate-400 truncate">{sub.genre}</p>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          MK {sub.priceMWK.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                      <span className="text-slate-500">
                        Uploaded: {new Date(sub.submittedAt).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                        sub.status === 'APPROVED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                          : sub.status === 'REJECTED'
                          ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/40'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>

                  {sub.status === 'APPROVED' && (
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleCopySongBoostLink(sub.id)}
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Copy Boost Link</span>
                      </button>

                      <button
                        onClick={() => handleShareToWhatsApp(sub.id, sub.title)}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================
          TAB 5: MUSIC PROMOTION BLUEPRINT (DETAILED)
          =================================================== */}
      {activeTab === 'promotion' && (
        <div className="max-w-3xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 space-y-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-xs font-bold text-rose-300 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Creator Onboarding & Blueprint</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Syne',sans-serif]">
              The Projects Mandatory Music Promotion Blueprint
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Congratulations on creating your artist account! Here is how our music promotion, verification, and monetization engine works step-by-step.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-rose-600/20 flex items-center justify-center text-xs">1</span>
                <span>Request Verification From Admin</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-8">
                Click &quot;Request Verification&quot; at the top of your dashboard. Provide your social handles and prior music catalog links. The Projects Mandatory administrative team reviews your verification request right from their secure dashboard.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-amber-600/20 flex items-center justify-center text-xs">2</span>
                <span>Unlock Direct Live Publishing</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-8">
                Once verified, you receive an instant in-app notification on your dashboard. You immediately unlock direct publishing privileges: whenever you upload a track, it is published live to the store instantly without waiting for review!
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs">3</span>
                <span>Set Prices Up To K5,000 & Keep 70%</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-8">
                Set whatever price you desire for your single, up to the K5,000 platform ceiling. You keep 70% of every sale, paid out directly to Airtel Money or TNM Mpamba.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <span className="w-6 h-6 rounded-full bg-emerald-600/20 flex items-center justify-center text-xs">4</span>
                <span>Viral Share & Boost Referral Links</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-8">
                Generate tracked boost links for each song. Share to WhatsApp, TikTok, Facebook, and Instagram. Track clicks, plays, conversions, and revenue in your analytics dashboard in real time.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {!isVerified && (
              <button
                onClick={() => setShowVerificationModal(true)}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-950/40"
              >
                Request Verification Now
              </button>
            )}
            <button
              onClick={() => setActiveTab('upload')}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/40"
            >
              Upload Song
            </button>
          </div>
        </div>
      )}

      {/* ===================================================
          TAB 6: FAN SUPPORT / TIPS
          =================================================== */}
      {activeTab === 'tips' && (
        <ArtistTipsTab
          artistId={artistProfile.id || user?.id || 'artist-current'}
          artistName={artistProfile.artistName || 'Artist'}
        />
      )}

      {/* ===================================================
          TAB 7: PAYOUT SETTINGS
          =================================================== */}
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
              Accumulated balances are disbursed via direct Airtel Money and TNM Mpamba transfers every Friday.
            </p>
          </div>
        </div>
      )}

      {/* Artist Pro Upgrade Modal */}
      {showProUpgradeModal && (
        <ArtistProUpgradeModal
          artistId={artistProfile.id || user?.id || 'artist-current'}
          artistName={artistProfile.artistName || 'Artist'}
          isOpen={showProUpgradeModal}
          onClose={() => setShowProUpgradeModal(false)}
          onSuccess={() => {
            setIsArtistPro(true);
            showToast('Welcome to Artist Pro! Premium features and advanced analytics unlocked.', 'success');
          }}
        />
      )}

    </div>
  );
};
