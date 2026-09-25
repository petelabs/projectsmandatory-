import React, { useState, useEffect } from 'react';
import { Song, Order, ArtistSettings, Album, Playlist } from './types';
import { api } from './lib/api';
import {
  subscribePublishedSongs,
  subscribeArtistSettings,
  subscribeAlbums,
  subscribePlaylists,
  publishNotificationToFirestore,
} from './lib/firebase';
import { INITIAL_SONGS, INITIAL_ALBUMS, INITIAL_PLAYLISTS, INITIAL_ARTIST_SETTINGS } from './data/initialData';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { ArtistProvider } from './context/ArtistContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { PlaybackProvider, usePlayback } from './context/PlaybackContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { DataSaverProvider } from './context/DataSaverContext';
import { NotificationProvider } from './context/NotificationContext';
import { LibraryProvider } from './context/LibraryContext';

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
import { AlbumDetailPage } from './pages/AlbumDetailPage';
import { PlaylistDetailPage } from './pages/PlaylistDetailPage';
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
  const [albums, setAlbums] = useState<Album[]>(INITIAL_ALBUMS);
  const [playlists, setPlaylists] = useState<Playlist[]>(INITIAL_PLAYLISTS);
  const [artistSettings, setArtistSettings] = useState<Partial<ArtistSettings>>(INITIAL_ARTIST_SETTINGS);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [selectedSongForCheckout, setSelectedSongForCheckout] = useState<Song | null>(null);
  const [activeTxRef, setActiveTxRef] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [completedPurchaseToken, setCompletedPurchaseToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { isAdminAuthenticated } = useAdmin();
  const { isDark } = useTheme();
  const { playSong, setCatalogSongs } = usePlayback();

  // Keep playback context catalog synced for autoplay recommendations
  useEffect(() => {
    if (songs && songs.length > 0) {
      setCatalogSongs(songs);
    }
  }, [songs, setCatalogSongs]);

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
    const unsubscribeSongs = subscribePublishedSongs(
      (realtimeSongs) => {
        setSongs(realtimeSongs || []);
      },
      (err) => {
        console.warn('Realtime songs subscription fallback:', err);
      }
    );

    const unsubscribeAlbums = subscribeAlbums(
      (realtimeAlbums) => {
        setAlbums(realtimeAlbums || []);
      },
      (err) => {
        console.warn('Realtime albums subscription note:', err);
      }
    );

    const unsubscribePlaylists = subscribePlaylists(
      (realtimePlaylists) => {
        setPlaylists(realtimePlaylists || []);
      },
      (err) => {
        console.warn('Realtime playlists subscription note:', err);
      }
    );

    const unsubscribeSettings = subscribeArtistSettings(
      (settings) => {
        if (settings) {
          setArtistSettings(settings);
        }
      }
    );

    return () => {
      unsubscribeSongs();
      unsubscribeAlbums();
      unsubscribePlaylists();
      unsubscribeSettings();
    };
  }, []);

  // Handlers
  const handleSelectSong = (songId: string) => {
    setSelectedSongId(songId);
    navigate(`/song/${songId}`);
  };

  const handleBuy = (song: Song) => {
    setSelectedSongForCheckout(song);
    navigate(`/checkout/${song.id}`);
  };

  const handlePaymentInitiated = (txRef: string) => {
    setActiveTxRef(txRef);
    navigate(`/payment/status/${txRef}`);
  };

  const handlePaymentSuccess = async (order: Order, token: string) => {
    setCompletedOrder(order);
    setCompletedPurchaseToken(token);
    try {
      await publishNotificationToFirestore({
        title: '💳 Payment Successful',
        body: `Payment of MK ${(order.amount || 0).toLocaleString()} confirmed for "${order.songTitle || 'Track'}". Master download is ready!`,
        category: 'listener',
        type: 'payment',
        link: `/download/${token}`,
      });
    } catch {}
    navigate(`/download/${token}`);
  };

  // Helper route extractors
  const getSongIdFromRoute = (): string | null => {
    const songMatch = currentPath.match(/^\/song\/([^/]+)/);
    if (songMatch) return songMatch[1];
    const checkoutMatch = currentPath.match(/^\/checkout\/([^/]+)/);
    if (checkoutMatch) return checkoutMatch[1];
    return selectedSongId;
  };

  const getArtistIdFromRoute = (): string | null => {
    const match = currentPath.match(/^\/artist\/([^/]+)/);
    if (match && match[1] !== 'studio') return match[1];
    return null;
  };

  const getAlbumIdFromRoute = (): string | null => {
    const match = currentPath.match(/^\/album\/([^/]+)/);
    if (match) return match[1];
    return null;
  };

  const getPlaylistIdFromRoute = (): string | null => {
    const match = currentPath.match(/^\/playlist\/([^/]+)/);
    if (match) return match[1];
    return null;
  };

  const getActiveSong = (): Song | undefined => {
    const id = getSongIdFromRoute();
    if (!id) return undefined;
    return songs.find((s) => s.id === id) || (selectedSongForCheckout?.id === id ? selectedSongForCheckout : undefined);
  };

  const isDeepRoute =
    currentPath.startsWith('/song/') ||
    currentPath.startsWith('/album/') ||
    currentPath.startsWith('/playlist/') ||
    currentPath.startsWith('/checkout/') ||
    currentPath.startsWith('/payment/') ||
    currentPath.startsWith('/download/') ||
    currentPath.startsWith('/artist/') ||
    currentPath === '/pricing' ||
    currentPath === '/about' ||
    currentPath === '/contact' ||
    currentPath === '/privacy' ||
    currentPath === '/terms' ||
    currentPath === '/admin' ||
    currentPath === '/admin/dashboard';

  // Router View Renderer
  const renderCurrentView = () => {
    if (isLoading) {
      return <SongGridSkeleton count={4} />;
    }

    if (error) {
      return (
        <ErrorState
          title="Catalogue Unavailable"
          message={error}
          actionLabel="Retry Connection"
          onAction={() => window.location.reload()}
        />
      );
    }

    // Admin Routes
    if (currentPath === '/admin/login' || currentPath === '/admin') {
      if (isAdminAuthenticated) {
        return <AdminDashboardPage onNavigate={navigate} />;
      }
      return <AdminLoginPage onLoginSuccess={() => navigate('/admin/dashboard')} />;
    }

    if (currentPath === '/admin/dashboard') {
      if (!isAdminAuthenticated) {
        return <AdminLoginPage onLoginSuccess={() => navigate('/admin/dashboard')} />;
      }
      return <AdminDashboardPage onNavigate={navigate} />;
    }

    // Artist Studio Portal
    if (currentPath === '/artist/studio') {
      return (
        <ArtistStudioPage
          onNavigate={navigate}
          onBack={() => navigate('/')}
        />
      );
    }

    // Artists Directory
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
          albums={albums}
          onSelectSong={handleSelectSong}
          onNavigate={navigate}
        />
      );
    }

    // Album Detail Route
    const routeAlbumId = getAlbumIdFromRoute();
    if (routeAlbumId) {
      const activeAlbum = albums.find((al) => al.id === routeAlbumId) || albums[0];
      return (
        <AlbumDetailPage
          album={activeAlbum}
          songs={songs}
          onBack={() => window.history.back()}
          onNavigate={navigate}
          onBuySong={handleBuy}
        />
      );
    }

    // Playlist Detail Route
    const routePlaylistId = getPlaylistIdFromRoute();
    if (routePlaylistId) {
      const activePlaylist = playlists.find((pl) => pl.id === routePlaylistId) || playlists[0];
      return (
        <PlaylistDetailPage
          playlist={activePlaylist}
          songs={songs}
          onBack={() => window.history.back()}
          onNavigate={navigate}
          onBuySong={handleBuy}
        />
      );
    }

    // Dedicated Search Route
    if (currentPath.startsWith('/search')) {
      return (
        <SearchPage
          songs={songs}
          albums={albums}
          playlists={playlists}
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
        albums={albums}
        playlists={playlists}
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
      {/* Mobile-First Frame container */}
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

        {/* Persistent Mini-Player */}
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
      <DataSaverProvider>
        <ToastProvider>
          <AuthProvider>
            <AdminProvider>
              <ArtistProvider>
                <SubscriptionProvider>
                  <NotificationProvider>
                    <PlaybackProvider>
                      <LibraryProvider>
                        <AppContent />
                      </LibraryProvider>
                    </PlaybackProvider>
                  </NotificationProvider>
                </SubscriptionProvider>
              </ArtistProvider>
            </AdminProvider>
          </AuthProvider>
        </ToastProvider>
      </DataSaverProvider>
    </ThemeProvider>
  );
}
