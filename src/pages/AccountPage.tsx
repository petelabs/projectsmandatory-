import React, { useState } from 'react';
import { User, LogIn, LogOut, ShieldCheck, Mail, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useToast } from '../context/ToastContext';

interface AccountPageProps {
  onNavigate: (path: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, loginWithGoogle, loginWithEmail, logout } = useAuth();
  const { showToast } = useToast();

  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isEmailLogin, setIsEmailLogin] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      showToast('Signed in with Google successfully!', 'success');
    } catch {
      showToast('Google sign-in failed. Try email login.', 'error');
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    loginWithEmail(emailInput, nameInput);
    showToast(`Signed in as ${emailInput}`, 'success');
  };

  if (isAuthenticated && user) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-left animate-in fade-in">
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 shadow-xl space-y-6">
          
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xl overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                <p className="text-xs text-slate-400">{user.email}</p>
                {user.isGoogleUser && (
                  <span className="inline-block text-[10px] text-blue-400 font-semibold mt-0.5">
                    Google Connected Account
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                showToast('Logged out of session', 'info');
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Shortcuts */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Account Management
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate('/purchases')}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">My Purchases</h4>
                    <p className="text-[11px] text-slate-400">Download purchased tracks</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => onNavigate('/music')}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Music Store</h4>
                    <p className="text-[11px] text-slate-400">Browse official releases</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 text-left animate-in fade-in py-4">
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold text-white font-['Syne',sans-serif]">
            Sign In to Account
          </h1>
          <p className="text-xs text-slate-400">
            Optional account to keep your purchase history synced across devices.
          </p>
        </div>

        {/* Google Sign-in */}
        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            className="w-full min-h-[48px] rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2.5 transition active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase font-mono tracking-wider">
              Or with email
            </span>
            <div className="border-t border-slate-800 w-full"></div>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <Input
              label="Your Name (Optional)"
              placeholder="e.g. Kondwani"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="yourname@gmail.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
            />
            <Button type="submit" variant="secondary" size="md" className="w-full">
              Sign In with Email
            </Button>
          </form>
        </div>

        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          * Account creation is NOT mandatory. You can purchase and download songs directly as a guest at any time.
        </p>
      </div>
    </div>
  );
};
