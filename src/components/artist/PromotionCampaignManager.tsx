import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Play,
  Pause,
  XCircle,
  Eye,
  MousePointer,
  Music2,
  Bookmark,
  UserPlus,
  Wallet,
  ArrowUpRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  PromotionCampaign,
  PromotionTransaction,
  PromotionWallet,
  PromotionPlacement,
  Song,
  PaymentMethod,
} from '../../types';

interface PromotionCampaignManagerProps {
  artistId: string;
  artistName: string;
  userId: string;
  songs: Song[];
  isArtistPro?: boolean;
}

const PLACEMENT_OPTIONS: Array<{ id: PromotionPlacement; label: string; desc: string }> = [
  { id: 'HOME_FEATURED', label: 'Home Page Hero Section', desc: 'Prominent spotlight on the mobile home feed' },
  { id: 'TRENDING_DISCOVERY', label: 'Trending Discovery Section', desc: 'Top placement in trending playlists & mixes' },
  { id: 'SEARCH_DISCOVERY', label: 'Search & Explore Area', desc: 'Suggested search banner and genre badges' },
  { id: 'GENRE_PAGES', label: 'Genre Hub Spotlights', desc: 'Pinned to the top of your genre category' },
  { id: 'RECOMMENDED', label: 'Recommended Next Track', desc: 'Queued automatically after related artist songs' },
];

