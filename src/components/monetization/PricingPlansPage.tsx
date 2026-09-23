import React, { useState } from 'react';
import {
  Check,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Crown,
  Download,
  Volume2,
} from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { SubscriptionTier } from '../../types';

interface PricingPlansPageProps {
  onNavigate: (path: string) => void;
  onBack?: () => void;
}

export const PricingPlansPage: React.FC<PricingPlansPageProps> = ({
  onNavigate,
  onBack,
}) => {
  const { currentTier, plans, subscribe, isLoading } = useSubscription();
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [paymentPhone, setPaymentPhone] = useState('');
  const [selectedTierForCheckout, setSelectedTierForCheckout] = useState<SubscriptionTier | null>(null);

  const handleSubscribeClick = async (tier: SubscriptionTier) => {
    if (tier === 'FREE') {
      await subscribe('FREE');
      showToast('Switched to Free plan', 'info');
      return;
    }

    if (!isAuthenticated) {
      showToast('Please sign in first to subscribe to a plan', 'info');
      await loginWithGoogle();
      return;
    }

    setSelectedTierForCheckout(tier);
  };

  const handleConfirmPayment = async () => {
    if (!selectedTierForCheckout) return;
    if (!paymentPhone.trim() || paymentPhone.length < 9) {
      showToast('Please enter a valid Airtel or TNM mobile number', 'error');
      return;
    }

    const success = await subscribe(selectedTierForCheckout, 'AIRTEL_MONEY', paymentPhone);
    if (success) {
      showToast(
        `Successfully subscribed to ${selectedTierForCheckout.replace('_', ' ')}!`,
        'success'
      );
      setSelectedTierForCheckout(null);
      onNavigate('/');
    } else {
      showToast('Subscription process encountered an issue. Please try again.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-8 text-left">
      
      {/* Top back button */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => (onBack ? onBack() : window.history.back())}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-full transition active:scale-95 ${
            isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-black'
          }`}
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.2px]" />
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-[#1455D9]">
          Membership Plans
        </span>
        <div className="w-10" />
      </div>

      {/* Header with Projects Mandatory Logo */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1455D9] via-[#E53935] to-[#F59E0B] p-[2px] shadow-lg mb-1">
          <div className="w-full h-full bg-[#080B12] rounded-[14px] flex items-center justify-center">
            <div className="w-0 h-0 border-y-[8px] border-y-transparent border-l-[14px] border-l-[#F59E0B] ml-1" />
          </div>
        </div>

        <h1
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-[#111827]'
          }`}
        >
          Choose Your Plan
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xs">
          Better sound. More freedom. Support artists.
        </p>
      </div>

      {/* ===================================================
          THREE CLEAR CARDS: FREE | PREMIUM | PREMIUM PLUS
          =================================================== */}
      <div className="space-y-4 pt-1">
        
        {/* CARD 1: FREE */}
        <div
          className={`p-5 rounded-3xl border transition ${
            isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB] shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold">Free</h3>
              <p className="text-xs text-slate-400">Ad-supported mobile access</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold">K0</span>
              <span className="text-xs text-slate-400 block">/ month</span>
            </div>
          </div>

          <div className="space-y-2 pt-4 pb-5 border-t border-slate-200 dark:border-slate-800/80 mt-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-slate-400" />
              <span>Listen with occasional audio ads</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-slate-400" />
              <span>Standard streaming audio quality</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="w-4 text-center">✕</span>
              <span>No offline downloads</span>
            </div>
          </div>

          <button
            onClick={() => handleSubscribeClick('FREE')}
            disabled={currentTier === 'FREE'}
            className={`w-full py-3 rounded-2xl text-xs font-bold transition ${
              currentTier === 'FREE'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-default'
                : 'bg-slate-300 dark:bg-slate-700 text-black dark:text-white hover:opacity-90'
            }`}
          >
            {currentTier === 'FREE' ? 'Current Plan' : 'Downgrade to Free'}
          </button>
        </div>

        {/* CARD 2: PREMIUM */}
        <div
          className={`p-5 rounded-3xl border transition ${
            currentTier === 'PREMIUM'
              ? 'border-[#1455D9] ring-2 ring-[#1455D9]/30'
              : isDark
              ? 'bg-[#11151F] border-slate-800'
              : 'bg-white border-[#E5E7EB] shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold">Premium</h3>
              <p className="text-xs text-slate-400">Ad-free streaming experience</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-[#1455D9]">K1,000</span>
              <span className="text-xs text-slate-400 block">/ month</span>
            </div>
          </div>

          <div className="space-y-2 pt-4 pb-5 border-t border-slate-200 dark:border-slate-800/80 mt-4 text-xs">
            <div className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-[#1455D9]" />
              <span>100% Ad-free uninterrupted listening</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-[#1455D9]" />
              <span>Standard streaming audio quality</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-[#1455D9]" />
              <span>Direct artist royalty pool support</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="w-4 text-center">✕</span>
              <span>Online only (no offline downloads)</span>
            </div>
          </div>

          <button
            onClick={() => handleSubscribeClick('PREMIUM')}
            className={`w-full py-3.5 rounded-2xl text-xs font-bold text-white transition active:scale-95 shadow-md ${
              currentTier === 'PREMIUM'
                ? 'bg-slate-700 cursor-default'
                : 'bg-[#1455D9] hover:bg-[#0f44b3]'
            }`}
          >
            {currentTier === 'PREMIUM' ? 'Current Plan' : 'Subscribe (MK 1,000)'}
          </button>
        </div>

        {/* CARD 3: PREMIUM PLUS (MOST POPULAR) */}
        <div
          className={`p-5 rounded-3xl border-2 border-[#18A558] relative overflow-hidden transition shadow-xl ${
            isDark ? 'bg-[#11151F]' : 'bg-white'
          }`}
        >
          {/* Most Popular Badge in Green (#18A558) */}
          <div className="absolute top-0 right-0 bg-[#18A558] text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl tracking-wider uppercase shadow-sm">
            Most Popular
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-[#F59E0B]" />
                <h3 className="text-base font-bold">Premium Plus</h3>
              </div>
              <p className="text-xs text-slate-400">The complete listening master</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-[#E53935]">K2,500</span>
              <span className="text-xs text-slate-400 block">/ month</span>
            </div>
          </div>

          <div className="space-y-2 pt-4 pb-5 border-t border-slate-200 dark:border-slate-800/80 mt-4 text-xs">
            <div className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-[#18A558]" />
              <span>100% Ad-free uninterrupted listening</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-[#18A558]">
              <Check className="w-4 h-4 text-[#18A558]" />
              <span>Offline downloads (Listen anywhere without data)</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-[#18A558]" />
              <span>Highest studio sound quality (320kbps)</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-[#18A558]" />
              <span>Maximum artist royalty payout contribution</span>
            </div>
          </div>

          {/* Action Red Subscribe Button (#E53935) */}
          <button
            onClick={() => handleSubscribeClick('PREMIUM_PLUS')}
            className={`w-full py-3.5 rounded-2xl text-xs font-bold text-white transition active:scale-95 shadow-lg shadow-red-950/40 ${
              currentTier === 'PREMIUM_PLUS'
                ? 'bg-slate-700 cursor-default'
                : 'bg-[#E53935] hover:bg-[#d32f2f]'
            }`}
          >
            {currentTier === 'PREMIUM_PLUS'
              ? 'Current Plan'
              : 'Subscribe with Plus (MK 2,500)'}
          </button>
        </div>
      </div>

      {/* ===================================================
          BOTTOM INFO CALLOUT
          =================================================== */}
      <div
        className={`p-4 rounded-2xl border flex items-start gap-3 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <ShieldCheck className="w-5 h-5 text-[#18A558] flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-slate-300 dark:text-slate-200">
            Your subscription helps support artists.
          </h4>
          <p className="text-slate-400 leading-relaxed">
            Part of subscription revenue is allocated to creators based on verified listening activity and our artist-revenue policy.
          </p>
        </div>
      </div>

      {/* Checkout Drawer / Modal for Mobile Money */}
      {selectedTierForCheckout && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className={`w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border text-left space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 ${
              isDark ? 'bg-[#11151F] border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold">
                Subscribe to {selectedTierForCheckout.replace('_', ' ')}
              </h3>
              <button
                onClick={() => setSelectedTierForCheckout(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Pay via PayChangu (Airtel Money or TNM Mpamba). A payment prompt will be sent to your mobile phone.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block">
                Malawi Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 0999123456 or 0888123456"
                value={paymentPhone}
                onChange={(e) => setPaymentPhone(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl text-sm border outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-black'
                }`}
                autoFocus
              />
            </div>

            <button
              onClick={handleConfirmPayment}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#E53935] hover:bg-[#d32f2f] active:scale-95 text-white text-xs font-bold transition shadow-md"
            >
              {isLoading ? 'Processing...' : 'Authorize Instant Mobile Payment'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
