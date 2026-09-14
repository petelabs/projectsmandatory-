import React from 'react';
import { Disc, Shield, Smartphone, Heart, ArrowUpRight } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 mt-16 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                <Disc className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white font-['Syne',sans-serif]">
                PROJECTS <span className="text-rose-500">MANDATORY</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official single-artist digital music marketplace. Authentic studio master recordings, direct ownership, zero streaming compression.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                <Shield className="w-3 h-3" />
                <span>Verified Direct Artist Store</span>
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Catalog & Releases</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/music')}
                  className="hover:text-white transition flex items-center gap-1"
                >
                  <span>All Tracks</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/music?filter=latest')}
                  className="hover:text-white transition"
                >
                  Latest Release
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/music?filter=popular')}
                  className="hover:text-white transition"
                >
                  Popular Downloads
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/purchases')}
                  className="hover:text-white transition"
                >
                  My Purchased Songs
                </button>
              </li>
            </ul>
          </div>

          {/* Artist & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Artist & Policy</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('/about')} className="hover:text-white transition">
                  About PROJECTS MANDATORY
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/contact')} className="hover:text-white transition">
                  Contact & Management
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/terms')} className="hover:text-white transition">
                  Terms & Download License
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/privacy')} className="hover:text-white transition">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/admin/login')} className="hover:text-blue-400 text-slate-500 transition">
                  Artist Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Payment Badges & PWA */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Malawi Secure Payments</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant mobile money & card processing powered by PayChangu gateway.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-rose-400 flex items-center justify-center">
                Airtel Money
              </div>
              <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-emerald-400 flex items-center justify-center">
                TNM Mpamba
              </div>
              <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-blue-400 flex items-center justify-center">
                Visa / Cards
              </div>
              <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-semibold text-orange-400 flex items-center justify-center">
                Bank Transfer
              </div>
            </div>
            <div className="pt-2">
              <PWAInstallButton variant="button" className="w-full text-xs" />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 PROJECTS MANDATORY. All master rights reserved. Non-streaming digital music store.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Crafted with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for music ownership
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
