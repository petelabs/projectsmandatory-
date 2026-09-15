import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft, Disc, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onBack }) => {
  const { loginWithGoogle, authorizedEmails } = useAdmin();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const email = await loginWithGoogle();
      showToast(`Welcome back, Hapsin Administrator (${email})`, 'success');
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 text-left animate-in fade-in py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white py-1 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Music Store</span>
      </button>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white font-['Syne',sans-serif]">
            Hapsin Admin Portal
          </h1>
          <p className="text-xs text-slate-400">
            Secure administrative access for managing Hapsin music catalog, orders, and artist promotion requests.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <Button
            type="button"
            variant="success"
            size="lg"
            className="w-full flex items-center justify-center gap-3 py-3.5 font-semibold text-sm shadow-lg shadow-emerald-950/60"
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
            <span>Sign In with Google Account</span>
          </Button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Authorized Administrator Accounts:</span>
          </div>
          <ul className="space-y-1 font-mono text-[11px] text-emerald-400 pl-6 list-disc">
            {authorizedEmails.map((email) => (
              <li key={email}>{email}</li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-500 pt-1">
            Zero environment variable dependencies required. Simply authenticate with one of the authorized Google accounts above.
          </p>
        </div>
      </div>
    </div>
  );
};
