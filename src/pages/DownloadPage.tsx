import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Download, ShoppingBag, ArrowRight, ShieldCheck, Clock, FileAudio } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

interface DownloadPageProps {
  order: Order;
  purchaseToken: string;
  onNavigate: (path: string) => void;
}

export const DownloadPage: React.FC<DownloadPageProps> = ({
  order,
  purchaseToken,
  onNavigate,
}) => {
  const [downloadStatus, setDownloadStatus] = useState<'initiating' | 'downloading' | 'manual_required'>('initiating');
  const [downloadCount, setDownloadCount] = useState(order.downloadCount || 1);
  const hasTriggeredRef = useRef(false);
  const { showToast } = useToast();

  const downloadUrl = api.getDownloadUrl(purchaseToken);

  const startDownload = (isManual = false) => {
    try {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${order.songArtist}_-_${order.songTitle}.mp3`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadStatus('downloading');
      setDownloadCount((prev) => Math.min(prev + 1, order.maxDownloads || 5));
      if (isManual) {
        showToast('Download started to your device', 'success');
      }
    } catch {
      setDownloadStatus('manual_required');
    }
  };

  useEffect(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#dc2626', '#10b981', '#f97316'],
      });
    } catch {
      // ignore
    }

    // Auto trigger download after 1000ms
    const timer = setTimeout(() => {
      startDownload(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-xl mx-auto space-y-6 text-left animate-in fade-in py-2 sm:py-6">
      
      {/* Success Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        
        {/* Visual Green Check */}
        <div className="flex justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-950/60">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        </div>

        {/* Header Messaging */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
            <span>✓ PAYMENT SUCCESSFUL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Syne',sans-serif]">
            Verified Master Audio
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            {downloadStatus === 'initiating' && 'Your download is starting...'}
            {downloadStatus === 'downloading' && 'Your studio audio file download is in progress.'}
            {downloadStatus === 'manual_required' && 'Please tap the button below to initiate your download.'}
          </p>
        </div>

        {/* Purchased Song Details Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
              <img
                src={order.songCover}
                alt={order.songTitle}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider block">
                Purchased Master Track
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {order.songTitle}
              </h3>
              <p className="text-xs text-slate-400 truncate">
                {order.songArtist} • 320kbps MP3 HQ
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Paid Amount</span>
            <span className="text-sm sm:text-lg font-bold text-white font-mono">
              MK {order.amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Direct Download Button (Primary Red CTA) */}
        <div className="space-y-3 pt-1">
          <button
            onClick={() => startDownload(true)}
            className="w-full min-h-[48px] sm:min-h-[52px] bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-xl shadow-rose-950/60 border border-rose-500/40 flex items-center justify-center gap-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Tap Download Song</span>
          </button>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            If your download did not automatically start or was blocked by the browser, tap the button above to save the master audio file directly.
          </p>
        </div>

        {/* Verification & License Details */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-left pt-2 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Tx Reference
            </span>
            <span className="text-slate-200 font-mono text-[11px] truncate block">
              {order.txRef}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Download Quota
            </span>
            <span className="text-emerald-400 font-medium text-[11px]">
              Authorized ({downloadCount}/{order.maxDownloads || 5} downloads)
            </span>
          </div>
        </div>

        {/* Navigation Action Links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pt-2">
          <button
            onClick={() => onNavigate('/purchases')}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <span>View in My Purchases</span>
          </button>

          <button
            onClick={() => onNavigate('/music')}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
          >
            <span>Explore More Songs</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
