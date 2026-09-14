import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'banner' | 'button';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'button',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else {
      await install();
    }
  };

  // If not installable and not iOS, we still allow an informative trigger or hide
  if (!isInstallable && !isIOS && variant !== 'banner') {
    return null;
  }

  return (
    <>
      {variant === 'nav' && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-400 bg-blue-950/50 hover:bg-blue-900/60 border border-blue-800/60 rounded-full transition ${className}`}
          title="Install PROJECTS MANDATORY App"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}

      {variant === 'button' && (
        <button
          onClick={handleInstallClick}
          className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-100 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 rounded-lg transition active:scale-[0.98] ${className}`}
        >
          <Download className="w-4 h-4 text-blue-400" />
          <span>Install Web App (PWA)</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`p-4 rounded-xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-900 border border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Install PROJECTS MANDATORY</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Fast access on Android & iPhone. Low data usage, instant downloads, and offline library access.
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="shrink-0 min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow-md shadow-blue-950/50 text-center"
          >
            {isIOS ? 'Install on iPhone' : 'Install App'}
          </button>
        </div>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/60"
              aria-label="Close guide"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
                <p className="text-xs text-slate-400">Add to your Home Screen</p>
              </div>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                <p>Tap the <strong className="text-white">Share</strong> button in your Safari browser bar at the bottom of your screen.</p>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                <p>Scroll down the menu and select <strong className="text-white">Add to Home Screen</strong>.</p>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                <p>Tap <strong className="text-white">Add</strong> in the top-right corner to finish installing.</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
