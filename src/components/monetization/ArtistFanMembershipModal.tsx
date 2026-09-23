import React, { useState, useEffect } from 'react';
import { Crown, X, CheckCircle2, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { api } from '../../lib/api';
import { ArtistMembershipPlan, PaymentMethod } from '../../types';

interface ArtistFanMembershipModalProps {
  isOpen: boolean;
  artistId: string;
  artistName: string;
  userId: string;
  userEmail: string;
  userName?: string;
  onClose: () => void;
  onJoinSuccess?: () => void;
}

export const ArtistFanMembershipModal: React.FC<ArtistFanMembershipModalProps> = ({
  isOpen,
  artistId,
  artistName,
  userId,
  userEmail,
  userName = 'Music Fan',
  onClose,
  onJoinSuccess,
}) => {
  const [plan, setPlan] = useState<ArtistMembershipPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('AIRTEL_MONEY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && artistId) {
      loadPlan();
    }
  }, [isOpen, artistId]);

  const loadPlan = async () => {
    setIsLoading(true);
    try {
      const res = await api.getArtistMembershipPlan(artistId);
      if (res.success && res.plan) {
        setPlan(res.plan);
      } else {
        // Fallback default tier if artist hasn't customized yet
        setPlan({
          id: `default-plan-${artistId}`,
          artistId,
          artistName,
          title: `${artistName} VIP Fan Club`,
          description: `Directly support ${artistName} and gain exclusive supporter privileges, early releases, and VIP supporter badge.`,
          priceMWK: 1500,
          billingInterval: 'MONTHLY',
          perks: [
            'Exclusive unreleased tracks & studio acoustics',
            'Early access to all upcoming singles 48h prior',
            'Official VIP Supporter badge in comments & chats',
            'Behind-the-scenes video journals & direct Q&As',
          ],
          isActive: true,
          memberCount: 0,
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      setPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.joinArtistMembership({
        planId: plan.id,
        artistId,
        artistName,
        userId,
        userEmail,
        userName,
        paymentMethod,
      });

      if (res.success) {
        setSuccessMsg(`Welcome to the inner circle! You are now a VIP member of ${artistName}.`);
        setTimeout(() => {
          if (onJoinSuccess) onJoinSuccess();
          onClose();
        }, 2000);
      } else {
        setErrorMsg(res.error || 'Failed to join membership.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment initiation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 p-6 sm:p-8 shadow-2xl text-left overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">{artistName} Inner Circle</h3>
            <p className="text-xs text-slate-400">Exclusive fan membership & artist perks</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading membership details...</div>
        ) : plan ? (
          <form onSubmit={handleJoin} className="space-y-4">
            {/* Plan Info Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 to-slate-950 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{plan.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{plan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-amber-400 font-mono">
                    MK {plan.priceMWK.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">/ month</div>
                </div>
              </div>

              {/* Perks List */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
                  Included Fan Privileges:
                </span>
                <ul className="space-y-1.5">
                  {plan.perks.map((perk, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Select Mobile Payment
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'AIRTEL_MONEY', name: 'Airtel Money' },
                  { id: 'TNM_MPAMBA', name: 'TNM Mpamba' },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      paymentMethod === method.id
                        ? 'bg-amber-500/20 border-amber-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {method.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
              85% of your membership goes directly to <strong className="text-slate-200">{artistName}</strong> to fund recordings, instruments, and music production.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-950/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin">⏳</span>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  <span>Join Fan Club • MK {plan.priceMWK.toLocaleString()}/mo</span>
                </>
              )}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
};
