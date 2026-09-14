import React, { useState } from 'react';
import { Music, Menu, X, User, ShieldCheck, ShoppingBag, Disc } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { isAdminAuthenticated } = useAdmin();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Music', path: '/music' },
    { label: 'About', path: '/about' },
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
          
          {/* Logo Brand */}
          <button
            onClick={() => handleNavClick('/')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg group"
            aria-label="PROJECTS MANDATORY Homepage"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-rose-600 p-0.5 shadow-md shadow-blue-950/50 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Disc className="w-5 h-5 text-rose-500 animate-[spin_12s_linear_infinite]" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-['Syne',sans-serif] block leading-none">
                PROJECTS <span className="text-rose-500">MANDATORY</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase block mt-0.5">
                Official Music Store
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`px-3 py-2 text-xs lg:text-sm font-semibold rounded-lg transition-colors duration-150 ${
                    isActive
                      ? 'text-white bg-blue-600/20 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* PWA Install in nav */}
            <PWAInstallButton variant="nav" />

            {/* Admin shortcut if logged in */}
            {isAdminAuthenticated && (
              <button
                onClick={() => handleNavClick('/admin/dashboard')}
                className="px-2.5 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 rounded-lg hover:bg-emerald-900/60 transition flex items-center gap-1.5"
                title="Admin Dashboard"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
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

            {/* Primary Action Button */}
            <button
              onClick={() => handleNavClick('/music')}
              className="min-h-[40px] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md shadow-rose-950/40 border border-rose-500/40 transition active:scale-[0.98] flex items-center gap-1.5"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Explore Music</span>
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex sm:hidden items-center gap-2">
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
                      ? 'text-white bg-blue-600/20 border border-blue-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.path === '/purchases' && (
                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2.5">
            <button
              onClick={() => handleNavClick('/account')}
              className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-slate-200"
            >
              <User className="w-4 h-4 text-blue-400" />
              <span>{isAuthenticated ? (user?.name || 'My Account') : 'Sign In / Account'}</span>
            </button>

            {isAdminAuthenticated ? (
              <button
                onClick={() => handleNavClick('/admin/dashboard')}
                className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-sm font-semibold text-emerald-300"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('/admin/login')}
                className="text-center text-xs text-slate-500 hover:text-slate-300 py-1"
              >
                Artist Admin Portal
              </button>
            )}

            <button
              onClick={() => handleNavClick('/music')}
              className="w-full min-h-[46px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2"
            >
              <Music className="w-4 h-4" />
              <span>EXPLORE ALL SONGS</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
