import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  FileText,
  Heart,
  ShieldCheck,
  Disc3,
  Calendar,
  AlertCircle,
  Download,
  Clock,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { ArtistEarningsSummary, RoyaltyStatement } from '../../types';
import { api } from '../../lib/api';

interface ArtistRoyaltiesTabProps {
  artistId: string;
  artistName: string;
  onRequestPayout?: (amount: number) => void;
}

export const ArtistRoyaltiesTab: React.FC<ArtistRoyaltiesTabProps> = ({
  artistId,
  artistName,
  onRequestPayout,
}) => {
  const [earnings, setEarnings] = useState<ArtistEarningsSummary | null>(null);
  const [statements, setStatements] = useState<RoyaltyStatement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<RoyaltyStatement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [earningsData, statementsData] = await Promise.all([
          api.getArtistEarnings(artistId),
          api.getArtistStatements(artistId),
        ]);
        if (mounted) {
          setEarnings(earningsData);
          setStatements(statementsData);
        }
      } catch (err) {
        console.warn('Artist royalties load notice:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [artistId]);

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-400 font-mono">Loading artist royalty ledger & statements...</p>
      </div>
    );
  }

  const withdrawableBalance = earnings?.withdrawableBalanceMWK || 0;
  const estimatedCurrentPeriod = earnings?.estimatedCurrentPeriodEarningsMWK || 0;

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payoutAmount);
    if (!amount || amount < 2000) {
      setPayoutNotice('Minimum withdrawal threshold is MK 2,000.');
      return;
    }
    if (amount > withdrawableBalance) {
      setPayoutNotice('Withdrawal request cannot exceed your finalized withdrawable balance. (Estimated open-pool earnings cannot be withdrawn until finalized).');
      return;
    }

    if (onRequestPayout) {
      onRequestPayout(amount);
      setPayoutNotice(`Payout request of MK ${amount.toLocaleString()} submitted successfully.`);
      setPayoutAmount('');
    }
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-extrabold uppercase tracking-wider">
              Phase 1 Monetisation Ledger
            </span>
            <span className="text-xs text-slate-500 font-mono">• Current Cycle: September 2026</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Creator Royalty & Revenue Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Track qualifying stream shares, live open-pool estimates, immutable monthly finalized statements, and direct fan tips.
          </p>
        </div>

        {/* Withdrawable Balance Card */}
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-right min-w-[200px]">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
            Withdrawable Balance
          </span>
          <span className="text-2xl font-black text-white font-mono block">
            MK {withdrawableBalance.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Finalized Statements + Tips + Direct Sales
          </span>
        </div>
      </div>

      {/* Financial Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Qualifying Streams */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Qualifying Streams</span>
            <Disc3 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {earnings?.totalQualifyingStreams.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Streams ≥30s & ≥50% verified
          </p>
        </div>

        {/* Metric 2: Stream Share % */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pool Share %</span>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {earnings?.currentStreamsharePercent || 0}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Share of platform qualifying streams
          </p>
        </div>

        {/* Metric 3: Live Open-Pool Estimate (ESTIMATED, NOT WITHDRAWABLE) */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Estimated Pool Earnings</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            MK {estimatedCurrentPeriod.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-amber-400/90 font-medium mt-1">
            <Info className="w-3 h-3 shrink-0" />
            <span>Open period estimate (finalized at month-end)</span>
          </div>
        </div>

        {/* Metric 4: Fan Tips & Direct Sales */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tips & Direct Sales</span>
            <Heart className="w-4 h-4 text-rose-400 fill-rose-500/20" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            MK {((earnings?.tipsEarnedMWK || 0) + (earnings?.directSalesEarnedMWK || 0)).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tips: MK {(earnings?.tipsEarnedMWK || 0).toLocaleString()} • Sales: MK {(earnings?.directSalesEarnedMWK || 0).toLocaleString()}
          </p>
        </div>

      </div>

      {/* Transparency Banner: Estimated vs Finalized Rule */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-slate-400">
          <span className="font-bold text-slate-200 block">
            Financial Integrity & Anti-Fraud Accounting
          </span>
          <p>
            Estimated pool earnings fluctuate dynamically as more fans stream across Malawi during the open billing period. At the end of every calendar month, the administrator locks and finalizes the period, generating an immutable <strong className="text-slate-200">Royalty Statement</strong> that transfers earnings into your withdrawable balance.
          </p>
        </div>
      </div>

      {/* Payout Request Section */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-2">
          Request Disbursement / Payout
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Withdraw from your finalized balance directly to Airtel Money or TNM Mpamba. (Minimum withdrawal: MK 2,000).
        </p>

        {payoutNotice && (
          <div className="mb-4 p-3 rounded-xl bg-blue-950/50 border border-blue-500/40 text-blue-200 text-xs font-semibold">
            {payoutNotice}
          </div>
        )}

        <form onSubmit={handleRequestPayout} className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">MK</span>
            <input
              type="number"
              min={2000}
              max={withdrawableBalance}
              placeholder="e.g. 5000"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            type="submit"
            disabled={withdrawableBalance < 2000}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all shrink-0"
          >
            Request Payout
          </button>
        </form>
      </div>

      {/* Monthly Royalty Statements (Immutable) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white">
              Immutable Monthly Royalty Statements
            </h3>
            <p className="text-xs text-slate-400">
              Official audit records finalized and signed at the end of each billing cycle.
            </p>
          </div>
        </div>

        {statements.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No finalized monthly statements yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Your first official statement will be generated automatically when the September 2026 period closes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Your Streams</th>
                  <th className="px-4 py-3">Total Platform Streams</th>
                  <th className="px-4 py-3">Stream Share</th>
                  <th className="px-4 py-3">Final Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {statements.map((stmt) => (
                  <tr key={stmt.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-white font-mono">
                      {stmt.periodMonth}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-300">
                      {stmt.artistQualifyingStreams.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-400">
                      {stmt.totalPlatformQualifyingStreams.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-rose-400 font-semibold">
                      {stmt.streamsharePercentage}%
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-400">
                      MK {stmt.finalAmountMWK.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {stmt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedStatement(stmt)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Breakdown</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statement Detail Modal */}
      {selectedStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-6 sm:p-8 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                  Official Immutable Statement
                </span>
                <h3 className="text-xl font-black text-white">
                  Period: {selectedStatement.periodMonth}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStatement(null)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs mb-6">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>Creator:</span>
                <span className="font-bold text-white">{selectedStatement.artistName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>Total Creator Pool (60%):</span>
                <span className="font-mono text-white">MK {selectedStatement.totalCreatorPoolMWK.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>Qualifying Streams:</span>
                <span className="font-mono text-white">{selectedStatement.artistQualifyingStreams.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>Total Platform Streams:</span>
                <span className="font-mono text-white">{selectedStatement.totalPlatformQualifyingStreams.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                <span>Calculated Stream Share:</span>
                <span className="font-mono font-bold text-rose-400">{selectedStatement.streamsharePercentage}%</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold text-emerald-400 bg-slate-950 px-3 rounded-xl border border-slate-800">
                <span>Net Credited Amount:</span>
                <span className="font-mono">MK {selectedStatement.finalAmountMWK.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedStatement(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
