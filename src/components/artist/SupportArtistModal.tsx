import React, { useState } from 'react';
import { Heart, X, Sparkles, CheckCircle2, DollarSign, Smartphone, MessageCircle, Share2 } from 'lucide-react';
import { PaymentMethod } from '../../types';
import { createArtistSupportTip } from '../../lib/firebase';
import { useToast } from '../../context/ToastContext';

interface SupportArtistModalProps {
  artistId: string;
  artistName: string;
  artistAvatar?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export const SupportArtistModal: React.FC<SupportArtistModalProps> = ({
  artistId,
  artistName,
  artistAvatar,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [supporterName, setSupporterName] = useState<string>('');
  const [supporterPhone, setSupporterPhone] = useState<string>('');
  const [supporterEmail, setSupporterEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('AIRTEL_MONEY');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [tipRef, setTipRef] = useState<string>('');

  if (!isOpen) return null;

  const effectiveAmount = isCustom ? (parseInt(customAmount, 10) || 0) : amount;
  const artistShare = Math.round(effectiveAmount * 0.7);
  const platformShare = effectiveAmount - artistShare;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveAmount < 100) {
      showToast('Minimum support amount is MK 100', 'error');
      return;
    }
    if (!supporterName.trim()) {
      showToast('Please provide your name', 'error');
      return;
    }
    if (!supporterPhone.trim() || supporterPhone.length < 8) {
      showToast('Please provide a valid phone number for Mobile Money', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedRef = `TIP-${Date.now().toString().slice(-6)}`;
      await createArtistSupportTip({
        artistId,
        artistName,
        supporterName: supporterName.trim(),
        supporterEmail: supporterEmail.trim() || undefined,
        supporterPhone: supporterPhone.trim(),
        amountMWK: effectiveAmount,
        message: message.trim() || undefined,
        paymentMethod,
        txRef: generatedRef,
      });

      setTipRef(generatedRef);
      setIsSuccess(true);
      showToast(`Thank you for supporting ${artistName}! Your MK ${effectiveAmount.toLocaleString()} backing was sent.`, 'success');
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Could not complete artist support tip';
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareText = `I just backed ${artistName} on Projects Mandatory! Stream, purchase tracks, and support independent music here: ${window.location.origin}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center space-y-6 py-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/50">
              <Heart className="w-8 h-8 fill-emerald-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-white font-['Syne',sans-serif]">
                Thank You, {supporterName}!
              </h3>
              <p className="text-sm text-slate-300">
                You successfully supported <strong className="text-rose-400">{artistName}</strong> with{' '}
                <strong className="text-emerald-400">MK {effectiveAmount.toLocaleString()}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Direct Artist Creator Share (70%):</span>
                <span className="font-semibold text-emerald-400">MK {artistShare.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Projects Mandatory Maintenance (30%):</span>
                <span className="font-semibold text-slate-300">MK {platformShare.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span>Transaction Ref:</span>
                <span className="font-mono text-slate-400">{tipRef}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share & Boost {artistName} on WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  setIsSuccess(false);
                  onClose();
                }}
                className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            {/* Header */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-rose-500/40 shrink-0 bg-slate-800">
                <img
                  src={artistAvatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200&auto=format&fit=crop'}
                  alt={artistName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/30 text-[10px] font-bold text-rose-300 uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3 text-rose-400" />
                  <span>Fan Backing</span>
                </div>
                <h3 className="text-xl font-extrabold text-white font-['Syne',sans-serif]">
                  Support {artistName}
                </h3>
                <p className="text-xs text-slate-400">
                  Directly support your favorite artist to create more studio music.
                </p>
              </div>
            </div>

            {/* Select Support Amount */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Choose Support Amount (MWK)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {PRESET_AMOUNTS.map((amt) => {
                  const isSelected = !isCustom && amount === amt;
                  return (
                    <button
                      type="button"
                      key={amt}
                      onClick={() => {
                        setIsCustom(false);
                        setAmount(amt);
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition border ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/50 scale-105'
                          : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      K{amt.toLocaleString()}
                    </button>
                  );
                })}
              </div>

              {/* Custom amount toggle */}
              <div className="pt-1.5">
                <button
                  type="button"
                  onClick={() => setIsCustom(!isCustom)}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
                >
                  {isCustom ? '← Pick preset amount' : '+ Enter custom amount'}
                </button>

                {isCustom && (
                  <div className="mt-2 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      MWK
                    </span>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      placeholder="e.g. 3000"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 rounded-xl pl-14 pr-4 py-2.5 text-sm font-bold text-white focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Split Transparency Card */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span>Direct Artist Creator Share (70%):</span>
                <span className="font-bold text-emerald-400">MK {artistShare.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Projects Mandatory Platform Fee (30%):</span>
                <span className="font-semibold text-slate-300">MK {platformShare.toLocaleString()}</span>
              </div>
            </div>

            {/* Supporter Details */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Your Name / Supporter Handle *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kondwani Phiri"
                  value={supporterName}
                  onChange={(e) => setSupporterName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Mobile Money Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="09... / 08..."
                    value={supporterPhone}
                    onChange={(e) => setSupporterPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="AIRTEL_MONEY">Airtel Money</option>
                    <option value="TNM_MPAMBA">TNM Mpamba</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Encouragement Message for {artistName} (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Keep giving us hit tracks! Love the new release."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || effectiveAmount < 100}
                className="w-full min-h-[46px] rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/60 transition flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Send MK {effectiveAmount.toLocaleString()} Support</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-500">
                Instant confirmation. 70% automatically credited to {artistName}'s wallet.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
