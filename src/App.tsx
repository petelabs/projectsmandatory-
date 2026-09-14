import React, { useState, useEffect } from 'react';
import { Song, Order, ArtistSettings } from './types';
import { api } from './lib/api';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { SongGridSkeleton } from './components/common/LoadingSkeleton';
import { ErrorState } from './components/common/EmptyState';

// Pages
import { HomePage } from './pages/HomePage';
import { MusicPage } from './pages/MusicPage';
import { SongDetailPage } from './pages/SongDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentStatusPage } from './pages/PaymentStatusPage';
import { DownloadPage } from './pages/DownloadPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AccountPage } from './pages/AccountPage';
import { MyPurchasesPage } from './pages/MyPurchasesPage';
import { PrivacyPage, TermsPage } from './pages/LegalPages';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [songs, setSongs] = useState<Song[]>([]);
  const [artistSettings, setArtistSettings] = useState<Partial<ArtistSettings>>({});
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [selectedSongForCheckout, setSelectedSongForCheckout] = useState<Song | null>(null);
  const [activeTxRef, setActiveTxRef] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [completedPurchaseToken, setCompletedPurchaseToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { isAdminAuthenticated } = useAdmin();
  const { showToast } = useToast();

  // Handle URL synchronizing
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch initial marketplace data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedSongs, settings] = await Promise.all([
        api.getSongs(),
        api.getArtistSettings().catch(() => null),
      ]);
      setSongs(fetchedSongs);
      if (settings) {
        setArtistSettings(settings);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not connect to store server';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Action handlers
  const handleBuy = (song: Song) => {
    setSelectedSongForCheckout(song);
    navigate(`/checkout/${song.id}`);
  };

  const handleSelectSong = (songId: string) => {
    setSelectedSongId(songId);
    navigate(`/song/${songId}`);
  };

  const handlePaymentInitiated = (txRef: string) => {
    setActiveTxRef(txRef);
    navigate(`/payment/status/${txRef}`);
  };

  const handlePaymentSuccess = (order: Order, purchaseToken: string) => {
    setCompletedOrder(order);
    setCompletedPurchaseToken(purchaseToken);
    navigate(`/download/${purchaseToken}`);
  };

  // Resolve Song from path if direct navigation
  const getActiveSong = (): Song | undefined => {
    if (selectedSongForCheckout) return selectedSongForCheckout;
    if (selectedSongId) return songs.find((s) => s.id === selectedSongId);
    const matchSong = currentPath.match(/\/song\/([a-zA-Z0-9_-]+)/);
    if (matchSong) return songs.find((s) => s.id === matchSong[1]);
    const matchCheckout = currentPath.match(/\/checkout\/([a-zA-Z0-9_-]+)/);
    if (matchCheckout) return songs.find((s) => s.id === matchCheckout[1]);
    return undefined;
  };

  const renderCurrentView = () => {
    if (isLoading && songs.length === 0) {
      return (
        <div className="py-12 max-w-5xl mx-auto space-y-6">
          <div className="h-48 rounded-3xl bg-slate-900/60 animate-pulse"></div>
          <SongGridSkeleton count={6} />
        </div>
      );
    }

    if (error && songs.length === 0) {
      return (
        <div className="py-12">
          <ErrorState
            title="Connection Error"
            error="Could not connect to the PROJECTS MANDATORY music server. Please check your connection."
            onRetry={fetchData}
          />
        </div>
      );
    }

    // Admin Dashboard Route
    if (currentPath === '/admin/dashboard') {
      if (!isAdminAuthenticated) {
        return (
          <AdminLoginPage
            onSuccess={() => navigate('/admin/dashboard')}
            onBack={() => navigate('/')}
          />
        );
      }
      return (
        <AdminDashboardPage
          onLogout={() => navigate('/')}
          onNavigateStore={() => navigate('/music')}
        />
      );
    }

    // Admin Login Route
    if (currentPath === '/admin/login') {
      return (
        <AdminLoginPage
          onSuccess={() => navigate('/admin/dashboard')}
          onBack={() => navigate('/')}
        />
      );
    }

    // Song Detail Route
    if (currentPath.startsWith('/song/')) {
      const song = getActiveSong();
      if (!song) {
        return (
          <div className="py-12 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Song Not Found</h2>
            <p className="text-xs text-slate-400 mb-4">The track you are looking for does not exist or has been removed.</p>
            <button
              onClick={() => navigate('/music')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
            >
              Browse Music
            </button>
          </div>
        );
      }
      return (
        <SongDetailPage
          song={song}
          onBack={() => navigate('/music')}
          onBuy={handleBuy}
        />
      );
    }

    // Checkout Route
    if (currentPath.startsWith('/checkout/')) {
      const song = getActiveSong();
      if (!song) {
        return (
          <div className="py-12 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Checkout Session Expired</h2>
            <p className="text-xs text-slate-400 mb-4">Please select a song from the music catalog to proceed.</p>
            <button
              onClick={() => navigate('/music')}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold"
            >
              Select Song
            </button>
          </div>
        );
      }
      return (
        <CheckoutPage
          song={song}
          onBack={() => navigate(`/song/${song.id}`)}
          onPaymentInitiated={handlePaymentInitiated}
        />
      );
    }

    // Payment Status & Verification Route
    if (currentPath.startsWith('/payment/status/')) {
      const txRef = activeTxRef || currentPath.split('/payment/status/')[1];
      if (!txRef) {
        return (
          <div className="py-12 text-center">
            <h2 className="text-xl font-bold text-white mb-2">No Transaction Reference</h2>
            <button onClick={() => navigate('/music')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs">
              Go to Music
            </button>
          </div>
        );
      }
      return (
        <PaymentStatusPage
          txRef={txRef}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={() => navigate('/music')}
        />
      );
    }

    // Download Route
    if (currentPath.startsWith('/download/')) {
      const token = completedPurchaseToken || currentPath.split('/download/')[1];
      if (!completedOrder || !token) {
        // Fallback or guest direct link
        return (
          <MyPurchasesPage
            onExploreMusic={() => navigate('/music')}
            onSelectSong={handleSelectSong}
          />
        );
      }
      return (
        <DownloadPage
          order={completedOrder}
          purchaseToken={token}
          onNavigate={navigate}
        />
      );
    }

    // Other Standard Pages
    if (currentPath === '/music') {
      return (
        <MusicPage
          songs={songs}
          onBuy={handleBuy}
          onSelectSong={handleSelectSong}
        />
      );
    }

    if (currentPath === '/about') {
      return (
        <AboutPage
          artistInfo={artistSettings}
          onExploreMusic={() => navigate('/music')}
        />
      );
    }

    if (currentPath === '/contact') {
      return <ContactPage />;
    }

    if (currentPath === '/account') {
      return <AccountPage onNavigate={navigate} />;
    }

    if (currentPath === '/purchases') {
      return (
        <MyPurchasesPage
          onExploreMusic={() => navigate('/music')}
          onSelectSong={handleSelectSong}
        />
      );
    }

    if (currentPath === '/privacy') {
      return <PrivacyPage onBack={() => navigate('/')} />;
    }

    if (currentPath === '/terms') {
      return <TermsPage onBack={() => navigate('/')} />;
    }

    // Default Home Page
    return (
      <HomePage
        songs={songs}
        artistInfo={artistSettings}
        onBuy={handleBuy}
        onSelectSong={handleSelectSong}
        onNavigate={navigate}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-rose-500/30 selection:text-rose-200">
      <Header currentPath={currentPath} onNavigate={navigate} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {renderCurrentView()}
      </main>

      <Footer onNavigate={navigate} />
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AdminProvider>
          <AppContent />
        </AdminProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
