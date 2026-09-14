import React, { useState, useEffect } from 'react';
import { Download, Search, ShoppingBag, ShieldCheck, ArrowRight, Music, AlertCircle, RefreshCw } from 'lucide-react';
import { Order } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

interface MyPurchasesPageProps {
  onExploreMusic: () => void;
  onSelectSong?: (songId: string) => void;
}

export const MyPurchasesPage: React.FC<MyPurchasesPageProps> = ({
  onExploreMusic,
  onSelectSong,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [lookupEmail, setLookupEmail] = useState(user?.email || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchOrdersForEmail = async (emailToFetch: string) => {
    if (!emailToFetch.trim()) return;
    setIsLoading(true);
    setHasSearched(true);

    try {
      const results = await api.getOrdersByEmail(emailToFetch.trim());
      setOrders(results);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not retrieve orders';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      setLookupEmail(user.email);
      fetchOrdersForEmail(user.email);
    }
  }, [user]);

  const handleDownload = (order: Order) => {
    if (!order.purchaseToken) {
      showToast('Download token not found for this order.', 'error');
      return;
    }
    const url = api.getDownloadUrl(order.purchaseToken);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${order.songArtist}_-_${order.songTitle}.mp3`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading ${order.songTitle}...`, 'success');
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrdersForEmail(lookupEmail);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left animate-in fade-in">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Syne',sans-serif]">
            My Purchased Music
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Access your authorized studio master downloads anytime.
          </p>
        </div>
        <button
          onClick={onExploreMusic}
          className="min-h-[44px] px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-md self-start sm:self-center"
        >
          <Music className="w-3.5 h-3.5" />
          <span>Browse Store</span>
        </button>
      </div>

      {/* Guest Email Lookup Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
          Find Purchases by Email
        </span>
        <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Enter the email address you used at checkout..."
              type="email"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            size="md"
            isLoading={isLoading}
            leftIcon={<Search className="w-4 h-4" />}
          >
            Find Orders
          </Button>
        </form>
        <p className="text-[11px] text-slate-400">
          💡 Guest purchases are linked to the email address provided during checkout.
        </p>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Purchased Tracks ({orders.length})
          </h3>
          {hasSearched && (
            <button
              onClick={() => fetchOrdersForEmail(lookupEmail)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          )}
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title={hasSearched ? 'No purchases found for this email' : 'No purchases loaded'}
            description={
              hasSearched
                ? 'Check the email address for typos or enter the exact email used during checkout.'
                : 'Enter your email above or browse the catalog to buy your first master track.'
            }
            actionText="Explore Music"
            onAction={onExploreMusic}
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                    <img
                      src={order.songCover}
                      alt={order.songTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-wider block">
                      Paid & Verified
                    </span>
                    <h4 className="text-base font-bold text-white">
                      {order.songTitle}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {order.songArtist} • Purchased on {order.createdAt}
                    </p>
                    <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                      Price: MK {order.amount.toLocaleString()} • Ref: {order.txRef}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleDownload(order)}
                    className="min-h-[44px] px-5 py-2 bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-rose-950/50 flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
