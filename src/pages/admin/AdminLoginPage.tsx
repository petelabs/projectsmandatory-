import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, ArrowLeft, Disc } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onBack }) => {
  const { login } = useAdmin();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(password);
      showToast('Welcome to PROJECTS MANDATORY Admin Portal', 'success');
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid Admin Passcode';
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
            Artist Admin Portal
          </h1>
          <p className="text-xs text-slate-400">
            Secure management for PROJECTS MANDATORY catalog, song prices, and PayChangu orders.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Admin Master Passcode"
            type="password"
            placeholder="Enter artist passcode..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<KeyRound className="w-4 h-4" />}
            required
            error={error}
          />

          <Button
            type="submit"
            variant="success"
            size="md"
            className="w-full"
            isLoading={isLoading}
            leftIcon={<Lock className="w-4 h-4" />}
          >
            Authenticate & Access Dashboard
          </Button>
        </form>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Default Demo Credentials:</p>
          <p className="font-mono text-emerald-400">Passcode: <code className="bg-slate-900 px-1 py-0.5 rounded">mandatory2026</code></p>
          <p className="text-[11px] text-slate-500">Configure your custom ADMIN_PASSWORD in environment variables for production.</p>
        </div>
      </div>
    </div>
  );
};
