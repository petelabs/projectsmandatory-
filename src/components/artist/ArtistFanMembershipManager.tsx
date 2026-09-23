import React, { useState, useEffect } from 'react';
import { Crown, Star, Users, Plus, CheckCircle2, AlertCircle, Sparkles, DollarSign } from 'lucide-react';
import { api } from '../../lib/api';
import { ArtistMembershipPlan, ArtistMembershipSubscription } from '../../types';

interface ArtistFanMembershipManagerProps {
  artistId: string;
  artistName: string;
}

export const ArtistFanMembershipManager: React.FC<ArtistFanMembershipManagerProps> = ({
  artistId,
  artistName,
}) => {
  const [plan, setPlan] = useState<ArtistMembershipPlan | null>(null);
  const [members, setMembers] = useState<ArtistMembershipSubscription[]>([]);
  const [totalMonthlyEarningsMWK, setTotalMonthlyEarningsMWK] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Form edit states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceMWK, setPriceMWK] = useState<number>(1500);
  const [perks, setPerks] = useState<string[]>([
    'Exclusive unreleased acoustic recordings',
    'Early access to all upcoming master singles 48h prior',
    'Supporter badge on profile & comment threads',
    'Behind-the-scenes Lilongwe studio sessions',
  ]);
  const [newPerk, setNewPerk] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [artistId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [planRes, membersRes] = await Promise.all([
        api.getArtistMembershipPlan(artistId),
        api.getArtistMembers(artistId),
      ]);

      if (planRes.success && planRes.plan) {
        setPlan(planRes.plan);
        setTitle(planRes.plan.title);
        setDescription(planRes.plan.description);
        setPriceMWK(planRes.plan.priceMWK);
        setPerks(planRes.plan.perks || []);
      } else {
        setTitle(`${artistName} VIP Fan Club`);
        setDescription('Join my exclusive inner circle for unreleased acoustics, VIP stems, and early singles.');
      }

      if (membersRes.success) {
        setMembers(membersRes.members || []);
        setTotalMonthlyEarningsMWK(membersRes.totalMonthlyEarningsMWK || 0);
      }
    } catch {
      console.error('Failed to load artist membership details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.createOrUpdateArtistMembershipPlan({
        artistId,
        artistName,
        title: title.trim(),
        description: description.trim(),
        priceMWK,
        perks,
      });

      if (res.success && res.plan) {
        setPlan(res.plan);
        setSuccessMsg('VIP Fan Club plan settings saved successfully!');
      } else {
        setErrorMsg(res.error || 'Failed to update plan.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Saving failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const addPerk = () => {
    if (!newPerk.trim()) return;
    setPerks([...perks, newPerk.trim()]);
    setNewPerk('');
  };

  const removePerk = (index: number) => {
    setPerks(perks.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Earnings & Members Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-amber-500/30 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <DollarSign className="w-4 h-4" />
            <span>Monthly Fan Subscriptions</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            MK {totalMonthlyEarningsMWK.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">85% direct creator payout (15% platform fee)</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Active VIP Members</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">{members.length}</div>
          <p className="text-[11px] text-slate-400">Fans subscribed to your inner circle</p>
        </div>
      </div>

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

      {/* Plan Configuration Form */}
      <form onSubmit={handleSavePlan} className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
          <Crown className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-white text-base">VIP Fan Club Configuration</h3>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Membership Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Short Description & Pitch
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Monthly Subscription Price (MWK)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1000, 1500, 2500, 5000].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriceMWK(p)}
                className={`py-2 px-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                  priceMWK === p
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                MK {p.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Perks List */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Fan Privileges & Perks
          </label>
          <div className="space-y-2 mb-3">
            {perks.map((perk, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                  <span>{perk}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removePerk(i)}
                  className="text-slate-500 hover:text-rose-400 text-xs px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newPerk}
              onChange={(e) => setNewPerk(e.target.value)}
              placeholder="e.g. Early access to concert tickets"
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={addPerk}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Add Perk
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Fan Club Settings'}
        </button>
      </form>

      {/* Active Member List */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="font-bold text-white text-sm">Active Members ({members.length})</h4>
        {members.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">No active members yet. Share your profile link to invite supporters.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">
                    {m.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-white block">{m.userName}</span>
                    <span className="text-[10px] text-slate-400">{m.userEmail}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-amber-400 block">MK {m.artistShareMWK.toLocaleString()}/mo</span>
                  <span className="text-[10px] text-slate-500">Since {new Date(m.startedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
