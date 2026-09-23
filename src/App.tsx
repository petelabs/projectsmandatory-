import React, { useState, useEffect } from 'react';
import { Song, Order, ArtistSettings } from './types';
import { api } from './lib/api';
import {
  subscribePublishedSongs,
  subscribeArtistSettings,
} from './lib/firebase';
import { INITIAL_SONGS } from './data/initialData';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { ArtistProvider } from './context/ArtistContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { PlaybackProvider, usePlayback } from './context/PlaybackContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Navigation & Player Components
import { TopAppBar } from './components/navigation/TopAppBar';
import { BottomNavigation } from './components/navigation/BottomNavigation';
import { MiniPlayer } from './components/player/MiniPlayer';
import { NowPlayingModal } from './components/player/NowPlayingModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { SongGridSkeleton } from './components/common/LoadingSkeleton';
import { ErrorState } from './components/common/EmptyState';

// Pages
import { HomePage } from './pages/HomePage';
import { MusicPage } from './pages/MusicPage';
import { SearchPage } from './pages/SearchPage';
import { LibraryPage } from './pages/LibraryPage';
import { SongDetailPage } from './pages/SongDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentStatusPage } from './pages/PaymentStatusPage';
import { DownloadPage } from './pages/DownloadPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AccountPage } from './pages/AccountPage';
import { MyPurchasesPage } from './pages/MyPurchasesPage';
import { PrivacyPage, TermsPage } from './pages/LegalPages';
import { PromoteMusicPage } from './pages/PromoteMusicPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ArtistStudioPage } from './pages/artist/ArtistStudioPage';
import { ArtistsListPage } from './pages/artist/ArtistsListPage';
import { ArtistProfilePage } from './pages/artist/ArtistProfilePage';
import { PricingPlansPage } from './components/monetization/PricingPlansPage';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [songs, setSongs] = useState<Song[]>(INITIAL_SONGS);
  const [artistSettings, setArtistSettings] = useState<Partial<ArtistSettings>>({});
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [selectedSongForCheckout, setSelectedSongForCheckout] = useState<Song | null>(null);
  const [activeTxRef, setActiveTxRef] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [completedPurchaseToken, setCompletedPurchaseToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { isAdminAuthenticated } = useAdmin();
  const { isDark } = useTheme();
  const { playSong } = usePlayback();

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

  // Real-time Firestore synchronizer
  useEffect(() => {
    // Subscribe to published songs in real-time
    const unsubscribeSongs = subscribePublishedSongs(
      (realtimeSongs) => {
        if (realtimeSongs && realtimeSongs.length > 0) {
          // Merge with initial catalog to ensure rich presentation
          const existingIds = new Set(realtimeSongs.map((s) => s.id));
          const merged = [...realtimeSongs, ...INITIAL_SONGS.filter((s) => !existingIds.has(s.id))];
          setSongs(merged);
        } else {
          api
            .getSongs()
            .then((apiSongs) => {
              if (apiSongs.length > 0) {
                const existingIds = new Set(apiSongs.map((s) => s.id));
                setSongs([...apiSongs, ...INITIAL_SONGS.filter((s) => !existingIds.has(s.id))]);
              }
            })
            .catch(() => {});
        }
      },
      (err) => {
        console.warn('Real-time sync notice:', err.message);
      }
    );

    // Subscribe to artist settings
    const unsubscribeSettings = subscribeArtistSettings((settings) => {
      if (settings) {
        setArtistSettings(settings);
      }
    });

    return () => {
      unsubscribeSongs();
      unsubscribeSettings();
    };
  }, []);

  // Action handlers
  const handleBuy = (song: Song) => {
    setSelectedSongForCheckout(song);
    navigate(`/checkout/${song.id}`);
  };

  const handleSelectSong = (songId: string) => {
    setSelectedSongId(songId);
    const found = songs.find((s) => s.id === songId);
    if (found) {
      playSong(found, songs);
    }
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

  // Detect artist URL parameter or route
  const getArtistIdFromRoute = (): string | null => {
    const matchArtist = currentPath.match(/\/artist\/([a-zA-Z0-9_-]+)/);
    if (matchArtist && matchArtist[1] !== 'studio') {
      return matchArtist[1];
    }
    const params = new URLSearchParams(window.location.search);
    const queryArtist = params.get('artist');
    if (queryArtist) return queryArtist;
    return null;
  };

  const isDeepRoute =
    currentPath.startsWith('/song/') ||
    currentPath.startsWith('/checkout/') ||
    currentPath.startsWith('/payment/') ||
    currentPath.startsWith('/download/') ||
    currentPath.startsWith('/artist/') ||
    currentPath === '/pricing' ||
    currentPath === '/plans' ||
    currentPath === '/about' ||
    currentPath === '/contact' ||
    currentPath === '/privacy' ||
    currentPath === '/terms' ||
    currentPath === '/promote';

  const renderCurrentView = () => {
    if (isLoading && songs.length === 0) {
      return (
        <div className="py-6 space-y-4">
          <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <SongGridSkeleton count={4} />
        </div>
      );
    }

    if (error && songs.length === 0) {
      return (
        <div className="py-12">
          <ErrorState
            title="Connection Notice"
            error="Connecting to Projects Mandatory music catalog. Please ensure you have an active network connection."
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }

    // Admin Dashboard Route
    if (currentPath === '/admin/dashboard' || currentPath === '/admin') {
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

    // Artist Studio Portal Route
    if (currentPath === '/artist/studio') {
      return (
        <ArtistStudioPage
          onNavigateStore={() => navigate('/music')}
          onNavigateArtistProfile={(artistId) => navigate(`/artist/${artistId}`)}
        />
      );
    }

    // Artists Directory Route
    if (currentPath === '/artists') {
      return (
        <ArtistsListPage
          onSelectArtist={(artistId) => navigate(`/artist/${artistId}`)}
          onJoinAsArtist={() => navigate('/artist/studio')}
        />
      );
    }

    // Individual Public Artist Profile Route
    const routeArtistId = getArtistIdFromRoute();
    if (routeArtistId) {
      return (
        <ArtistProfilePage
          artistId={routeArtistId}
          songs={songs}
          onSelectSong={handleSelectSong}
          onNavigate={navigate}
        />
      );
    }

    // Dedicated Search Route
    if (currentPath.startsWith('/search')) {
      return (
        <SearchPage
          songs={songs}
          onSelectSong={handleSelectSong}
          onNavigate={navigate}
        />
      );
    }

    // Dedicated Library Route
    if (currentPath.startsWith('/library')) {
      return (
        <LibraryPage
          songs={songs}
          onNavigate={navigate}
        />
      );
    }

    // Dedicated Profile / Account Route
    if (currentPath === '/profile' || currentPath === '/account') {
      return <AccountPage onNavigate={navigate} />;
    }

    // Dedicated Music Route
    if (currentPath === '/music') {
      return (
        <MusicPage
          songs={songs}
          onSelectSong={handleSelectSong}
          onNavigate={navigate}
        />
      );
    }

    // Subscription & Pricing Plans Route
    if (currentPath === '/pricing' || currentPath === '/plans') {
      return (
        <PricingPlansPage
          onNavigate={navigate}
          onBack={() => navigate('/')}
        />
      );
    }

    // Promote Music Route
    if (currentPath === '/promote') {
      return (
        <PromoteMusicPage
          onBack={() => navigate('/')}
          onExploreMusic={() => navigate('/music')}
        />
      );
    }

    // Song Detail Route
    if (currentPath.startsWith('/song/')) {
      const song = getActiveSong();
      if (!song) {
        return (
          <div className="py-12 text-center">
            <h2 className="text-xl font-bold mb-2">Song Not Found</h2>
            <p className="text-xs text-slate-400 mb-4">
              The track you are looking for does not exist or has been removed.
            </p>
            <button
              onClick={() => navigate('/music')}
              className="px-4 py-2 bg-[#1455D9] text-white rounded-xl text-xs font-semibold"
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
            <h2 className="text-xl font-bold mb-2">Checkout Session Expired</h2>
            <p className="text-xs text-slate-400 mb-4">
              Please select a song from the music catalog to proceed.
            </p>
            <button
              onClick={() => navigate('/music')}
              className="px-4 py-2 bg-[#1455D9] text-white rounded-xl text-xs font-semibold"
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
            <h2 className="text-xl font-bold mb-2">No Transaction Reference</h2>
            <button
              onClick={() => navigate('/music')}
              className="px-4 py-2 bg-[#1455D9] text-white rounded-xl text-xs"
            >
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

    if (currentPath === '/purchases') {
      return (
        <MyPurchasesPage
          onExploreMusic={() => navigate('/music')}
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

    if (currentPath === '/privacy') {
      return <PrivacyPage onBack={() => navigate('/')} />;
    }

    if (currentPath === '/terms') {
      return <TermsPage onBack={() => navigate('/')} />;
    }

    // Default: Home Page
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
    <div
      className={`min-h-screen transition-colors duration-200 font-['Inter','Plus_Jakarta_Sans',sans-serif] ${
        isDark
          ? 'bg-[#080B12] text-[#F5F7FA] selection:bg-[#1455D9]/30 selection:text-white'
          : 'bg-[#F7F8FA] text-[#111827] selection:bg-[#1455D9]/20 selection:text-[#1455D9]'
      }`}
    >
      {/* Mobile-First Frame container: Full width on phone, neatly centered on tablet/desktop */}
      <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto min-h-screen flex flex-col relative shadow-2xl">
        
        {/* Top App Bar */}
        <TopAppBar
          currentPath={currentPath}
          onNavigate={navigate}
          showBack={isDeepRoute}
        />

        {/* Scrollable Main Content */}
        <main className="flex-1 px-4 pt-3 pb-36">
          {renderCurrentView()}
        </main>

        {/* Persistent Mini-Player (sits right above bottom navigation) */}
        <MiniPlayer />

        {/* 5-Item Bottom Navigation */}
        <BottomNavigation
          currentPath={currentPath}
          onNavigate={navigate}
        />

        {/* Full-Screen Dark Immersive Now Playing Modal */}
        <NowPlayingModal onNavigate={navigate} />

        {/* Offline Status */}
        <OfflineIndicator />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AdminProvider>
            <ArtistProvider>
              <SubscriptionProvider>
                <PlaybackProvider>
                  <AppContent />
                </PlaybackProvider>
              </SubscriptionProvider>
            </ArtistProvider>
          </AdminProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
