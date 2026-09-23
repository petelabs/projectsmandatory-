import React, { useState } from 'react';
import { Sparkles, X, CheckCircle2, ShieldCheck, TrendingUp, BarChart3, Calendar, Layers, Zap } from 'lucide-react';
import { api } from '../../lib/api';
import { PaymentMethod, ArtistProSubscription } from '../../types';

interface ArtistProUpgradeModalProps {
  isOpen: boolean;
  artistId: string;
  artistName: string;
  userId: string;
  userEmail: string;
  onClose: () => void;
  onUpgradeSuccess?: (sub: ArtistProSubscription) => void;
}

export const ArtistProUpgradeModal: React.FC<ArtistProUpgradeModalProps> = ({
  isOpen,
  artistId,
  artistName,
  userId,
  userEmail,
  onClose,
  onUpgradeSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('AIRTEL_MONEY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const PRO_PRICE_MWK = 5000;

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.subscribeArtistPro({
        artistId,
        artistName,
        userId,
        userEmail,
        paymentMethod,
      });

      if (res.success && res.subscription) {
        setSuccessMsg('Congratulations! Artist Pro has been activated on your account.');
        setTimeout(() => {
          if (onUpgradeSuccess) onUpgradeSuccess(res.subscription);
          onClose();
        }, 2000);
      } else {
        setErrorMsg(res.error || 'Failed to activate Artist Pro.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment initiation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-blue-500/40 p-6 sm:p-8 shadow-2xl text-left overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white">Upgrade to Artist Pro</h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-mono font-bold">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Advanced analytics, campaign tools, and release scheduling
            </p>
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

        <form onSubmit={handleUpgrade} className="space-y-4">
          {/* Features Grid */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                Artist Pro Privileges
              </span>
              <span className="text-sm font-mono font-black text-white">
                MK {PRO_PRICE_MWK.toLocaleString()} / mo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {[
                { icon: BarChart3, text: 'Deeper Listener & City Insights' },
                { icon: TrendingUp, text: 'Advanced Stream Breakdown' },
                { icon: Calendar, text: 'Scheduled Release Automation' },
                { icon: Layers, text: 'Custom Profile Banner & Bio Links' },
                { icon: Zap, text: 'Priority Platform Placement Eligibility' },
                { icon: ShieldCheck, text: 'Exclusive Verified Pro Badge' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                  <item.icon className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Selection */}
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
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {method.name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black text-sm shadow-lg shadow-blue-950/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Activate Artist Pro • MK {PRO_PRICE_MWK.toLocaleString()}/mo</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
