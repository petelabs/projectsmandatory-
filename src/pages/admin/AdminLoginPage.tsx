import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, AlertCircle, Lock } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onBack }) => {
  const { loginWithGoogle } = useAdmin();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      await loginWithGoogle();
      showToast('Admin credentials verified. Welcome to Projects Mandatory Admin Console.', 'success');
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please verify your administrative credentials.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 text-left animate-in fade-in py-10">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white py-1 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Storefront</span>
      </button>

      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/40">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white font-['Syne',sans-serif]">
            Projects Mandatory Admin
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Restricted administrative gateway for catalog moderation, artist track approvals, payouts, and customer inquiries.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full flex items-center justify-center gap-3 py-3.5 font-semibold text-sm shadow-lg shadow-rose-950/60 bg-rose-600 hover:bg-rose-500"
            isLoading={isLoading}
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign In with Authorized Google Account</span>
          </Button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-400 space-y-1.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-slate-300 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Production Security</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Administrative access is strictly protected by role-based Firebase authentication and security rules.
          </p>
        </div>
      </div>
    </div>
  );
};
