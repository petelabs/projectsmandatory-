import React, { useState } from 'react';
import { Heart, X, Lock, Phone, CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { PaymentMethod } from '../../types';

interface ArtistTipModalProps {
  artistId: string;
  artistName: string;
  isOpen: boolean;
  onClose: () => void;
  onTipSuccess?: () => void;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export const ArtistTipModal: React.FC<ArtistTipModalProps> = ({
  artistId,
  artistName,
  isOpen,
  onClose,
  onTipSuccess,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [message, setMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('AIRTEL_MONEY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const tipAmount = customAmount ? Number(customAmount) : selectedAmount;
  const platformFee = Math.floor(tipAmount * 0.1); // 10% platform fee
  const artistReceives = tipAmount - platformFee; // 90% direct to artist

  const handleSendTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipAmount || tipAmount < 200) {
      setErrorMsg('Minimum tip amount is MK 200.');
      return;
    }
    if (!senderPhone.trim()) {
      setErrorMsg('Please enter your mobile phone number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await api.createTipCheckout({
        artistId,
        artistName,
        amountMWK: tipAmount,
        senderName: senderName || 'Generous Fan',
        senderEmail: senderEmail || undefined,
        senderPhone: senderPhone.trim(),
        message: message.trim() || undefined,
      });

      if (res.success) {
        if (res.checkoutUrl) {
          window.location.href = res.checkoutUrl;
          return;
        }

        // Sandbox or instant verified
        setSuccessMsg(`Thank you! Your tip of MK ${tipAmount.toLocaleString()} has been sent to ${artistName}.`);
        setTimeout(() => {
          if (onTipSuccess) onTipSuccess();
          onClose();
        }, 2500);
      } else {
        setErrorMsg('Failed to initialize tip. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment initiation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-rose-500/40 p-6 sm:p-8 shadow-2xl text-left overflow-y-auto max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">
              Support {artistName}
            </h3>
            <p className="text-xs text-slate-400">
              Direct fan tip via Airtel Money, TNM Mpamba, or Card
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

        <form onSubmit={handleSendTip} className="space-y-4">
          
          {/* Amount Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Tip Amount (MWK)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-mono font-bold border transition-all ${
                    !customAmount && selectedAmount === amt
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/60'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  MK {amt.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="mt-2.5">
              <input
                type="number"
                min={200}
                max={500000}
                placeholder="Or enter custom amount in MWK..."
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Fee Split Transparency Breakdown */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Total Tip:</span>
              <span className="font-mono font-semibold text-white">MK {tipAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Platform Fee (10%):</span>
              <span className="font-mono text-slate-400">MK {platformFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
              <span>{artistName} Receives (90%):</span>
              <span className="font-mono">MK {artistReceives.toLocaleString()}</span>
            </div>
          </div>

          {/* Fan Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="e.g. Kondwani"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Phone Number (Airtel/TNM) *
              </label>
              <input
                type="tel"
                required
                placeholder="0999 123 456"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Encouraging Message */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Note for {artistName} (Optional)
            </label>
            <input
              type="text"
              placeholder="Keep making great music! Love from Lilongwe."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Heart className="w-4 h-4 fill-current" />
                <span>Send MK {tipAmount.toLocaleString()} Tip via PayChangu</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Direct artist empowerment. Verified through PayChangu.</span>
          </p>
        </form>

      </div>
    </div>
  );
};
