import React, { useState } from 'react';
import { Gift, X, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { UserSubscription, GiftSubscription } from '../../types';

interface ClaimGiftModalProps {
  isOpen: boolean;
  initialCode?: string;
  userId?: string;
  userEmail?: string;
  onClose: () => void;
  onClaimSuccess?: (subscription: UserSubscription) => void;
}

export const ClaimGiftModal: React.FC<ClaimGiftModalProps> = ({
  isOpen,
  initialCode = '',
  userId = 'guest',
  userEmail = '',
  onClose,
  onClaimSuccess,
}) => {
  const [giftCode, setGiftCode] = useState(initialCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successGift, setSuccessGift] = useState<{ subscription: UserSubscription; gift: GiftSubscription } | null>(null);

  if (!isOpen) return null;

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = giftCode.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMsg('Please enter a gift code.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.claimGiftSubscription({
        giftCode: cleanCode,
        recipientUserId: userId,
        recipientEmail: userEmail || undefined,
      });

      if (res.success && res.subscription && res.gift) {
        setSuccessGift({ subscription: res.subscription, gift: res.gift });
        if (onClaimSuccess) onClaimSuccess(res.subscription);
      } else {
        setErrorMsg(res.error || 'Failed to redeem gift code. Please check and try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Redemption failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/30 p-6 sm:p-8 shadow-2xl text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!successGift ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Redeem Gift Code</h3>
                <p className="text-xs text-slate-400">Activate your gifted subscription instantly</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Enter Gift Code
                </label>
                <input
                  type="text"
                  required
                  value={giftCode}
                  onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PM-PLUS-XXXX"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-center tracking-widest text-lg font-bold focus:border-amber-500 focus:outline-none uppercase"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
                Gift codes unlock instant ad-free streaming, offline audio, and support the Creator Royalty Pool without recurring billing.
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
                    <Sparkles className="w-4 h-4" />
                    <span>Activate Gift Subscription</span>
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">Subscription Activated!</h3>
              <p className="text-xs text-slate-300 mt-1">
                You now have <span className="text-amber-400 font-bold">{successGift.gift.durationMonths} Months</span> of{' '}
                <span className="text-white font-bold">{successGift.gift.planTier.replace('_', ' ')}</span>.
              </p>
            </div>

            {successGift.gift.giftMessage && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 italic">
                "{successGift.gift.giftMessage}"
                <div className="text-right text-[11px] text-amber-400 font-semibold mt-1">
                  — {successGift.gift.senderName}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-950/50"
            >
              Start Streaming Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