export const PromotionCampaignManager: React.FC<PromotionCampaignManagerProps> = ({
  artistId,
  artistName,
  userId,
  songs,
  isArtistPro = false,
}) => {
  const [wallet, setWallet] = useState<PromotionWallet | null>(null);
  const [campaigns, setCampaigns] = useState<PromotionCampaign[]>([]);
  const [transactions, setTransactions] = useState<PromotionTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Top-Up Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(10000);
  const [topUpPaymentMethod, setTopUpPaymentMethod] = useState<PaymentMethod>('AIRTEL_MONEY');
  const [isTopUpSubmitting, setIsTopUpSubmitting] = useState(false);

  // Create Campaign Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<string>(songs[0]?.id || '');
  const [selectedPlacement, setSelectedPlacement] = useState<PromotionPlacement>('HOME_FEATURED');
  const [budgetMWK, setBudgetMWK] = useState<number>(15000);
  const [durationDays, setDurationDays] = useState<number>(14);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [artistId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [walletRes, campRes] = await Promise.all([
        api.getPromotionWallet(artistId),
        api.getArtistCampaigns(artistId),
      ]);

      if (walletRes.success && walletRes.wallet) setWallet(walletRes.wallet);
      if (campRes.success) {
        setCampaigns(campRes.campaigns || []);
        setTransactions(campRes.transactions || []);
      }
    } catch {
      console.error('Failed to load promotion data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topUpAmount < 1000) {
      setErrorMsg('Minimum wallet top-up is MK 1,000.');
      return;
    }

    setIsTopUpSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.topUpPromotionWallet({
        artistId,
        artistName,
        amountMWK: topUpAmount,
        paymentMethod: topUpPaymentMethod,
      });

      if (res.success && res.wallet) {
        setWallet(res.wallet);
        setIsTopUpOpen(false);
        setSuccessMsg(`Wallet topped up successfully with MK ${topUpAmount.toLocaleString()}.`);
        loadData();
      } else {
        setErrorMsg(res.error || 'Top-up failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment initiation failed.');
    } finally {
      setIsTopUpSubmitting(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const song = songs.find((s) => s.id === selectedSongId);
    if (!song) {
      setErrorMsg('Please select a valid song to promote.');
      return;
    }

    if (!wallet || wallet.availableBalanceMWK < budgetMWK) {
      setErrorMsg('Insufficient promotional balance. Please top up your wallet first.');
      return;
    }

    setIsCreateSubmitting(true);
    setErrorMsg(null);

    try {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + durationDays * 86400000).toISOString();

      const res = await api.createPromotionCampaign({
        artistId,
        artistName,
        userId,
        songId: song.id,
        songTitle: song.title,
        songCover: song.coverImage,
        targetPlacement: selectedPlacement,
        budgetMWK,
        startDate,
        endDate,
      });

      if (res.success && res.campaign) {
        setCampaigns((prev) => [res.campaign, ...prev]);
        if (res.wallet) setWallet(res.wallet);
        setIsCreateOpen(false);
        setSuccessMsg(`Campaign "${song.title}" created and activated!`);
        loadData();
      } else {
        setErrorMsg(res.error || 'Failed to create campaign.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Campaign creation failed.');
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  const handleTogglePause = async (campaignId: string) => {
    try {
      const res = await api.togglePauseCampaign(campaignId);
      if (res.success && res.campaign) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? { ...c, status: res.campaign.status } : c))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to cancel this campaign? Any remaining unspent budget will be refunded to your promotion wallet.')) {
      return;
    }

    try {
      const res = await api.cancelCampaign(campaignId);
      if (res.success && res.campaign) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? { ...c, status: 'CANCELLED', remainingBudgetMWK: 0 } : c))
        );
        if (res.wallet) setWallet(res.wallet);
        setSuccessMsg(res.message || 'Campaign cancelled and funds refunded.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notices */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Promotional Wallet Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-blue-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Wallet className="w-4 h-4" />
              <span>Promotion Wallet</span>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              MK {(wallet?.availableBalanceMWK || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400">
              Reserved in Active Campaigns:{' '}
              <strong className="text-slate-200">MK {(wallet?.reservedBudgetMWK || 0).toLocaleString()}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsTopUpOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-950/50 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Top Up Balance</span>
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-950/50 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>New Campaign</span>
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white">Active & Past Campaigns</h3>
            <p className="text-xs text-slate-400">
              Real-time impressions, plays, and reach with clear sponsored tagging
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">{campaigns.length} Total</span>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't launched any promotion campaigns yet. Promote your tracks to the Home Spotlight and Trending playlists to reach new listeners.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
            >
              Create Your First Campaign
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((camp) => {
              const spentPercent = Math.min(100, Math.round((camp.spentMWK / camp.budgetMWK) * 100));
              const isCampaignActive = camp.status === 'ACTIVE';

              return (
                <div
                  key={camp.id}
                  className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={camp.songCover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200'}
                        alt={camp.songTitle || 'Campaign Track'}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-800 shrink-0"
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm truncate">{camp.songTitle || 'Campaign'}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                              camp.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : camp.status === 'PAUSED'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {camp.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-blue-400 font-semibold block mt-0.5">
                          {camp.targetPlacement.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {camp.status !== 'COMPLETED' && camp.status !== 'CANCELLED' && (
                        <>
                          <button
                            onClick={() => handleTogglePause(camp.id)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title={camp.status === 'ACTIVE' ? 'Pause Campaign' : 'Resume Campaign'}
                          >
                            {camp.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleCancelCampaign(camp.id)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 transition-colors"
                            title="Cancel & Refund Remaining"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Real-time Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80">
                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider">
                        <Eye className="w-3 h-3 text-blue-400" />
                        <span>Impressions</span>
                      </div>
                      <div className="text-sm font-black text-white font-mono mt-0.5">
                        {camp.impressions.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider">
                        <Music2 className="w-3 h-3 text-emerald-400" />
                        <span>Plays</span>
                      </div>
                      <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                        {camp.playsGenerated.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider">
                        <MousePointer className="w-3 h-3 text-amber-400" />
                        <span>Clicks</span>
                      </div>
                      <div className="text-sm font-black text-white font-mono mt-0.5">
                        {camp.clicks.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider">
                        <Bookmark className="w-3 h-3 text-purple-400" />
                        <span>Saves</span>
                      </div>
                      <div className="text-sm font-black text-white font-mono mt-0.5">
                        {camp.saves.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider">
                        <UserPlus className="w-3 h-3 text-pink-400" />
                        <span>Follows</span>
                      </div>
                      <div className="text-sm font-black text-white font-mono mt-0.5">
                        {camp.followsGenerated.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Budget Spent Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        Spent: <strong className="text-white font-mono">MK {camp.spentMWK.toLocaleString()}</strong> of MK {camp.budgetMWK.toLocaleString()}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{spentPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-amber-500 transition-all duration-500"
                        style={{ width: `${spentPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Up Wallet Modal */}
      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-blue-500/30 p-6 sm:p-8 shadow-2xl text-left">
            <button
              onClick={() => setIsTopUpOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-1">Top Up Promotion Wallet</h3>
            <p className="text-xs text-slate-400 mb-5">
              Add prepaid advertising funds via Airtel Money or TNM Mpamba
            </p>

            <form onSubmit={handleTopUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Preset Amount (MWK)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5000, 10000, 25000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      className={`py-2 px-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                        topUpAmount === amt
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      MK {amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Mobile Payment Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'AIRTEL_MONEY', name: 'Airtel Money' },
                    { id: 'TNM_MPAMBA', name: 'TNM Mpamba' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTopUpPaymentMethod(m.id as PaymentMethod)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        topUpPaymentMethod === m.id
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isTopUpSubmitting}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isTopUpSubmitting ? 'Processing...' : `Confirm Top-Up • MK ${topUpAmount.toLocaleString()}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/30 p-6 sm:p-8 shadow-2xl text-left overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-1">Create Promotion Campaign</h3>
            <p className="text-xs text-slate-400 mb-5">
              Target sponsored placements across Projects Mandatory
            </p>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              {/* Select Song */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Track to Promote
                </label>
                <select
                  value={selectedSongId}
                  onChange={(e) => setSelectedSongId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                >
                  {songs.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.title} ({song.genre})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Placement */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Target Placement Area
                </label>
                <div className="space-y-2">
                  {PLACEMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPlacement(opt.id)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all ${
                        selectedPlacement === opt.id
                          ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">{opt.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Slider/Presets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Campaign Budget (MWK)
                  </label>
                  <span className="font-mono font-black text-amber-400 text-sm">
                    MK {budgetMWK.toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[5000, 15000, 30000, 50000].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBudgetMWK(b)}
                      className={`py-2 px-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                        budgetMWK === b
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      MK {b.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Campaign Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDurationDays(d)}
                      className={`py-2 px-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                        durationDays === d
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet Deduction notice */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Available Balance:</span>
                  <span className="font-mono font-bold text-white">
                    MK {(wallet?.availableBalanceMWK || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Budget to Reserve:</span>
                  <span className="font-mono font-bold text-amber-400">
                    MK {budgetMWK.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreateSubmitting || (wallet?.availableBalanceMWK || 0) < budgetMWK}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-950/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {isCreateSubmitting ? 'Launching...' : `Launch Campaign • MK ${budgetMWK.toLocaleString()}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
