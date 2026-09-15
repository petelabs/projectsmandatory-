import React from 'react';
import { Disc, Shield, ArrowUpRight } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { PayChanguLogo, PaymentMethodsBanner } from './PaymentLogos';

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
                  Latest Releases
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/music?filter=popular')}
                  className="hover:text-white transition"
                >
                  Popular Tracks
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
            <div className="flex items-center gap-2">
              <PayChanguLogo className="h-6" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 bg-teal-950/60 border border-teal-800/60 px-1.5 py-0.5 rounded">
                Master Gateway
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official payment provider powering instant mobile money and card transactions in Malawi:
            </p>
            
            {/* Payment Methods Supported */}
            <div className="pt-1">
              <PaymentMethodsBanner className="w-full max-w-[280px]" />
            </div>

            <div className="pt-3">
              <PWAInstallButton variant="button" className="w-full text-xs" />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 PROJECTS MANDATORY. All rights reserved. Non-streaming digital music store.</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Official Artist Direct Store</span>
            <span>•</span>
            <span>Lilongwe & Blantyre, Malawi</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
