import React, { useState } from 'react';
import { Music, Menu, X, User, ShieldCheck, ShoppingBag, Disc, Sparkles, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import { isAuthorizedAdmin, OFFICIAL_WHATSAPP_LINK } from '../../lib/firebase';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { isAdminAuthenticated } = useAdmin();

  const isUserAdmin = isAdminAuthenticated || (user?.email && isAuthorizedAdmin(user.email));

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Music Store', path: '/music' },
    { label: 'Promote Music', path: '/promote', highlight: true },
    { label: 'About Hapsin', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'My Purchases', path: '/purchases' },
  ];

  const handleNavClick = (path: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo Brand: PROJECTS MANDATORY */}
          <button
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg group"
            aria-label="Projects Mandatory Homepage"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 via-indigo-600 to-blue-600 p-0.5 shadow-md shadow-rose-950/50 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Disc className="w-5 h-5 text-rose-500 animate-[spin_12s_linear_infinite]" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-['Syne',sans-serif] block leading-none">
                PROJECTS <span className="text-rose-500">MANDATORY</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase block mt-0.5">
                Featuring Hapsin • Music Store
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`px-3 py-2 text-xs lg:text-sm font-semibold rounded-lg transition-colors duration-150 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-white bg-rose-600/20 border border-rose-500/40'
                      : link.highlight
                      ? 'text-amber-300 hover:text-amber-200 hover:bg-amber-950/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  {link.highlight && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* WhatsApp direct chat link (no auto-filled message) */}
            <a
              href={OFFICIAL_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/60 transition"
              title="Chat on WhatsApp (0984 67 96 91)"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <PWAInstallButton variant="nav" />

            {/* Admin shortcut if logged in */}
            {isUserAdmin ? (
              <button
                onClick={() => handleNavClick('/admin/dashboard')}
                className="px-2.5 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 rounded-lg hover:bg-emerald-900/60 transition flex items-center gap-1.5"
                title="Projects Mandatory Admin Dashboard"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('/admin/login')}
                className="text-[11px] text-slate-500 hover:text-slate-300 px-2 py-1 transition"
                title="Admin Sign In"
              >
                Admin
              </button>
            )}

            {/* User Account / Sign in */}
            <button
              onClick={() => handleNavClick('/account')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isAuthenticated
                  ? 'bg-slate-900 text-blue-400 border-blue-900/60'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{isAuthenticated ? (user?.name || 'Account') : 'Sign In'}</span>
            </button>

            {/* Promote Music CTA */}
            <button
              onClick={() => handleNavClick('/promote')}
              className="min-h-[40px] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md shadow-rose-950/40 border border-rose-500/40 transition active:scale-[0.98] flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Promote Music</span>
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <a
              href={OFFICIAL_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-400"
              aria-label="Chat on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>

            <PWAInstallButton variant="nav" />
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white focus:outline-none"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-slate-950/98 border-b border-slate-800 px-4 pt-3 pb-6 animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-1.5 mb-4">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-left transition ${
                    isActive
                      ? 'text-white bg-rose-600/20 border border-rose-500/40'
                      : link.highlight
                      ? 'text-amber-300 bg-amber-950/30 border border-amber-800/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {link.highlight && <Sparkles className="w-4 h-4 text-amber-400" />}
                    <span>{link.label}</span>
                  </div>
                  {link.path === '/purchases' && (
                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
            <a
              href={OFFICIAL_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-sm font-semibold text-emerald-300"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp (0984 67 96 91)</span>
            </a>

            <button
              onClick={() => handleNavClick('/account')}
              className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-slate-200"
            >
              <User className="w-4 h-4 text-blue-400" />
              <span>{isAuthenticated ? (user?.name || 'My Account') : 'Sign In / Account'}</span>
            </button>

            {isUserAdmin ? (
              <button
                onClick={() => handleNavClick('/admin/dashboard')}
                className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-sm font-semibold text-emerald-300"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Projects Mandatory Admin</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('/admin/login')}
                className="text-center text-xs text-slate-500 hover:text-slate-300 py-1"
              >
                Admin Portal
              </button>
            )}

            <button
              onClick={() => handleNavClick('/promote')}
              className="w-full min-h-[46px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>PROMOTE YOUR MUSIC</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

