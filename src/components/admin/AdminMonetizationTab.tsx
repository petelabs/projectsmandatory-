import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  ShieldAlert,
  Sliders,
  Radio,
  FileCheck,
  Disc3,
  Heart,
  ShoppingBag,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Zap,
  Gift,
  Sparkles,
} from 'lucide-react';
import { AdminMonetizationSummary, SubscriptionPlan, MonetizationSettings, FraudFlag, Phase2AdminSettings } from '../../types';
import { api } from '../../lib/api';

interface AdminMonetizationTabProps {
  token: string;
}

export const AdminMonetizationTab: React.FC<AdminMonetizationTabProps> = ({ token }) => {
  const [summary, setSummary] = useState<AdminMonetizationSummary | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [settings, setSettings] = useState<MonetizationSettings | null>(null);
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form states
  const [creatorPoolPct, setCreatorPoolPct] = useState<number>(60);
  const [minListenSec, setMinListenSec] = useState<number>(30);
  const [minPercent, setMinPercent] = useState<number>(50);
  const [maxRepeats, setMaxRepeats] = useState<number>(5);
  const [adsEnabled, setAdsEnabled] = useState<boolean>(true);
  const [adFrequency, setAdFrequency] = useState<number>(3);

  // Phase 2 Settings states
  const [phase2Settings, setPhase2Settings] = useState<Phase2AdminSettings | null>(null);
  const [artistProPrice, setArtistProPrice] = useState<number>(4500);
  const [tipPlatformFee, setTipPlatformFee] = useState<number>(10);
  const [featuredReleaseFee, setFeaturedReleaseFee] = useState<number>(15000);
  const [minCampaignDaily, setMinCampaignDaily] = useState<number>(1000);
  const [membershipFeePct, setMembershipFeePct] = useState<number>(15);
  const [isSavingPhase2, setIsSavingPhase2] = useState(false);
  const [phase2Status, setPhase2Status] = useState<string | null>(null);

  // Load Admin Monetization Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [monData, flags, p2Settings] = await Promise.all([
        api.admin.getMonetizationSummary(token),
        api.admin.getFraudFlags(token),
        api.getPhase2AdminSettings(),
      ]);

      if (monData?.summary) {
        setSummary(monData.summary);
        setPlans(monData.plans || []);
        if (monData.settings) {
          setSettings(monData.settings);
          setCreatorPoolPct(monData.settings.creatorRoyaltyPoolPercentage);
          setMinListenSec(monData.settings.qualifyingStreamRules.minListeningTimeSec);
          setMinPercent(monData.settings.qualifyingStreamRules.minPercentPlayed);
          setMaxRepeats(monData.settings.qualifyingStreamRules.maxRepeatsPerHour);
          setAdsEnabled(monData.settings.adSettings.enabled);
          setAdFrequency(monData.settings.adSettings.frequencyTracks);
        }
      }
      setFraudFlags(flags || []);

      if (p2Settings?.settings) {
        setPhase2Settings(p2Settings.settings);
        setArtistProPrice(p2Settings.settings.artistProPriceMWK);
        setTipPlatformFee(p2Settings.settings.tipPlatformFeePercent);
        setFeaturedReleaseFee(p2Settings.settings.featuredReleaseFeeMWK);
        setMinCampaignDaily(p2Settings.settings.minCampaignDailyBudgetMWK);
        setMembershipFeePct(p2Settings.settings.fanMembershipPlatformFeePercent);
      }
    } catch (err) {
      console.warn('Admin monetization load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePhase2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPhase2(true);
    setPhase2Status(null);
    try {
      const res = await api.updatePhase2AdminSettings(token, {
        artistProPriceMWK: artistProPrice,
        tipPlatformFeePercent: tipPlatformFee,
        featuredReleaseFeeMWK: featuredReleaseFee,
        minCampaignDailyBudgetMWK: minCampaignDaily,
        fanMembershipPlatformFeePercent: membershipFeePct,
      });
      if (res.success) {
        setPhase2Status('Phase 2 monetization pricing and fees updated successfully.');
      } else {
        setPhase2Status(res.error || 'Failed to update Phase 2 settings.');
      }
    } catch {
      setPhase2Status('Failed to update Phase 2 settings.');
    } finally {
      setIsSavingPhase2(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Save Settings Changes (Revenue Split, Stream Rules, Ad Settings)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const updated = await api.admin.updateMonetizationSettings(token, {
        creatorRoyaltyPoolPercentage: creatorPoolPct,
        platformRevenuePercentage: 100 - creatorPoolPct,
        qualifyingStreamRules: {
          minListeningTimeSec: minListenSec,
          minPercentPlayed: minPercent,
          maxRepeatsPerHour: maxRepeats,
          antiFraudStrictness: 'HIGH',
        },
        adSettings: {
          enabled: adsEnabled,
          frequencyTracks: adFrequency,
          eligiblePlans: ['FREE'],
          audioAdDurationSec: 10,
          activeSponsors: settings?.adSettings.activeSponsors || [],
        },
      });

      setSettings(updated);
      setStatusMessage('Monetisation rules & revenue splits updated successfully.');
      setTimeout(() => setStatusMessage(null), 3000);
      loadData();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message || 'Failed to update settings.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Update Plan Price
  const handleUpdatePlanPrice = async (planId: string, newPriceMWK: number) => {
    try {
      await api.admin.updatePlan(token, planId, { priceMWK: newPriceMWK });
      setStatusMessage(`Plan price updated to MK ${newPriceMWK.toLocaleString()}`);
      setTimeout(() => setStatusMessage(null), 3000);
      loadData();
    } catch (err) {
      console.warn('Update plan price error:', err);
    }
  };

  // Finalize Royalty Period Action
  const handleFinalizePeriod = async () => {
    if (!window.confirm('Are you sure you want to finalize the current monthly period? This will generate permanent, immutable Royalty Statements for all creators and roll over to the next month.')) {
      return;
    }

    try {
      const res = await api.admin.finalizeRoyaltyPeriod(token);
      if (res.success) {
        setStatusMessage(res.message);
        loadData();
      }
    } catch (err: any) {
      alert(`Finalization failed: ${err.message}`);
    }
  };

  // Fraud flag resolve
  const handleResolveFlag = async (flagId: string, status: 'CONFIRMED_FRAUD' | 'DISMISSED') => {
    try {
      await api.admin.updateFraudFlag(token, flagId, status, 'Resolved by Administrator');
      loadData();
    } catch (err) {
      console.warn('Resolve flag error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400 font-mono">Loading revenue summaries and platform ledgers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      
      {/* Top Controls & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
            Financial Management & Accounting
          </span>
          <h2 className="text-2xl font-black text-white">
            Monetisation & Royalty Administration
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time subscriber metrics, creator royalty pool allocation (60/40), qualifying stream validation, and anti-fraud rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleFinalizePeriod}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/60 transition-all flex items-center gap-2"
          >
            <FileCheck className="w-4 h-4" />
            <span>Finalize Month & Lock Statements</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Subscription Revenue */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Subscription Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            MK {(summary?.totalSubscriptionRevenueMWK || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Premium: {summary?.premiumSubscribersCount || 0} • Plus: {summary?.premiumPlusSubscribersCount || 0}
          </p>
        </div>

        {/* Card 2: Creator Pool Allocation (60%) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-rose-500/40">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Creator Pool ({creatorPoolPct}%)</span>
            <Disc3 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            MK {(summary?.creatorRoyaltyPoolMWK || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary?.currentPeriod.totalQualifyingStreams || 0} verified qualifying streams
          </p>
        </div>

        {/* Card 3: Platform Retained Revenue (40%) */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Retained ({100 - creatorPoolPct}%)</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            MK {(summary?.platformRevenueMWK || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Infrastructure, hosting & legal operations
          </p>
        </div>

        {/* Card 4: Purchases & Fan Tips */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tips & Song Sales</span>
            <Heart className="w-4 h-4 text-pink-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            MK {((summary?.individualPurchaseRevenueMWK || 0) + (summary?.tipRevenueMWK || 0)).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tips: MK {(summary?.tipRevenueMWK || 0).toLocaleString()} • Sales: MK {(summary?.individualPurchaseRevenueMWK || 0).toLocaleString()}
          </p>
        </div>

      </div>

      {/* Row: Configurable Settings (Splits, Rules, Ads) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Configurable Revenue Split & Stream Qualification Rules */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-white">
              Revenue Split & Stream Qualification Rules
            </h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* Split Percentage Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <label className="font-bold text-slate-300">Creator Royalty Pool Split</label>
                <span className="font-mono font-bold text-rose-400">{creatorPoolPct}% Creator / {100 - creatorPoolPct}% Platform</span>
              </div>
              <input
                type="range"
                min={40}
                max={90}
                step={5}
                value={creatorPoolPct}
                onChange={(e) => setCreatorPoolPct(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Currently configured: {creatorPoolPct}% allocated to Malawian creators based on verified stream share.
              </p>
            </div>

            {/* Qualifying Stream Rules */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Min Listen Time
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={minListenSec}
                    onChange={(e) => setMinListenSec(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">sec</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Min Percent Played
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={20}
                    max={100}
                    value={minPercent}
                    onChange={(e) => setMinPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Max Repeats / Hr
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxRepeats}
                  onChange={(e) => setMaxRepeats(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Ad Settings */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Free-Tier Audio Ads</span>
                  <span className="text-[11px] text-slate-400">Play sponsor announcements for Free users</span>
                </div>
                <input
                  type="checkbox"
                  checked={adsEnabled}
                  onChange={(e) => setAdsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 bg-slate-800 border-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Ad Frequency (Play Sponsor Cue Every N Tracks)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={adFrequency}
                  onChange={(e) => setAdFrequency(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/40"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Monetisation Configuration'}</span>
            </button>
          </form>
        </div>

        {/* Panel 2: Configurable Subscription Plans Editor */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Radio className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Configurable Subscription Plans
            </h3>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Plan prices and features are stored dynamically in the Firebase backend and can be adjusted without code redeployment.
          </p>

          <div className="space-y-4">
            {plans.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{p.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {p.tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{p.audioQuality}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] font-bold">MK</span>
                    <input
                      type="number"
                      defaultValue={p.priceMWK}
                      disabled={p.tier === 'FREE'}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val !== p.priceMWK) handleUpdatePlanPrice(p.id, val);
                      }}
                      className="w-28 pl-8 pr-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs text-right disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row: Phase 2 Monetization & Creator Commerce Controls */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-bold text-white">
              Phase 2 Monetization & Pricing Controls
            </h3>
            <p className="text-xs text-slate-400">
              Configure dynamic pricing for Artist Pro subscriptions, Direct Fan Tipping fees, Featured Releases, and Campaign Minimums.
            </p>
          </div>
        </div>

        {phase2Status && (
          <div className={`p-3.5 mb-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            phase2Status.includes('success') ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-rose-950 text-rose-400 border border-rose-800/40'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
            <span>{phase2Status}</span>
          </div>
        )}

        <form onSubmit={handleSavePhase2} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Artist Pro Monthly (MWK)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold font-mono">MK</span>
              <input
                type="number"
                min={1000}
                max={50000}
                step={500}
                value={artistProPrice}
                onChange={(e) => setArtistProPrice(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs"
              />
            </div>
            <p className="text-[10px] text-slate-500">Includes advanced analytics & scheduled releases</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Fan Tip Platform Fee (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={30}
                value={tipPlatformFee}
                onChange={(e) => setTipPlatformFee(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">%</span>
            </div>
            <p className="text-[10px] text-slate-500">Artist gets {100 - tipPlatformFee}% directly to mobile wallet</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Featured Release Slot (MWK)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold font-mono">MK</span>
              <input
                type="number"
                min={2000}
                max={100000}
                step={1000}
                value={featuredReleaseFee}
                onChange={(e) => setFeaturedReleaseFee(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs"
              />
            </div>
            <p className="text-[10px] text-slate-500">Guaranteed 7-day billboard placement on Discovery</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Min Campaign Budget / Day (MWK)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold font-mono">MK</span>
              <input
                type="number"
                min={500}
                max={50000}
                step={500}
                value={minCampaignDaily}
                onChange={(e) => setMinCampaignDaily(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs"
              />
            </div>
            <p className="text-[10px] text-slate-500">Minimum spend for audio & visual self-serve ads</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Fan Membership Fee (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min={5}
                max={30}
                value={membershipFeePct}
                onChange={(e) => setMembershipFeePct(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">%</span>
            </div>
            <p className="text-[10px] text-slate-500">Platform operational cut on VIP Fan Memberships</p>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSavingPhase2}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingPhase2 ? 'Saving...' : 'Save Phase 2 Pricing'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Row: Anti-Fraud & Flagged Streams Review */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Anti-Fraud & Artificial Stream Flags
              </h3>
              <p className="text-xs text-slate-400">
                Automated loop detection, bot skipping, and velocity enforcement. Flagged streams are excluded from creator pool allocations.
              </p>
            </div>
          </div>
          <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
            {fraudFlags.length} Flagged Incidents
          </span>
        </div>

        {fraudFlags.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No abnormal streaming activity flagged. All listener streams are passing qualification rules.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Reason / Pattern</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Streams Affected</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {fraudFlags.map((flag) => (
                  <tr key={flag.id}>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {flag.createdAt.split('T')[0]}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {flag.reason}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        flag.severity === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {flag.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {flag.affectedStreamsCount}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-mono text-slate-400">
                        {flag.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {flag.status === 'PENDING_REVIEW' && (
                        <>
                          <button
                            onClick={() => handleResolveFlag(flag.id, 'CONFIRMED_FRAUD')}
                            className="px-2.5 py-1 rounded bg-rose-600/30 text-rose-300 hover:bg-rose-600/50 text-[10px] font-bold uppercase"
                          >
                            Confirm Fraud
                          </button>
                          <button
                            onClick={() => handleResolveFlag(flag.id, 'DISMISSED')}
                            className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px] font-bold uppercase"
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
