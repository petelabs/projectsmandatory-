import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, DollarSign, Users, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';
import { TipRecord } from '../../types';

interface ArtistTipsTabProps {
  artistId: string;
  artistName: string;
}

export const ArtistTipsTab: React.FC<ArtistTipsTabProps> = ({ artistId, artistName }) => {
  const [tips, setTips] = useState<TipRecord[]>([]);
  const [totalTipsMWK, setTotalTipsMWK] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTips();
  }, [artistId]);

  const loadTips = async () => {
    setIsLoading(true);
    try {
      const res = await api.getArtistTips(artistId);
      if (res.success) {
        setTips(res.tips || []);
        setTotalTipsMWK(res.totalTipsMWK || 0);
      }
    } catch {
      console.error('Failed to load tips');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-rose-500/30 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <Heart className="w-4 h-4 fill-current" />
            <span>Direct Fan Tips</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            MK {totalTipsMWK.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">90% credited directly to your payout balance</p>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Supporter Count</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">{tips.length}</div>
          <p className="text-[11px] text-slate-400">Total individual fan donations received</p>
        </div>
      </div>

      {/* Tip History & Messages */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-rose-400" />
            <span>Supporter Messages & Tips</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">{tips.length} Tips</span>
        </div>

        {tips.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No direct fan tips received yet. Fans can tip you from your artist profile or song player.
          </div>
        ) : (
          <div className="space-y-3">
            {tips.map((tip) => (
              <div
                key={tip.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-[10px]">
                      {tip.senderName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-white block">{tip.senderName}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(tip.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400 text-sm block">
                      +MK {tip.artistAmountMWK.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500">{tip.paymentMethod.replace('_', ' ')}</span>
                  </div>
                </div>

                {tip.message && (
                  <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/50 italic">
                    "{tip.message}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
