import React from 'react';
import { ArrowLeft, Shield, Lock, FileText } from 'lucide-react';

export const PrivacyPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 text-left animate-in fade-in">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white py-1.5 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return</span>
      </button>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-['Syne',sans-serif]">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-400">PROJECTS MANDATORY Music Marketplace</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">1. Data Collection & Purpose</h2>
          <p>
            When you purchase music on PROJECTS MANDATORY, we collect minimal information necessary to deliver your digital download and issue your payment receipt (Name, Email Address, and Phone Number for mobile money authorization).
          </p>

          <h2 className="text-base font-bold text-white">2. Payment Security with PayChangu</h2>
          <p>
            We do not store your Mobile Money PINs or credit card numbers. All payments are processed through PayChangu’s PCI-DSS compliant secure infrastructure.
          </p>

          <h2 className="text-base font-bold text-white">3. Direct Downloads</h2>
          <p>
            Audio download links are protected with encrypted, time-limited tokens. We do not sell or distribute your contact information to third-party advertisers.
          </p>
        </div>
      </div>
    </div>
  );
};

export const TermsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 text-left animate-in fade-in">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white py-1.5 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return</span>
      </button>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-['Syne',sans-serif]">
              Terms of Sale & Download License
            </h1>
            <p className="text-xs text-slate-400">PROJECTS MANDATORY Music Marketplace</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-bold text-white">1. Single-Artist Direct Music Purchase</h2>
          <p>
            PROJECTS MANDATORY is a non-streaming digital music marketplace. Every purchase grants you a personal, non-exclusive license to download and store the purchased audio file on your personal devices.
          </p>

          <h2 className="text-base font-bold text-white">2. No Streaming Guarantee</h2>
          <p>
            This website does not offer music streaming, background playback, or subscription radio. Files are delivered directly via download after server-verified payment.
          </p>

          <h2 className="text-base font-bold text-white">3. Pricing & Currency</h2>
          <p>
            All track prices are set in Malawi Kwacha (MWK) by the artist and are subject to change for future purchases.
          </p>

          <h2 className="text-base font-bold text-white">4. Re-downloads & Support</h2>
          <p>
            Each purchase token provides up to 5 download attempts for a duration of 30 days. If you lose your files or encounter network issues, you may look up your order with your checkout email or reach out to support.
          </p>
        </div>
      </div>
    </div>
  );
};
