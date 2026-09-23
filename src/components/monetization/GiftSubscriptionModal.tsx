import React, { useState } from 'react';
import { Gift, X, Sparkles, CheckCircle2, Copy, Send, Heart, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { PaymentMethod, GiftSubscription } from '../../types';

interface GiftSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (gift: GiftSubscription) => void;
}

export const GiftSubscriptionModal: React.FC<GiftSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedTier, setSelectedTier] = useState<'PREMIUM' | 'PREMIUM_PLUS'>('PREMIUM_PLUS');
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('AIRTEL_MONEY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdGift, setCreatedGift] = useState<GiftSubscription | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const monthlyPrice = selectedTier === 'PREMIUM_PLUS' ? 2500 : 1000;
  const totalAmount = monthlyPrice * durationMonths;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientEmail.trim()) {
      setErrorMsg('Please provide the recipient\'s name and email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.purchaseGiftSubscription({
        senderName: senderName.trim() || 'A music lover',
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        recipientPhone: recipientPhone.trim() || undefined,
        planTier: selectedTier,
        durationMonths,
        giftMessage: giftMessage.trim() || 'Enjoy ad-free music streaming on Projects Mandatory!',
        paymentMethod,
      });

      if (res.success && res.gift) {
        setCreatedGift(res.gift);
        if (onSuccess) onSuccess(res.gift);
      } else {
        setErrorMsg(res.error || 'Failed to purchase gift subscription.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment initiation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyClaimLink = () => {
    if (!createdGift) return;
    const claimUrl = `${window.location.origin}/account?claimGift=${encodeURIComponent(createdGift.giftCode)}`;
    navigator.clipboard.writeText(claimUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/30 p-6 sm:p-8 shadow-2xl text-left overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!createdGift ? (
          <>
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Gift a Subscription</h3>
                <p className="text-xs text-slate-400">Share the gift of studio master African music</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Select Tier */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Subscription Tier
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTier('PREMIUM')}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedTier === 'PREMIUM'
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-white">Premium</div>
                    <div className="text-xs text-blue-400 font-mono mt-0.5">MK 1,000/mo</div>
                    <div className="text-[11px] text-slate-400 mt-1">Unlimited ad-free streaming</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTier('PREMIUM_PLUS')}
                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      selectedTier === 'PREMIUM_PLUS'
                        ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-sm text-white flex items-center gap-1">
                      Premium Plus
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-xs text-amber-400 font-mono mt-0.5">MK 2,500/mo</div>
                    <div className="text-[11px] text-slate-400 mt-1">Offline downloads + Lossless</div>
                  </button>
                </div>
              </div>

              {/* Duration Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Gift Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 12].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMonths(m)}
                      className={`py-2 px-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                        durationMonths === m
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {m} {m === 1 ? 'Month' : 'Months'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Details */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Recipient Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Tadala Phiri"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Recipient Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="tadala@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Recipient Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="0999 123 456"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Your Name (Sender)
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Kondwani Banda"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Personalized Message
                  </label>
                  <textarea
                    rows={2}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Enjoy uninterrupted music on Projects Mandatory!"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Payment Method
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

              {/* Summary and Pay */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Total Gift Amount</span>
                  <div className="text-lg font-black text-white font-mono">
                    MK {totalAmount.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-amber-400 font-semibold block">
                    {durationMonths} Months of {selectedTier.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500">Instant gift code</span>
                </div>
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
                    <Gift className="w-4 h-4" />
                    <span>Purchase Gift • MK {totalAmount.toLocaleString()}</span>
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Gift Created Success Card */
          <div className="text-center py-4 space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white">Gift Purchased!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Share this unique gift code with <span className="text-white font-bold">{createdGift.recipientName}</span> to activate their {createdGift.durationMonths}-month {createdGift.planTier.replace('_', ' ')} subscription.
              </p>
            </div>

            {/* Gift Code Display */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                Unique Claim Code
              </span>
              <div className="text-2xl font-black text-white font-mono tracking-widest bg-slate-900 py-2.5 px-4 rounded-xl border border-slate-800 select-all">
                {createdGift.giftCode}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyClaimLink}
                className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Claim Link Copied!' : 'Copy Claim Link'}</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
