import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Lock, Smartphone, CreditCard, Building2, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Song, PaymentMethod } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface CheckoutPageProps {
  song: Song;
  onBack: () => void;
  onPaymentInitiated: (txRef: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  song,
  onBack,
  onPaymentInitiated,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('AIRTEL_MONEY');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const paymentOptions: { id: PaymentMethod; title: string; subtitle: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'AIRTEL_MONEY',
      title: 'Airtel Money',
      subtitle: 'Instant Malawi Mobile Money push',
      icon: <Smartphone className="w-5 h-5 text-rose-500" />,
      badge: 'Popular',
    },
    {
      id: 'TNM_MPAMBA',
      title: 'TNM Mpamba',
      subtitle: 'Fast Malawi Mpamba wallet checkout',
      icon: <Smartphone className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: 'CARD',
      title: 'Credit / Debit Card',
      subtitle: 'Visa, Mastercard, Local & International',
      icon: <CreditCard className="w-5 h-5 text-blue-400" />,
    },
    {
      id: 'BANK_TRANSFER',
      title: 'PayChangu Direct',
      subtitle: 'Bank transfer / Online gateway',
      icon: <Building2 className="w-5 h-5 text-orange-400" />,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address to receive your download license');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 7) {
      setErrorMessage('Please enter a valid phone number (e.g., +265 999 123 456)');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create order on server (server enforces actual authoritative price from DB)
      const order = await api.createOrder({
        songId: song.id,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
      });

      // 2. Direct to payment processing / verification screen with transaction reference
      showToast('Payment initiated via PayChangu secure gateway', 'info');
      onPaymentInitiated(order.txRef);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not initialize payment. Please try again.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left animate-in fade-in">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white py-1.5 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Cancel & Return</span>
      </button>

      {/* Main Checkout Container */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl space-y-8">
        
        {/* Title & Trust Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-extrabold text-white font-['Syne',sans-serif]">
              Checkout & Download
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              One-time payment for direct studio audio file ownership.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-semibold self-start sm:self-center">
            <Lock className="w-3.5 h-3.5" />
            <span>PayChangu 256-Bit SSL Encrypted</span>
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
              <img
                src={song.coverImage}
                alt={song.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-mono text-blue-400 uppercase tracking-wider block">
                Digital Audio Download
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {song.title}
              </h3>
              <p className="text-xs text-slate-400 truncate font-medium">
                {song.artist} • {song.fileFormat}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Total Due
            </span>
            <span className="text-lg sm:text-2xl font-black text-white font-mono leading-none">
              MK {song.priceMWK.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Customer & Delivery Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Kondwani Banda"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. yourname@gmail.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                helperText="Download license and receipt will be delivered here."
                required
              />
            </div>

            <Input
              label="Phone Number (Malawi Mobile Money)"
              type="tel"
              placeholder="e.g. +265 999 123 456 or 0888 123 456"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              helperText="Used to trigger mobile money approval prompt."
              required
            />
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              2. Select Payment Method (Malawi)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paymentOptions.map((opt) => {
                const isSelected = paymentMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`p-4 rounded-xl text-left border transition-all flex items-start justify-between min-h-[44px] ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                        {opt.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white block">
                            {opt.title}
                          </span>
                          {opt.badge && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5 leading-tight">
                          {opt.subtitle}
                        </span>
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-1 shrink-0 ${
                      isSelected ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Pay Button (Red CTA) */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[52px] bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-rose-950/60 border border-rose-500/40 flex items-center justify-center gap-2.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>
                {isLoading
                  ? 'Initiating Secure PayChangu Payment...'
                  : `PAY MK ${song.priceMWK.toLocaleString()} & GET DOWNLOAD`}
              </span>
            </button>

            <p className="text-center text-[11px] text-slate-400">
              🔒 Verified by PayChangu. Payment confirmation happens server-side. Download starts instantly upon verification.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
